# AGENTS.md

DeepSeek Harness 是基于 Cordis 的全插件化 Agent Harness。仓库代码、包清单、配置、测试和实际执行的脚本是当前事实来源。开发交流默认使用简体中文，代码标识符、命令、路径、协议字段、报错原文和专有技术名称保留其原始形式。

## 规则优先级

- 系统、运行环境和用户当前请求优先于本文件。
- 进入子目录前查找更具体的 `AGENTS.md`，子目录规则优先。
- 用户未明确要求操作时按对话处理，只回答问题，不修改文件。
- 用户明确要求查找、分析、调试、修改或执行时，按请求直接处理，不因形式标签缺失而拒绝。
- 创建、删除、重构或影响范围不清晰的开发任务，先列出相关文件和一个方案，等待用户确认后执行。
- 用户已明确指定文件、目标和修改内容时视为已授权，不重复确认。

## 交流与输出

- 回复使用简体中文。仅在代码、命令、路径、标识符、引用原文或准确表达技术概念时使用英文。
- 表达简洁，优先使用短段落、列表和表格。不要输出冗长的过程记录或复述工具日志。
- 不使用 emoji。需要醒目标记时使用 `[正确]`、`[错误]`、`[注意]`。
- 不添加无意义的括号补充；路径和文件名直接使用反引号标示。
- 只汇报实际完成的修改和实际运行的检查。未运行的检查必须明确说明，不得暗示通过。

## 开始工作前

1. 使用 `pwd` 确认当前工作目录，不从 checkout 路径推断工作目录。
2. 检查当前分支和工作区状态。已有修改视为用户所有，不回退、不覆盖、不暂存、不格式化，也不混入无关任务。
3. 阅读目标包的 `package.json`、拥有行为的源码、相邻测试、配置组合及适用规范，不根据目录名或过时说明猜测行为。
4. 确定最小修改范围和拥有该行为的包。避免全仓修复器、无关重构和无关生成物更新。

复杂开发任务在编辑前按以下顺序沟通：

1. 列出相关文件及内容概要。
2. 用一句话复述需求。
3. 提供一个推荐方案和伪代码大纲。
4. 等待用户确认后实施。

用户要求立即执行、目标修改足够明确或已确认既有方案时，直接实施。

## 项目结构

```text
apps/       dsh CLI 和 Web 构建入口
packages/   按能力分组的 @deepseek-ai/dsh-* 工作区
vendor/     固定版本的 Cordis 源码
python/     Python SDK 和捆绑运行时
native/     原生源码和平台包
.agents/    Agent 工作流和可复用技能
docs/       文档元数据和资源
scripts/    仓库检查与生成器
website/    文档网站投影
```

仅 `dsh` profile 是受支持的 Node 应用启动入口。包级 bin、demo 和公开 SDK argv escape 不属于受支持入口。

## 实现原则

- 优先写最少且完整的实现，删除重复分支、无效抽象、推测性兼容层和无消费方的扩展点。
- 首个正式版本发布前优先正确基础，不添加兼容 shim。后端拒绝旧磁盘格式，SQLite 使用单调递增的 `SCHEMA_VERSION`，`dsh-session` 的 `SESSION_FORMAT_VERSION` 保持 `0` 且不承诺兼容。
- 通过插件扩展点增加行为。只有行为无法合理归属插件时才修改 `agent-loop`。
- 一个 capability 同时考虑 Service Definition、Service Provider 和 Consumer。只有它们需要独立演进时才拆分角色。
- 优先采用维护良好的依赖，以减少自有实现和测试负担。
- 在拥有决策的包边界显式解析默认值，不把部署选择隐藏在 `run()` 中。
- 随部署变化的插件选择必须是经过验证的 `Config` 字段；协议常量、外部规范和安全不变量保持固定。
- 可独立判断的错误配置在加载时失败，其他错误配置在最早可判断的位置失败。不得静默跳过缺失引用。

## Cordis 与生命周期

- 所有注册都是 effect。贡献通过 `ctx.effect()` 或 `ctx.on()` 注册，registry 的 `register()` 返回 disposer。
- Waterfall listener 调用 `next()` 表示继续委托；不调用 `next()` 的返回会短路后续处理。
- Typed Event 使用 declaration merging 和可合并扩展的 map。事件 JSDoc 包含 `@mode` 和 payload `@param`；payload 不携带 scope key 时按仓库约定标记 `@dshScopeScan unsupported`。
- Runtime invariant 验证包所拥有的事件关系或可变数据关系，不重复检查静态类型、Service 是否存在或固定纯函数示例。
- 所有异步操作必须被 `await`、返回给调用方、交给明确的生命周期追踪，或显式标记为有意的 fire-and-forget。工具、模型、worker、subprocess 和 subagent 边界应传递取消信号。

## Session 与模型可见行为

- 模型请求中的所有内容必须能从 Session Log 重建。新增模型可见输入必须新增对应 Session Event。
- 改动 `agent-loop`、Session 生命周期或 `SessionEventMap` 时，同时更新 TypeScript 和 Python SDK projection。
- 工具设计同时覆盖 Host 和 Web 展示。Host presenter 保持纯函数，Web card 从原始事件和持久化结果元数据派生。
- Client UI 文案必须放入 typed locale dictionary，并通过翻译字符串或 localized prop 传入 primitive。

## TypeScript 与命名

- npm 包统一命名为 `@deepseek-ai/dsh-<name>`。Vendored 包保持重新划定的 scope 且设为 private。Harness 包同时在 `peerDependencies` 和 `devDependencies` 中声明 `@deepseek-ai/cordis`。
- 全仓使用 ESM。跨包引用使用包名，包内相对导入使用 `.ts` 后缀。
- 遵循现有 TypeScript 命名：变量和函数使用 `camelCase`，类和类型使用 `PascalCase`，常量按相邻代码选择 `UPPER_SNAKE_CASE` 或语义化 `camelCase`，文件名遵循所属包现有风格。不要把其他语言的 `snake_case` 规则强加给现有 TypeScript API。
- 保持严格类型。外部输入先作为 `unknown` 缩窄；有意使用 `any` 时只做局部抑制，并说明无法缩窄的原因。
- 跨进程、wire、存储和包边界的不透明标识符使用 branded type，不使用裸字符串。
- 信任同进程内已经类型化的值；验证 parser、配置、队列、模型或工具 JSON、持久化、文件、worker、process 和 wire 输入。
- 封闭判别联合保持穷尽，通常以 `assertNever` 收尾；可合并扩展联合使用有明确说明的 fallback。
- Host 与 Client 并存的包使用各自的 leaf tsconfig，根 tsconfig 仅作为 solution。
- 保持源码程序与构建产物程序分离。静态检查解析 workspace source；消费构建产物的检查必须声明并先构建对应依赖。
- Public export 为非显而易见的行为提供简洁 JSDoc；函数类导出说明参数和非 `void` 返回值。

## 注释与文档

- 不追求零注释。仅为代码和类型无法表达的生命周期、所有权、顺序、失败、安全和兼容约束写注释。
- 不写复述代码的注释、控制流解说、修改过程、评审对话或推理记录。空 `catch` 必须说明吞掉的具体错误及原因，并保持 `try` 只包围一个语句。
- 非文档任务不创建 README、CHANGELOG、TODO 或设计文档。行为契约要求更新现有文档、用户明确要求文档或仓库 gate 要求生成物时除外。
- 修改 prose 前使用 `dsh-prose-standard`。文档任务使用对应文档 skill。
- 先修改拥有行为的源码或场景，再通过仓库命令更新 catalog、snapshot、网站投影等派生文件。除非生成器声明文件由人工维护，否则不手改生成物。

## 配置、密钥与边界

- 使用仓库现有配置体系，不引入通用的单文件 `config.yaml` 或 `config.json` 约定。
- `cordis.yml` 仅在插件 `config` 和 entry `disabled` 下接受 `!!js`，不得使用 `!js`；其他元数据保持 literal。
- Raw 和 Web `cordis.yml` 中的 bare plugin 必须出现在 resolver manifest 的 `dependencies`。
- 真实 API 测试和 demo 从根 `.env` 读取 `DEEPSEEK_API_KEY` 及可选的 `DEEPSEEK_BASE_URL`。不得提交、回显或在回复中暴露密钥、token、credentials、私有连接串及其他敏感值。
- 访问数据库、外部 API、凭据、用户目录或仓库外路径时遵守当前运行环境的权限和 approval policy。不得绕过产品沙箱、权限限制或真实测试失败。

## 测试与验证

- 文件修改后必须回读关键片段或检查 diff，确认修改落在预期位置且没有覆盖用户已有工作。
- 运行能覆盖改动的最小检查。普通逻辑优先运行 owning Vitest 文件；共享契约增加相邻消费者测试；manifest、exports、构建路径和 artifact 改动运行相关 build 与 hygiene 检查。
- 新增可机械验证的仓库不变量时，将其接入实际执行的 repository check，并加入至少一个证明无效输入被拒绝的测试。使用局部且有理由的例外，不全局关闭规则。
- 测试描述行为。行为变化时更新已过时测试，不保留错误预期。
- 测试选择与 coverage 选择是两件事。`pnpm run test` 不能代替 `test:coverage` gate。
- 模型、CLI、终端或编辑器可见输出使用拥有该输出的真实 profile、snapshot 或 expected-output 场景验证。
- Web 改动通过现有 `dsh web` 应用验证，不把独立 Vite shell 当作完整应用。Client plugin HMR 依赖同一 checkout 中运行的 `pnpm run dev:web`；Web shell 和普通包修改需重建相关 Web artifact 并刷新现有 GUI。
- 产品可见 GUI 行为按 `record-browser-gif` skill 从真实应用入口录制证据。
- 修改文本后运行 `git diff --check`。文件以一个换行结尾。
- Push、标记 ready 或声称检查通过前使用 `dsh-pre-push-checks`，只报告实际执行的命令。

常用入口：

```sh
pnpm run test
pnpm run test:coverage
pnpm run typecheck
pnpm run lint
pnpm run build
pnpm run hygiene
pnpm run doc-sync
pnpm dsh --profile headless "task"
```

`package.json` scripts 和 `dsh-pre-push-checks` 是完整命令与 gate 清单。

## Git 与文件操作

- 删除文件、回退代码、覆盖已有修改、改写历史和批量移动前必须获得用户明确确认。
- 用户明确要求 Git commit 时，只提交本任务文件，不自动 push。提交前运行适用检查，并检查 staged diff。
- Commit message 遵循仓库现有历史和用户指定格式，不写星级自评、过程复盘或问题解决报告，除非用户明确要求。
- 改写已发布历史只使用 `--force-with-lease`；远端发生移动时中止。禁止原始 `--force`。
- 把 `vendor/` 视为固定第三方源码，避免无关修改。有意更新 vendored code 时保留 manifest 元数据，并运行相关测试和构建。

### Git提交规范
- 提交前置条件：编译/语法检查已成功，问题基本解决
- commit说明格式：
  ```
  [任务] 任务标题

  成果：
  - 完成的功能点

  自评：★★★★☆

  问题与解决：
  - 问题 → 解决方法
  ```
- 自评标准：结合开发流程评估
  - 1星：基本可用但有明显不足
  - 3星：按流程完成符合预期
  - 5星：超预期完成且代码质量高
- 仅本地commit，不执行push

## 任务识别

用户消息按以下类型处理：

1. **对话** - 仅回答问题，不改代码
2. **查找：** → 搜索文件/代码片段，展示结果
3. **创建：** → 新建文件/目录结构，执行简化流程
4. **修改：** → 直接编辑指定内容，无需确认
5. **删除：** → 删除文件/代码块，需确认
6. **重构：** → 重命名/移动/重组，执行简化流程
7. **分析：** → 代码审查/性能/依赖分析，输出报告
8. **调试：** → 定位问题/解释错误，提供诊断
9. **开发：** → 复杂功能开发，执行完整流程
10. **Git：** → Git版本控制操作
    - 提交：编译/语法检查已成功，问题基本解决。将任务成果/自评1-5星/问题与解决方法写入commit说明
    - 其他操作：分支/合并/回退/查看历史等

[注意] 未明确标注时，默认为对话模式
[注意] 创建/重构执行简化流程：列文件→提供方案→等确认

## 开发流程

### 完整流程 - 用于开发任务

一次性完成最后需用户确认：
```
步骤1 → 列出相关文件及内容概要
步骤2 → 一句话复述需求
步骤3 → 提供1个方案及伪代码大纲
步骤4 → 等待"确认"后才编辑代码
```

### 简化流程 - 用于创建/重构任务

```
步骤1 → 列出相关文件
步骤2 → 提供方案大纲
步骤3 → 等待"确认"后才执行
```

[注意] 跳步=自动终止

## 完成标准

- 修改范围与用户请求一致，没有混入无关文件。
- 实现位于正确的插件、Service 或拥有行为的包。
- 类型、配置、Session、Host、Client 和 Python 投影按影响范围保持一致。
- 已运行最小相关验证；未运行或无法运行的检查在最终回复中明确列出。
- 最终回复简要说明结果、主要文件和验证命令，不输出冗长执行过程。

# Agent Note: Git Remote 与详情面板

Status: implemented

[English](2026-09-01-git-remote-details-panel.md) | 中文

## Problem

Web 客户端需要查看仓库状态和提交，同时不能恢复已移除的 `host/apiproxy` 架构，也不能替换官方工具详情渲染器。

## Decision

`api-git` 包拥有独立的 Typert Remote 命名空间。Web profile 挂载其 Host 服务，客户端 Remote 装配挂载生成的 contribution，`ui-git` 占用 `ui-chat` 声明的 `conversation.details.git` slot。

详情栏保留工具详情，并在工具和 Git 标签之间切换。Git 视图状态和仓库结果保留在组件本地，因为它们是展示状态而不是会话数据。

Remote 提供仓库状态、分支与上游计数、工作树变更、有界提交历史、提交文件列表和提交差异。操作只读并使用 `execFile('git', ['-C', ...])`；请求值不会进入 shell 命令。

## Alternatives considered

**恢复 `host/apiproxy`。** 官方 Host API 围绕 Typert Remote 服务组织；恢复已移除的 proxy 会重复传输层所有权并绕过生成的客户端类型。

**替换完整详情 slot。** 这会移除官方工具详情。子级 Git slot 保留两个功能，并保持组合关系显式。

## Consequences

Web profile 增加一个 Host 服务、一个生成的客户端 Remote contribution 和一个动态 UI 插件。仓库查看要求 Host 的可执行路径中存在 Git。真实仓库 Host 测试验证状态、历史、变更文件和提交差异；客户端编译和 bundle 验证 Remote 与 slot 接线。

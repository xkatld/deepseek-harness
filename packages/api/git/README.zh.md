---
description: "通过生成的 Remote API 只读查看 Git 仓库状态和提交。"
kind: "package-reference"
---

# @deepseek-ai/dsh-api-git

[English](README.md) | 中文

## 概述

本包向已鉴权的 Remote 客户端提供仓库状态、提交历史、变更文件和提交差异。

## 目录

- 使用本包
- 了解实现
- 模型体验
- 已知限制和延期工作

-----

## 使用本包

在 Host profile 中挂载服务，并在客户端装配中挂载其生成的 Remote contribution。可选 `cwd` 配置用于选择默认仓库。

## 了解实现

服务通过 `execFile` 运行有上限的 `git -C` 子进程。生成的 `git` Remote 命名空间包含 `status`、`history`、`commitFiles` 和 `diff`。

## 模型体验

本包不增加模型可见内容，也不写入会话事件。

#### KV 缓存影响

无。

## 已知限制和延期工作

- **只读操作** — API 不会暂存、提交或修改仓库状态。
- **要求 Host Git** — Host 的可执行路径中必须存在 Git。

### 开发备注

无。

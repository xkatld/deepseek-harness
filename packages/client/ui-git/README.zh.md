---
description: "Web GUI 详情面板中的 Git 状态、历史、变更文件和提交差异。"
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-git

[English](README.md) | 中文

## 摘要

本包为 Web GUI 详情栏增加 Git 标签。它展示当前会话工作区的分支、工作树状态、同步计数、提交历史、变更文件和提交差异。

## 目录

- [使用本包](#use-this-package)
- [了解实现](#understand-the-implementation)
- [模型体验](#model-experience)
- [已知限制和延期工作](#known-limitations-and-deferred-work)

-----

## 使用本包

将本客户端插件与 `ui-chat`、`api-remotes` 和 `api-git` 一起挂载。打开详情栏并选择 Git 标签。选择提交后会切换到文件列表和差异；返回列表会恢复仓库历史。

## 了解实现

插件占用 `conversation.details.git`。注入的回调调用生成的 `ctx.remote.git` 命名空间。仓库数据保存在组件本地，并在活动工作区变化或用户点击刷新时重新读取。

## 模型体验

本包不增加模型可见内容，也不写入会话事件。

#### KV 缓存影响

无。

## 已知限制和延期工作

面板只读，并要求活动工作区是 Git 仓库。

### 开发说明

无。

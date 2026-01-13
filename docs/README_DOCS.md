# 📚 FocusExpo 文档使用指南

本指南说明如何在项目开发中有效使用各个文档。

---

## 🎯 快速答案：文档会自动读取吗？

### ✅ 会自动读取
- **CLAUDE.md** - Claude Code 启动时自动读取
- **.cursor/rules/** - Cursor IDE 启动时自动应用

### ❌ 需要手动打开
- **CODE_EXAMPLES.md** - 编码时手动查看
- **ARCHITECTURE.md** - 深度理解时手动查看

---

## 📖 文档清单

| 文件名 | 大小 | 何时读 | 主要用途 |
|--------|------|--------|---------|
| **CLAUDE.md** | 9.5K | 每次启动 | 快速参考、日常开发 |
| **CODE_EXAMPLES.md** | 18K | 开始编码前 | 代码规范和详细示例 |
| **ARCHITECTURE.md** | 20K | 深度理解时 | 系统架构和设计 |
| **.cursor/rules/focusexpo-architecture.mdc** | 6.8K | 自动应用 | Cursor IDE 规则 |

---

## 🚀 如何使用文档

### 方式 1：使用 npm scripts（推荐）

```bash
# 查看帮助
bun run docs

# 快速参考 (CLAUDE.md)
bun run docs:quick

# 代码示例 (CODE_EXAMPLES.md)
bun run docs:examples

# 架构文档 (ARCHITECTURE.md)
bun run docs:arch

# 列出所有文档
bun run docs:list
```

### 方式 2：直接打开文件

```bash
# 在 Claude Code 中查看
claude code CLAUDE.md
claude code CODE_EXAMPLES.md
claude code ARCHITECTURE.md

# 在 Cursor 中查看
cursor CLAUDE.md
cursor CODE_EXAMPLES.md
cursor ARCHITECTURE.md

# 在浏览器中查看（Markdown Preview）
# 直接用 IDE 的 Markdown 预览功能
```

### 方式 3：手动脚本

```bash
# 使用 docs.sh 脚本
./docs.sh quick        # 快速参考
./docs.sh examples     # 代码示例
./docs.sh arch         # 架构文档
./docs.sh list         # 列表
```

---

## 📅 开发周期中的文档使用

### 第一次开发这个项目

1. **阅读 CLAUDE.md** (5-10 分钟)
   - 快速了解项目
   - 了解必需命令
   - 理解核心架构

2. **浏览 CODE_EXAMPLES.md** (15-20 分钟)
   - 了解代码规范
   - 学习项目约定的代码模式
   - 查看相关领域的代码示例

3. **根据需要查阅 ARCHITECTURE.md**
   - 需要修改核心功能时
   - 需要理解数据流向时
   - 需要实现新的 Store 时

### 日常开发

```
需要做某事？
    ↓
查看 CLAUDE.md 中的"常见开发任务"
    ↓
找到相关任务的步骤
    ↓
在 CODE_EXAMPLES.md 中找代码示例
    ↓
参考示例编写代码
    ↓
如果需要深度理解，查阅 ARCHITECTURE.md
```

### 遇到问题

```
遇到问题？
    ↓
1. 查看 CLAUDE.md → 常见陷阱 (⚠️ 常见陷阱)
2. 查看 CLAUDE.md → 快速参考 (📞 快速参考)
3. 查看 CODE_EXAMPLES.md → 相关部分
4. 查看 ARCHITECTURE.md → 深度分析
5. Google / Stack Overflow
```

---

## 🎓 每个文档详解

### CLAUDE.md (自动读取)

**自动读取情况：**
- ✅ Claude Code 启动时自动加载
- ✅ 所有 Claude Code 会话中都可用

**包含内容：**
- 📋 项目概览和核心功能
- 🚀 必需命令（Bun、Expo）
- 🏗️ 核心架构概览（路由、状态管理、存储、原生集成）
- 📡 API 和网络基础
- 🔥 4 个关键代码模式
- 🔍 8 个常见开发任务的步骤
- 🛠️ 调试工具和常见陷阱
- 📚 关键文件速查表

**何时查看：**
- 启动项目前
- 开始新功能前
- 遇到问题时

**大小：** 9.5 KB (快速阅读)

---

### CODE_EXAMPLES.md (需要手动打开)

**如何打开：**
```bash
bun run docs:examples    # 快速打开
code CODE_EXAMPLES.md    # 手动打开
```

**包含内容：**
- ✍️ TypeScript 类型规范和常用模式
- ⚛️ React 组件规范和完整示例
- 🔄 Zustand Store 规范和完整代码
- 📡 API 和网络规范
- 📱 iOS 原生集成规范
- ❌ 错误处理规范
- ⚡ 性能优化示例（列表、派生状态、样式）
- ✅ 开发检查清单

**何时查看：**
- 开始编码前（浏览一遍概览）
- 编码时（查找相关部分的示例）
- 需要规范参考时

**大小：** 18 KB (30-40 分钟阅读)

**快速导航：**
| 需要... | 查看位置 |
|--------|--------|
| TypeScript 类型规范 | TypeScript 规范 |
| React 组件写法 | React 组件规范 |
| Store 完整示例 | Zustand Store 规范 |
| API 请求示例 | API 和网络规范 |
| iOS 原生调用 | iOS 原生集成规范 |
| 错误处理方式 | 错误处理规范 |
| 列表优化 | 性能优化示例 |

---

### ARCHITECTURE.md (深度理解时打开)

**如何打开：**
```bash
bun run docs:arch        # 快速打开
code ARCHITECTURE.md     # 手动打开
```

**包含内容：**
- 🏗️ 系统架构概览（分层架构图）
- 📊 5 层完整架构设计
- 🔄 数据流向分析（初始化、启动、暂停、网络）
- 🧠 Zustand Store 深度解析
- 🍎 iOS 原生集成深度解析
- 🔬 核心算法实现（链式定时器、重复匹配、统计计算）
- ⚡ 性能优化策略
- 📈 扩展指南（添加 Store、API、屏幕、iOS 方法）

**何时查看：**
- 需要修改核心逻辑时（计时器、屏蔽）
- 需要添加新的大功能时
- 需要理解系统整体设计时
- 需要优化性能时

**大小：** 20 KB (40-60 分钟阅读)

**快速导航：**
| 需要理解... | 查看位置 |
|-----------|--------|
| 系统整体架构 | 系统架构概览 |
| 数据流向 | 数据流向 |
| Store 工作原理 | 状态管理深度解析 |
| iOS 集成原理 | iOS 原生集成详解 |
| 计时准确性 | 核心算法 → 链式定时器 |
| 计划重复逻辑 | 核心算法 → 计划重复匹配 |
| 如何添加新 Store | 扩展指南 |
| 如何添加新 API | 扩展指南 |

---

### .cursor/rules/focusexpo-architecture.mdc (自动应用)

**自动应用情况：**
- ✅ Cursor IDE 启动时自动应用
- ✅ Cursor 在代码建议中自动遵循规则

**包含内容：**
- 📋 项目身份识别
- 🏗️ 核心架构规则（路由、状态管理、组件、存储）
- 📱 iOS 原生集成规则
- 📝 代码风格规则
- 📂 文件组织规则和命名规范
- 🔧 常见开发任务步骤
- 🛠️ 调试指南
- 📞 快速命令参考

**何时查看：**
- 一般不需要查看（Cursor 自动应用）
- 如果 Cursor 的建议不符合预期，检查此文件
- 了解 Cursor IDE 使用的规则

**大小：** 6.8 KB

---

## 💻 IDE 集成

### Claude Code

```bash
# Claude Code 自动读取 CLAUDE.md
claude code

# CLAUDE.md 在 Claude 的上下文中自动可用
# 无需任何配置
```

### Cursor IDE

```bash
# Cursor 自动应用 .cursor/rules/
cursor .

# 编码时，Cursor 会：
# 1. 自动应用编码规则
# 2. 在建议中遵循项目约定
# 3. 提供符合项目风格的代码片段
```

### VS Code

```bash
# 在 VS Code 中打开项目
code .

# 使用 Markdown Preview 预览文档
# 或安装 Markdown 相关扩展查看更好的格式

# Cmd + K Cmd + O（macOS）搜索工作区文件
# 搜索 "CLAUDE" 快速打开文档
```

---

## 🎯 常见场景和文档参考

### 场景 1：第一次开发项目

1. 阅读 CLAUDE.md (5 分钟)
2. 浏览 CODE_EXAMPLES.md (20 分钟)
3. 查看 ARCHITECTURE.md 的相关部分 (按需)
4. 开始编码

### 场景 2：添加新屏幕

参考：
- CLAUDE.md → 常见开发任务 → 添加新屏幕
- CODE_EXAMPLES.md → React 组件规范

### 场景 3：创建新 Store

参考：
- ARCHITECTURE.md → 扩展指南 → 添加新的 Store
- CODE_EXAMPLES.md → Zustand Store 规范
- 查看现有 Store 代码（如 src/stores/plan.ts）

### 场景 4：修改计时逻辑

参考：
- CLAUDE.md → 常见开发任务 → 修改专注计时逻辑
- ARCHITECTURE.md → 核心算法 → 链式定时器
- CODE_EXAMPLES.md → iOS 原生集成规范

### 场景 5：处理应用屏蔽

参考：
- CLAUDE.md → 常见开发任务 → 处理应用屏蔽
- ARCHITECTURE.md → iOS 原生集成详解
- CODE_EXAMPLES.md → iOS 原生集成规范

### 场景 6：集成新 API

参考：
- CLAUDE.md → 常见开发任务 → 集成新的第三方 API
- ARCHITECTURE.md → 数据流向 → 网络请求流程
- ARCHITECTURE.md → 扩展指南 → 添加新的 API 端点
- CODE_EXAMPLES.md → API 和网络规范

### 场景 7：遇到 Metro 或 TypeScript 错误

参考：
- CLAUDE.md → 快速参考 → 问题排查
- CLAUDE.md → 常见陷阱

---

## 📱 移动设备上查看文档

### 使用 GitHub

如果项目在 GitHub 上，直接在手机浏览器打开：
```
https://github.com/[user]/FocusExpo/blob/main/CLAUDE.md
```

### 本地 HTTP 服务器

```bash
# 在项目目录启动简单的 HTTP 服务器
python3 -m http.server 8000

# 然后访问
http://localhost:8000/CLAUDE.md
```

---

## ❓ FAQ

### Q: 我需要记住所有文档吗？
**A:** 不需要。记住三个快速命令就足够了：
```bash
bun run docs:quick      # 快速参考
bun run docs:examples   # 代码示例
bun run docs:arch       # 架构文档
```

### Q: 文档会自动更新吗？
**A:** 文档和代码一起版本控制。当拉取新的代码更改时，文档也会更新。

### Q: 我可以修改文档吗？
**A:** 当然可以！如果你发现文档有误或需要改进，直接编辑相应的 .md 文件并提交 PR。

### Q: 文档用什么格式编写？
**A:** 使用 GitHub Flavored Markdown (GFM)，在任何支持 Markdown 的编辑器中都可以编辑。

### Q: Cursor 规则是如何应用的？
**A:** Cursor IDE 会自动读取 `.cursor/rules/` 目录中的所有 .mdc 和 .txt 文件，并在你编码时应用规则。

### Q: 如果 Claude/Cursor 的建议与文档不符？
**A:** 始终遵循项目中的文档。如果模型建议不符合规范，你可以：
1. 忽略建议
2. 手动遵循文档的规范
3. 告知模型查看项目文档

---

## 🔗 快速链接

在项目中快速找到相关文档的方式：

```bash
# 打印所有文档信息
bun run docs:list

# 搜索关键词（例如在 VS Code 中）
# Cmd + Shift + F (macOS) / Ctrl + Shift + F (Windows/Linux)
# 搜索关键词如 "Store" 或 "iOS"
```

---

## 📊 文档统计

- **总文档数**: 4 个
- **总大小**: ~54 KB
- **阅读时间**: ~2 小时（全部）
- **快速参考时间**: ~5 分钟（CLAUDE.md）
- **更新频率**: 与代码更新同步

---

最后更新：2026 年 1 月 13 日

有任何关于文档的问题？在 CLAUDE.md 中有快速参考和常见问题解答。

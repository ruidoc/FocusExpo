# EAS Update 热更新

## 概述

EAS Update 将 app 分为两层：

- **Native 层**（二进制包）— 通过 App Store 发布
- **Update 层**（JS bundle + 资源）— 通过 OTA 热替换，无需审核

三个关键属性将 build 和 update 关联：

| 属性 | 说明 | 配置位置 |
|---|---|---|
| **channel** | 标识一组 build（如 preview、production） | `eas.json` |
| **runtimeVersion** | JS-Native 接口版本，原生代码变化时必须更新 | `app.json` |
| **platform** | iOS / Android | 自动识别 |

匹配规则：update 的 platform 和 runtimeVersion **必须精确匹配** build 才会下发。

## 项目配置（已完成）

通过 `eas update:configure` 一键完成，自动处理了以下内容：

**安装依赖：**

- `expo-updates`

**app.json 新增：**

```json
{
  "runtimeVersion": "1.0.0",
  "updates": {
    "url": "https://u.expo.dev/17655fd0-b6e6-4f12-b988-e23ef2f0c593"
  }
}
```

**eas.json 新增 channel：**

```json
{
  "build": {
    "development": { "channel": "development" },
    "preview": { "channel": "preview" },
    "production": { "channel": "production" }
  }
}
```

## 日常使用

### 1. 构建新包（原生层变化时）

添加 `expo-updates` 后首次、或原生代码变动时，需要重新构建：

```bash
eas build --platform ios --profile preview
eas build --platform ios --profile production
```

### 2. 推送热更新（JS 层变化时）

```bash
# 推送到 preview 测试环境
eas update --channel preview --message "修复了xxx问题"

# 推送到 production 正式环境
eas update --channel production --message "修复了xxx问题"
```

用户打开 app 时自动下载更新，下次启动生效。

## 判断标准：热更新 vs 重新构建

| 改动内容 | 操作 |
|---|---|
| JS/TS 代码、样式、文案 | `eas update` |
| 图片等静态资源 | `eas update` |
| Store 逻辑、API 请求 | `eas update` |
| A/B 实验配置 | `eas update` |
| `app.json` 配置变更 | `eas build` |
| 新增/更新含原生代码的 npm 包 | `eas build` |
| 修改 NativeModule.swift | `eas build` |
| 修改 entitlements / Info.plist | `eas build` |
| 升级 Expo SDK | `eas build` + 更新 runtimeVersion |

## runtimeVersion 管理

当前使用固定值 `"1.0.0"`，与 `app.json` 的 `version` 字段保持一致。

**规则：每次原生层有变化并重新构建时，同步递增 runtimeVersion。** 这样旧版本的 build 不会收到不兼容的更新。

可切换为自动策略：

```json
{
  "runtimeVersion": {
    "policy": "appVersion"
  }
}
```

此策略自动使用 `version` 字段作为 runtimeVersion，改 version 即改 runtimeVersion。

## 部署流程

```
代码改动（JS 层）
  ↓
eas update --channel preview --message "xxx"
  ↓
preview build 自动收到更新，内部测试验证
  ↓
eas update --channel production --message "xxx"
  ↓
production build 自动收到更新，正式用户生效
```

## 注意事项

1. **专注计时中不要强制重启** — 默认行为是下载更新后下次启动生效，不会中断用户
2. **首次接入必须重新构建** — `expo-updates` 是原生依赖
3. **channel 与 branch 默认同名映射** — preview channel 自动关联 preview branch
4. **更新包尽量小** — 减少用户等待时间

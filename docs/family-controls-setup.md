# Family Controls Capability 配置指南

## 问题描述

EAS Build 自动生成的 Provisioning Profile 不包含 Family Controls capability，导致构建失败。

错误信息：

```
Provisioning profile doesn't support the Family Controls (Development) capability.
Provisioning profile doesn't include the com.apple.developer.family-controls entitlement.
```

## 解决方案

### 步骤 1: 在 Apple Developer Portal 中启用 Family Controls

1. 访问 [Apple Developer Portal - Identifiers](https://developer.apple.com/account/resources/identifiers/list)
2. 登录你的 Apple Developer 账号（Team ID: G497923Y9M）
3. 为以下所有 App ID 启用 Family Controls capability：
   - `com.focusone` (主应用)
   - `com.focusone.ReportExtension`
   - `com.focusone.ShieldExtension`
   - `com.focusone.MonitorExtension`

4. 操作步骤：
   - 点击每个 App ID
   - 在 Capabilities 部分找到 "Family Controls"
   - 勾选启用
   - 点击 "Save"

### 步骤 2: 删除旧的 EAS 凭证并重新生成

在 Apple Developer Portal 中启用 capability 后，需要删除旧的凭证，让 EAS 重新生成包含 Family Controls 的 Provisioning Profile。

#### 方法 A: 使用 EAS CLI 删除凭证（推荐）

```bash
# 删除 iOS 凭证（交互式）
eas credentials

# 选择：
# 1. iOS
# 2. 选择对应的 profile (preview 或 production)
# 3. 选择要删除的 target
# 4. 选择 "Remove credentials"
```

#### 方法 B: 使用 EAS CLI 强制重新生成

```bash
# 删除所有 iOS 凭证并重新生成
eas credentials --platform ios

# 或者针对特定 profile
eas credentials --platform ios --profile preview
```

### 步骤 3: 重新构建

删除凭证后，重新运行构建命令：

```bash
bun run build:preview
```

EAS 会自动检测到 Apple Developer Portal 中的 Family Controls capability，并生成包含该 capability 的新 Provisioning Profile。

## 验证步骤

1. **检查 Apple Developer Portal**
   - 确认所有 App ID 的 Family Controls capability 已启用
   - 确认 Provisioning Profile 包含 Family Controls

2. **检查构建日志**
   - 运行构建后，检查日志中是否还有 Family Controls 相关错误
   - 确认 Provisioning Profile 名称包含 Family Controls

3. **检查 Xcode 项目**
   - 打开 `ios/FocusOne.xcworkspace`
   - 检查每个 Target 的 Signing & Capabilities
   - 确认 Family Controls 已正确配置

## 注意事项

⚠️ **重要提示**：

1. **Capability 启用需要时间**：在 Apple Developer Portal 中启用 capability 后，可能需要几分钟才能生效。

2. **Provisioning Profile 同步**：删除凭证后，EAS 会在下次构建时重新生成 Provisioning Profile，这个过程可能需要一些时间。

3. **多个 Target**：项目包含 4 个 target（主应用 + 3 个 Extension），需要为每个 target 的 App ID 都启用 Family Controls。

4. **本地构建 vs 云端构建**：
   - 本地构建（`--local`）：需要手动管理凭证
   - 云端构建：EAS 自动管理凭证

## 如果问题仍然存在

如果按照上述步骤操作后仍然失败，可以尝试：

1. **等待一段时间**：Capability 启用后可能需要等待 5-10 分钟

2. **手动创建 Provisioning Profile**：
   - 在 Apple Developer Portal 中手动创建 Provisioning Profile
   - 确保包含 Family Controls capability
   - 在 EAS 中使用手动凭证

3. **检查 Team ID**：确认 Apple Developer Portal 中的 Team ID 与项目配置一致（G497923Y9M）

4. **联系 EAS 支持**：如果问题持续，可以联系 Expo 支持团队

## 参考资源

- [EAS Credentials 文档](https://docs.expo.dev/app-signing/app-credentials/)
- [Apple Developer Portal](https://developer.apple.com/account/)
- [Family Controls 文档](https://developer.apple.com/documentation/familycontrols)

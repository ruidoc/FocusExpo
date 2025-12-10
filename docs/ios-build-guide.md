# iOS 打包方案指南

## 项目概况

- **Expo SDK**: 53.0.7
- **React Native**: 0.79.2
- **新架构**: 已启用
- **iOS 部署目标**: 16.0+
- **Bundle ID**: com.focusone
- **Extensions**: MonitorExtension, ReportExtension, ShieldExtension

## 推荐方案：EAS Build（云端构建）

### 优势

1. ✅ 自动处理多个 Extension 的构建
2. ✅ 自动管理证书和配置文件
3. ✅ 无需本地 Xcode 环境
4. ✅ 支持 CI/CD 集成
5. ✅ 构建历史记录和日志

### 前置准备

1. **安装 EAS CLI**

   ```bash
   bun add -g eas-cli
   # 或
   npm install -g eas-cli
   ```

2. **登录 EAS**

   ```bash
   eas login
   ```

3. **配置项目**（已完成，projectId: `6ba49731-4a04-43da-adb9-e1e4311eebae`）

### 构建命令

#### 1. 开发构建（Development Build）

用于本地开发和测试：

```bash
# 构建开发版本（支持模拟器）
eas build --profile development --platform ios

# 构建开发版本（真机）
eas build --profile development --platform ios --local
```

#### 2. 预览构建（Preview Build）

用于内部测试分发（TestFlight 或 Ad Hoc）：

```bash
# 云端构建
eas build --profile preview --platform ios

# 本地构建（需要 Xcode）
eas build --profile preview --platform ios --local

# 本地构建，清除缓存
eas build --clear-cache --profile preview --platform ios --local
```

#### 3. 生产构建（Production Build）

用于 App Store 提交：

```bash
# 云端构建
eas build --profile production --platform ios

# 本地构建
eas build --profile production --platform ios --local
```

### 本地构建要求

如果使用 `--local` 选项，需要：

1. **macOS 系统**
2. **Xcode 15+**（推荐最新版本）
3. **CocoaPods**
   ```bash
   cd ios && pod install
   ```
4. **Apple Developer 账号**（Team ID: G497923Y9M）

### 构建流程

#### 云端构建流程

1. **提交构建请求**

   ```bash
   eas build --profile production --platform ios
   ```

2. **等待构建完成**
   - 构建时间：约 15-30 分钟
   - 可在 EAS Dashboard 查看进度

3. **下载构建产物**
   - `.ipa` 文件（用于 TestFlight 或 App Store）
   - 构建日志

#### 本地构建流程

1. **安装依赖**

   ```bash
   bun install
   cd ios && pod install
   ```

2. **运行 prebuild**（如果需要）

   ```bash
   bun run prebuild
   ```

3. **使用 EAS 本地构建**

   ```bash
   eas build --profile production --platform ios --local
   ```

4. **或使用 Xcode 直接构建**

   ```bash
   # 打开 Xcode 项目
   open ios/FocusOne.xcworkspace

   # 在 Xcode 中：
   # 1. 选择 Product > Scheme > FocusOne
   # 2. 选择 Product > Destination > Any iOS Device
   # 3. Product > Archive
   ```

## 方案二：Xcode 直接构建（本地开发）

### 适用场景

- 需要频繁调试原生代码
- 需要快速迭代测试
- 本地已有完整的开发环境

### 步骤

1. **安装依赖**

   ```bash
   bun install
   cd ios && pod install
   ```

2. **打开 Xcode 项目**

   ```bash
   open ios/FocusOne.xcworkspace
   ```

3. **配置签名**
   - 在 Xcode 中选择项目
   - 选择 Target: FocusOne
   - 在 Signing & Capabilities 中：
     - Team: freeshore (G497923Y9M)
     - Bundle Identifier: com.focusone
   - 同样配置所有 Extension Targets

4. **构建配置**
   - **Debug**: 用于开发调试
   - **Release**: 用于测试和生产

5. **Archive 构建**
   - Product > Scheme > FocusOne
   - Product > Destination > Any iOS Device
   - Product > Archive
   - 等待构建完成

6. **导出 IPA**
   - 在 Organizer 中选择 Archive
   - Distribute App
   - 选择分发方式：
     - **App Store Connect**: 上传到 App Store
     - **Ad Hoc**: 内部测试
     - **Development**: 开发测试

### 注意事项

⚠️ **Extension 签名问题**

- 所有 Extension 必须使用相同的 Team 和证书
- 确保所有 Extension 的 Bundle Identifier 正确：
  - com.focusone
  - com.focusone.ReportExtension
  - com.focusone.ShieldExtension
  - com.focusone.MonitorExtension

⚠️ **新架构构建**

- 项目已启用新架构，确保所有依赖支持
- 构建时间可能较长

⚠️ **证书和配置文件**

- 证书有效期至：2026-08-21
- 确保配置文件包含所有 Extension

## 方案三：CI/CD 自动化构建

### GitHub Actions 示例

创建 `.github/workflows/ios-build.yml`:

```yaml
name: iOS Build

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  build:
    name: Build iOS
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Build iOS
        run: eas build --profile production --platform ios --non-interactive
```

## 版本管理

### 版本号更新

在 `app.json` 中更新版本：

```json
{
  "expo": {
    "version": "1.0.0", // 用户可见版本
    "ios": {
      "buildNumber": "1" // 构建号
    }
  }
}
```

### 自动递增

EAS Build 的 `production` profile 已配置 `autoIncrement: true`，会自动递增构建号。

## 常见问题

### 1. Extension 构建失败

**问题**: Extension 签名错误或配置缺失

**解决**:

- 检查所有 Extension 的 Info.plist
- 确保 entitlements 文件正确
- 验证 Bundle Identifier 格式

### 2. 新架构构建错误

**问题**: 某些依赖不支持新架构

**解决**:

- 检查依赖兼容性
- 临时禁用新架构测试：`newArchEnabled: false`
- 更新到支持新架构的依赖版本

### 3. 证书过期

**问题**: 证书或配置文件过期

**解决**:

- 当前证书有效期至 2026-08-21
- EAS Build 会自动管理证书
- 本地构建需要手动更新

### 4. 构建时间过长

**问题**: 首次构建或依赖更新

**解决**:

- 使用 EAS Build 缓存
- 本地构建使用 `--local` 可加快速度
- 考虑使用 `ccache`（已配置）

## 推荐工作流

### 日常开发

```bash
# 使用 Expo Go 或开发构建
bun run ios
```

### 测试原生功能

```bash
# 构建开发版本
eas build --profile development --platform ios
```

### 内部测试

```bash
# 构建预览版本
eas build --profile preview --platform ios
```

### 发布到 App Store

```bash
# 构建生产版本
eas build --profile production --platform ios

# 提交到 App Store
eas submit --platform ios
```

## 参考资源

- [EAS Build 文档](https://docs.expo.dev/build/introduction/)
- [iOS 构建指南](https://docs.expo.dev/build/building-on-ci/)
- [证书管理](https://docs.expo.dev/app-signing/app-credentials/)

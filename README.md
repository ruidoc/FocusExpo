# FocusExpo

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## 清除缓存

本地 Metro 卡死的话，按照下面方法清除缓存：

```sh
watchman watch-del-all
rm -rf node_modules/.cache
expo start -c   # -c = --clear
# 或者
npm start -- --reset-cache
```

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## 安卓方法

WorkManager API (适合定时任务)

- 功能：可以设置定时任务，配合其他 API 使用
- 优势：即使应用关闭也能运行

```kotlin
  val constraints = Constraints.Builder()
      .setRequiresDeviceIdle(false)
      .build()

  val blockAppWork = PeriodicWorkRequestBuilder<BlockAppWorker>(
      15, TimeUnit.MINUTES
  ).setConstraints(constraints).build()

  WorkManager.getInstance(context).enqueueUniquePeriodicWork(
      "blockApps",
      ExistingPeriodicWorkPolicy.REPLACE,
      blockAppWork
  )
```

## IOS 方法

因为账号没付钱，所以删除了下面的方法。

```json
{
    "associatedDomains": [
        "applinks:focusone.com"
    ]
},
```

# Android 开发国内镜像配置指南

## 已配置的镜像

### 1. Bun/NPM 镜像

- 配置文件：`.bunfig.toml`
- 镜像源：`https://registry.npmmirror.com`

### 2. Gradle 镜像

- 全局配置：`~/.gradle/init.gradle`
- 属性配置：`~/.gradle/gradle.properties`
- 主要镜像：阿里云 Maven 仓库

## 其他可选配置

### Android SDK 镜像（如需要）

如果你需要下载 Android SDK 组件，可以在 Android Studio 中配置：

1. 打开 Android Studio
2. 进入 `Preferences` → `Appearance & Behavior` → `System Settings` → `HTTP Proxy`
3. 配置代理或使用以下镜像：
   - 清华大学镜像：`https://mirrors.tuna.tsinghua.edu.cn/android/`
   - 中科大镜像：`https://mirrors.ustc.edu.cn/android/`

### Gradle Wrapper 镜像

如果项目有 `gradle-wrapper.properties`，可以将下载 URL 替换为：

```distributionUrl=https://mirrors.cloud.tencent.com/gradle/gradle-8.0-bin.zip

```

### React Native 镜像

对于 React Native 相关依赖：

```bash
# 使用 React Native 中文网镜像
npm config set registry https://registry.npm.taobao.org
npm config set disturl https://npm.taobao.org/dist
```

## 验证配置

运行以下命令验证配置是否生效：

```bash
# 检查 bun 镜像
bun install --verbose

# 运行 Android 构建
expo run:android
```

## 镜像源列表

### NPM 镜像

- 淘宝镜像：`https://registry.npmmirror.com`
- 腾讯云镜像：`https://mirrors.cloud.tencent.com/npm/`
- 华为云镜像：`https://repo.huaweicloud.com/repository/npm/`

### Maven 镜像

- 阿里云：`https://maven.aliyun.com/repository/central`
- 腾讯云：`https://mirrors.cloud.tencent.com/nexus/repository/maven-public/`
- 华为云：`https://repo.huaweicloud.com/repository/maven/`

### Android SDK 镜像

- 清华大学：`https://mirrors.tuna.tsinghua.edu.cn/android/`
- 中科大：`https://mirrors.ustc.edu.cn/android/`
- 东软信息学院：`https://mirrors.neusoft.edu.cn/android/`

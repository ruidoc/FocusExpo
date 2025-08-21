# React Native 原生组件详解：从零到一，一文学会

> 本文基于 React Native 0.79.2 版本，结合真实的 TokenLabel 原生组件案例，深入浅出地讲解如何创建和使用原生组件。

## 目录

- [什么是原生组件](#什么是原生组件)
- [为什么需要原生组件](#为什么需要原生组件)
- [原生组件的架构原理](#原生组件的架构原理)
- [实战案例：TokenLabel 组件](#实战案例tokenlabel-组件)
- [原生组件开发流程](#原生组件开发流程)
- [常见问题与解决方案](#常见问题与解决方案)
- [总结与最佳实践](#总结与最佳实践)

## 什么是原生组件

原生组件（Native Components）是 React Native 中连接 JavaScript 层和原生平台（iOS/Android）的桥梁。它们允许我们：

- 使用平台特有的 UI 组件
- 调用原生 API 和功能
- 集成第三方原生库
- 实现 JavaScript 无法完成的功能

简单来说，原生组件就是**用原生代码编写的 UI 组件，可以在 React Native 中像普通组件一样使用**。

## 为什么需要原生组件

虽然 React Native 提供了丰富的跨平台组件，但在某些场景下，我们仍然需要原生组件：

1. **性能要求**：复杂的动画、大量数据处理
2. **平台特性**：iOS 的 Family Controls、Android 的特定权限
3. **第三方集成**：原生 SDK、硬件功能
4. **UI 定制**：平台特有的设计语言和交互

## 原生组件的架构原理

React Native 的原生组件架构包含三个核心部分：

```
JavaScript 层 (React) 
        ↓
    Native Modules Bridge
        ↓
原生层 (iOS/Android)
```

### 数据流向

1. **Props 传递**：JavaScript → 原生组件
2. **事件回调**：原生组件 → JavaScript
3. **状态同步**：双向数据绑定

## 实战案例：TokenLabel 组件

让我们通过一个真实的案例来理解原生组件的开发过程。这个组件用于显示 iOS 的 Family Controls 应用图标。

### 1. 原生视图实现 (iOS)

#### TokenLabelView.swift
```swift
import Foundation
import UIKit
import SwiftUI
import FamilyControls
import ManagedSettings
import DeviceActivity

@available(iOS 16.0, *)
@objc class TokenLabelView: UIView {
    // 暴露给 React Native 的属性
    @objc var tokenBase64: NSString? { didSet { updateContentIfPossible() } }
    @objc var tokenHash: NSString? { didSet { updateContentIfPossible() } }
    @objc var size: NSNumber = 40 { didSet { updateContentIfPossible() } }

    private var hostingController: UIHostingController<AnyView>?

    override init(frame: CGRect) {
        super.init(frame: frame)
        backgroundColor = UIColor.clear
    }

    // 核心逻辑：根据 token 显示对应的应用图标
    private func updateContentIfPossible() {
        guard let tokenHashStr = tokenHash as String? else { return }
        guard let selection = loadSelection() else { return }
        guard let token = selection.applicationTokens.first(where: { "\($0.hashValue)" == tokenHashStr }) else { return }

        let dimension = CGFloat(truncating: size)
        let swiftUIView = Label(token)
            .labelStyle(.iconOnly)
            .frame(width: dimension, height: dimension)

        let controller = UIHostingController(rootView: AnyView(swiftUIView))
        controller.view.backgroundColor = UIColor.clear

        hostingController?.view.removeFromSuperview()
        hostingController = controller

        addSubview(controller.view)
        controller.view.frame = bounds
        controller.view.autoresizingMask = [UIView.AutoresizingMask.flexibleWidth, UIView.AutoresizingMask.flexibleHeight]
        setNeedsLayout()
        layoutIfNeeded()
    }
}
```

**关键点解析：**
- `@objc` 标记：让 Swift 类可以被 Objective-C 调用
- `didSet` 观察器：属性变化时自动更新 UI
- SwiftUI 集成：使用 `UIHostingController` 包装 SwiftUI 视图

#### TokenLabelManager.swift
```swift
import Foundation
import React

@objc(TokenLabelManager)
class TokenLabelManager: RCTViewManager {
    override static func requiresMainQueueSetup() -> Bool { true }

    override func view() -> UIView! {
        return TokenLabelView()
    }
}
```

**关键点解析：**
- 继承 `RCTViewManager`：React Native 的视图管理器基类
- `requiresMainQueueSetup()`：指定是否需要在主线程初始化
- `view()` 方法：返回原生视图实例

#### TokenLabelManager.m
```objc
#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(TokenLabelManager, RCTViewManager)
RCT_EXPORT_VIEW_PROPERTY(tokenBase64, NSString)
RCT_EXPORT_VIEW_PROPERTY(tokenHash, NSString)
RCT_EXPORT_VIEW_PROPERTY(size, NSNumber)
@end
```

**关键点解析：**
- `RCT_EXTERN_MODULE`：声明原生模块
- `RCT_EXPORT_VIEW_PROPERTY`：导出属性到 JavaScript
- 类型映射：NSString → string, NSNumber → number

### 2. 为什么需要三个文件？

iOS 原生组件需要三个文件是因为 React Native 的架构设计和 iOS 平台的特性：

#### 文件 1：原生视图类 (TokenLabelView.swift)
**作用**：
- 继承 `UIView`，实现具体的 UI 逻辑
- 使用 `@objc` 标记，让 Swift 类可以被 Objective-C 调用
- 处理属性变化，更新 UI 内容

**为什么需要**：
- 这是组件的核心实现，包含所有的业务逻辑
- `@objc` 标记是 Swift 和 Objective-C 互操作的关键

#### 文件 2：视图管理器 (TokenLabelManager.swift)
**作用**：
- 继承 `RCTViewManager`，管理原生视图的生命周期
- 创建和返回原生视图实例
- 处理线程相关的配置

**为什么需要**：
- React Native 需要一个"工厂"来创建视图实例
- 管理视图的创建、销毁和属性更新
- 处理主线程和后台线程的协调

#### 文件 3：桥接文件 (TokenLabelManager.m)
**作用**：
- 使用 Objective-C 宏导出 Swift 类到 React Native
- 定义属性类型映射
- 建立 JavaScript 和原生代码的通信桥梁

**为什么需要**：
- React Native 的桥接系统基于 Objective-C 运行时
- Swift 类需要通过 Objective-C 桥接才能被 React Native 识别
- 属性类型映射需要明确的声明

### 3. requireNativeComponent 的工作原理

#### 组件查找流程

当调用 `requireNativeComponent('TokenLabel')` 时，React Native 会按以下步骤查找组件：

```typescript
requireNativeComponent<Props>('TokenLabel')
```

#### 步骤 1：名称解析
```swift
// TokenLabelManager.swift
@objc(TokenLabelManager)  // 这个名称很重要！
class TokenLabelManager: RCTViewManager
```

React Native 会：
1. 去掉 "Manager" 后缀：`TokenLabelManager` → `TokenLabel`
2. 在 Objective-C 运行时中查找名为 `TokenLabelManager` 的类

#### 步骤 2：类注册
```objc
// TokenLabelManager.m
@interface RCT_EXTERN_MODULE(TokenLabelManager, RCTViewManager)
```

`RCT_EXTERN_MODULE` 宏会：
1. 将 `TokenLabelManager` 类注册到 React Native 的组件注册表
2. 建立 JavaScript 名称 `TokenLabel` 和原生类 `TokenLabelManager` 的映射

#### 步骤 3：实例创建
```swift
override func view() -> UIView! {
    return TokenLabelView()  // 创建实际的视图实例
}
```

当 JavaScript 使用组件时：
1. React Native 调用 `TokenLabelManager.view()`
2. 返回 `TokenLabelView` 实例
3. 渲染到屏幕上

#### 完整的查找链

```
JavaScript: requireNativeComponent('TokenLabel')
    ↓
React Native 桥接系统: 查找 'TokenLabelManager' 类
    ↓
Objective-C 运行时: 找到 @objc(TokenLabelManager) 标记的类
    ↓
TokenLabelManager.view(): 创建 TokenLabelView 实例
    ↓
TokenLabelView: 渲染到屏幕
```

### 2. JavaScript 接口层

#### TokenLabel.tsx
```typescript
import { requireNativeComponent, ViewProps } from 'react-native';

type Props = ViewProps & {
  tokenBase64?: string;
  tokenHash?: string;
  size?: number; // 默认 40
};

// iOS 会将 ViewManager 名称去掉 "Manager" 后作为原生视图名
export default requireNativeComponent<Props>('TokenLabel');
```

**关键点解析：**
- `requireNativeComponent`：加载原生组件
- 命名规则：`TokenLabelManager` → `TokenLabel`
- TypeScript 类型定义：确保类型安全

### 3. 使用方式

```tsx
import TokenLabel from './components/native/TokenLabel';

function App() {
  return (
    <TokenLabel
      tokenHash="12345"
      size={60}
      style={{ width: 60, height: 60 }}
    />
  );
}
```

## 原生组件开发流程

### 步骤 1：设计组件接口
- 确定需要暴露的属性
- 设计事件回调机制
- 考虑平台兼容性

### 步骤 2：实现原生视图
- iOS：继承 `UIView`，实现 `@objc` 标记
- Android：继承 `View`，实现 `@ReactProp` 注解

### 步骤 3：创建视图管理器
- iOS：继承 `RCTViewManager`
- Android：继承 `SimpleViewManager<T>`

### 步骤 4：导出属性和方法
- iOS：使用 `RCT_EXPORT_VIEW_PROPERTY`
- Android：使用 `@ReactProp` 注解

### 步骤 5：JavaScript 接口
- 使用 `requireNativeComponent` 加载
- 定义 TypeScript 类型

## 编写自己的原生组件：完整示例

让我们通过一个完整的示例来学习如何创建自己的原生组件。

### 示例：MyCustomView 组件

#### 步骤 1：创建原生视图类

```swift
// MyCustomView.swift
import UIKit

@objc class MyCustomView: UIView {
    @objc var title: NSString? { 
        didSet { 
            updateTitle() 
        } 
    }
    
    @objc var color: NSString? { 
        didSet { 
            updateColor() 
        } 
    }
    
    private let label = UILabel()
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        setupUI()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupUI()
    }
    
    private func setupUI() {
        addSubview(label)
        label.textAlignment = .center
        label.frame = bounds
        label.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    }
    
    private func updateTitle() {
        label.text = title as String?
    }
    
    private func updateColor() {
        if let colorName = color as String? {
            switch colorName {
            case "red": label.textColor = .red
            case "blue": label.textColor = .blue
            default: label.textColor = .black
            }
        }
    }
}
```

#### 步骤 2：创建视图管理器

```swift
// MyCustomViewManager.swift
import Foundation
import React

@objc(MyCustomViewManager)
class MyCustomViewManager: RCTViewManager {
    override static func requiresMainQueueSetup() -> Bool { true }
    
    override func view() -> UIView! {
        return MyCustomView()
    }
}
```

#### 步骤 3：创建桥接文件

```objc
// MyCustomViewManager.m
#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(MyCustomViewManager, RCTViewManager)
RCT_EXPORT_VIEW_PROPERTY(title, NSString)
RCT_EXPORT_VIEW_PROPERTY(color, NSString)
@end
```

#### 步骤 4：创建 JavaScript 接口

```typescript
// MyCustomView.tsx
import { requireNativeComponent, ViewProps } from 'react-native';

type Props = ViewProps & {
  title?: string;
  color?: 'red' | 'blue' | 'black';
};

export default requireNativeComponent<Props>('MyCustomView');
```

#### 步骤 5：使用组件

```tsx
import MyCustomView from './MyCustomView';

function App() {
  return (
    <MyCustomView
      title="Hello World"
      color="red"
      style={{ width: 200, height: 100 }}
    />
  );
}
```

## 常见问题与解决方案

### 1. 组件不显示
**问题**：原生组件渲染为空白
**解决**：
- 检查原生视图的 `frame` 设置
- 确认 `backgroundColor` 不为透明
- 验证 `addSubview` 调用

### 2. 属性不更新
**问题**：JavaScript 传递的属性没有生效
**解决**：
- 检查 `@objc` 标记
- 确认 `RCT_EXPORT_VIEW_PROPERTY` 导出
- 验证 `didSet` 观察器

### 3. 崩溃问题
**问题**：原生组件导致应用崩溃
**解决**：
- 添加空值检查
- 使用 `@available` 标记版本兼容性
- 在主线程执行 UI 操作

### 4. 性能问题
**问题**：原生组件性能不佳
**解决**：
- 避免频繁的属性更新
- 使用 `setNeedsLayout()` 优化重绘
- 合理设置 `autoresizingMask`

## 最佳实践

### 1. 设计原则
- **单一职责**：一个组件只做一件事
- **接口稳定**：避免频繁改变属性接口
- **平台适配**：考虑不同平台的特性

### 2. 性能优化
- **懒加载**：按需创建复杂视图
- **缓存机制**：避免重复计算
- **异步操作**：耗时操作放在后台线程

### 3. 错误处理
- **防御编程**：添加空值和边界检查
- **优雅降级**：提供备选方案
- **日志记录**：便于调试和问题排查

### 4. 测试策略
- **单元测试**：测试原生逻辑
- **集成测试**：验证 JavaScript 接口
- **平台测试**：确保跨平台兼容性

## iOS 原生组件开发要点

### 1. 命名规则
- **视图管理器类名**：必须以 "Manager" 结尾
- **JavaScript 组件名**：去掉 "Manager" 后缀
- **@objc 标记**：必须与文件名一致

**示例**：
```swift
// ✅ 正确
@objc(MyCustomViewManager)
class MyCustomViewManager: RCTViewManager

// ❌ 错误
@objc(MyCustomView)  // 名称不匹配
class MyCustomViewManager: RCTViewManager
```

### 2. 属性类型映射
```objc
// 支持的类型映射
RCT_EXPORT_VIEW_PROPERTY(string, NSString)
RCT_EXPORT_VIEW_PROPERTY(number, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(boolean, BOOL)
RCT_EXPORT_VIEW_PROPERTY(array, NSArray)
RCT_EXPORT_VIEW_PROPERTY(object, NSDictionary)
```

### 3. 线程安全
```swift
override static func requiresMainQueueSetup() -> Bool { 
    return true  // UI 操作必须在主线程
}
```

**注意事项**：
- UI 更新必须在主线程
- 网络请求、文件操作可以在后台线程
- 使用 `DispatchQueue.main.async` 确保主线程执行

### 4. 内存管理
```swift
// 避免循环引用
weak var delegate: MyDelegate?

// 及时清理资源
deinit {
    // 清理代码
    NotificationCenter.default.removeObserver(self)
}
```

### 5. 调试技巧

#### 检查组件注册
```objc
// 在桥接文件中添加日志
@interface RCT_EXTERN_MODULE(MyCustomViewManager, RCTViewManager)
RCT_EXPORT_VIEW_PROPERTY(title, NSString)
@end

@implementation MyCustomViewManager
+ (void)load {
    NSLog(@"MyCustomViewManager loaded");
}
@end
```

#### 验证属性传递
```swift
@objc var title: NSString? { 
    didSet { 
        print("Title changed to: \(title ?? "nil")")
        updateTitle() 
    } 
}
```

#### 检查视图层级
```swift
override func didMoveToSuperview() {
    super.didMoveToSuperview()
    print("MyCustomView added to: \(superview?.description ?? "nil")")
}
```

### 6. 常见陷阱

#### 陷阱 1：忘记 @objc 标记
```swift
// ❌ 错误：没有 @objc 标记
class MyCustomView: UIView {
    var title: String?  // 这个属性不会被 React Native 识别
}

// ✅ 正确：添加 @objc 标记
@objc class MyCustomView: UIView {
    @objc var title: NSString?  // 这个属性会被正确识别
}
```

#### 陷阱 2：属性类型不匹配
```swift
// ❌ 错误：类型不匹配
@objc var count: Int = 0  // Swift Int 类型

// ✅ 正确：使用 NSNumber
@objc var count: NSNumber = 0  // 与 RCT_EXPORT_VIEW_PROPERTY 匹配
```

#### 陷阱 3：忘记调用 setNeedsLayout
```swift
// ❌ 错误：属性更新后没有触发重绘
@objc var title: NSString? { 
    didSet { 
        label.text = title as String?
        // 忘记调用 setNeedsLayout()
    } 
}

// ✅ 正确：触发重绘
@objc var title: NSString? { 
    didSet { 
        label.text = title as String?
        setNeedsLayout()
        layoutIfNeeded()
    } 
}
```

## 总结

通过 TokenLabel 组件的案例，我们学习了：

1. **原生组件的核心概念**：JavaScript 与原生平台的桥梁
2. **开发流程**：从设计到实现的完整步骤
3. **关键技术**：`@objc`、`RCTViewManager`、`requireNativeComponent`
4. **最佳实践**：性能优化、错误处理、测试策略

### iOS 原生组件的关键要点

#### 文件结构的重要性
- **三个文件缺一不可**：原生视图、视图管理器、桥接文件
- **命名规则必须严格遵循**：Manager 后缀、@objc 标记、文件对应关系
- **桥接系统基于 Objective-C 运行时**：Swift 类必须通过 Objective-C 桥接

#### 组件查找机制
- `requireNativeComponent('TokenLabel')` 会自动查找 `TokenLabelManager` 类
- 名称映射规则：去掉 "Manager" 后缀
- 通过 `RCT_EXTERN_MODULE` 宏注册到 React Native 组件表

#### 开发注意事项
- **线程安全**：UI 操作必须在主线程
- **类型匹配**：使用 NSNumber、NSString 等 Objective-C 类型
- **内存管理**：避免循环引用，及时清理资源
- **调试技巧**：添加日志、检查视图层级、验证属性传递

原生组件是 React Native 生态的重要组成部分，掌握它能够让我们：
- 突破 JavaScript 的限制
- 充分利用平台特性
- 提供更好的用户体验
- 集成更多原生功能

记住，**原生组件不是万能的，但它是解决特定问题的最佳方案**。在开发中，我们应该优先使用跨平台组件，只在必要时才考虑原生组件。

### 下一步学习建议

1. **实践练习**：按照本文的 MyCustomView 示例创建自己的组件
2. **深入理解**：学习 React Native 的桥接机制和线程模型
3. **性能优化**：掌握原生组件的性能调优技巧
4. **跨平台开发**：学习 Android 原生组件的开发方法

## 参考资料

- [React Native 官方文档](https://reactnative.dev/docs/native-components-ios)
- [iOS 开发文档](https://developer.apple.com/documentation/)
- [Family Controls 框架](https://developer.apple.com/documentation/familycontrols)

---

*本文基于 React Native 0.79.2 版本编写，如有疑问或建议，欢迎交流讨论。* 
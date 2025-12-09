/**
 * iOS 原生模块封装 - 统一导出入口
 *
 * 封装了与 iOS NativeModule 的所有通信功能，分为三部分：
 * - 发送部分（methods）：所有原生方法调用
 * - 监听部分（events）：事件监听封装
 * - 同步部分（sync）：专注状态同步管理器
 */

// 导入用于命名空间导出
import * as events from './events';
import * as methods from './methods';

// 导出所有方法（发送部分）
export * from './methods';

// 导出所有事件监听功能（监听部分）
export * from './events';

// 导出同步管理器
export * from './sync';

/**
 * iOS 原生模块命名空间
 * 提供更清晰的 API 调用方式
 *
 * @example
 * ```typescript
 * import { ios } from '@/native/ios';
 *
 * // 调用方法
 * await ios.requestScreenTimePermission();
 *
 * // 创建事件监听
 * const listener = ios.createFocusStateListener(callback);
 * ```
 */
export const ios = {
  ...methods,
  ...events,
};

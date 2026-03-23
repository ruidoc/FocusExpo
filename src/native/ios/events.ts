/**
 * iOS 原生模块事件监听封装 - 监听部分
 * 封装 NativeModule 的事件监听功能
 */

import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import type { ExtensionLogEvent, FocusStateEvent } from '../type';

const { NativeModule } = NativeModules;

/**
 * 事件监听器订阅对象
 */
export interface EventSubscription {
  remove: () => void;
}

/**
 * 创建 focus-state 事件监听器
 * @param callback 事件回调函数
 * @returns 事件订阅对象，调用 remove() 方法取消监听
 *
 * @example
 * ```typescript
 * const subscription = createFocusStateListener((event) => {
 *   console.log('专注状态变化:', event.state);
 * });
 *
 * // 清理监听器
 * subscription.remove();
 * ```
 */
export function createFocusStateListener(
  callback: (event: FocusStateEvent) => void,
): EventSubscription {
  if (Platform.OS !== 'ios') {
    // 非 iOS 平台返回空操作对象
    return { remove: () => {} };
  }

  const emitter = new NativeEventEmitter(NativeModule);
  const subscription = emitter.addListener('focus-state', callback);

  return {
    remove: () => {
      subscription.remove();
    },
  };
}

/**
 * 创建 extension-log 事件监听器
 * 用于接收 Extension 发送的调试日志
 * @param callback 事件回调函数
 * @returns 事件订阅对象，调用 remove() 方法取消监听
 *
 * @example
 * ```typescript
 * const subscription = createExtensionLogListener((event) => {
 *   event.logs.forEach((log) => {
 *     console.log(`[Extension ${log.level}]`, log.message, log.data);
 *   });
 * });
 *
 * // 清理监听器
 * subscription.remove();
 * ```
 */
export function createExtensionLogListener(
  callback: (event: ExtensionLogEvent) => void,
): EventSubscription {
  if (Platform.OS !== 'ios') {
    // 非 iOS 平台返回空操作对象
    return { remove: () => {} };
  }

  const emitter = new NativeEventEmitter(NativeModule);
  const subscription = emitter.addListener('extension-log', callback);

  return {
    remove: () => {
      subscription.remove();
    },
  };
}

/**
 * 创建 quota-exhausted 事件监听器
 * 当 iOS Extension 检测到今日配额耗尽时触发（App 在前台时实时响应）
 * 后台场景：用户点击推送通知 → App 唤醒 → AppState active → sync.ts 中 getFocusStatus 检测 quotaExhausted 标记
 * @param callback 事件回调函数
 * @returns 事件订阅对象，调用 remove() 方法取消监听
 */
export function createQuotaExhaustedListener(
  callback: () => void,
): EventSubscription {
  if (Platform.OS !== 'ios') {
    return { remove: () => {} };
  }

  const emitter = new NativeEventEmitter(NativeModule);
  const subscription = emitter.addListener('quota-exhausted', callback);

  return {
    remove: () => {
      subscription.remove();
    },
  };
}

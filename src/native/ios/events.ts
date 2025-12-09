/**
 * iOS 原生模块事件监听封装 - 监听部分
 * 封装 NativeModule 的事件监听功能
 */

import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import type { FocusStateEvent } from '../type';

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

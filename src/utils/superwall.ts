/**
 * Superwall 工具函数
 * 封装 paywall 展示相关的功能
 */

import { usePlacement, useUser } from 'expo-superwall';

/**
 * 使用 Superwall placement 展示 paywall 的 hook
 *
 * @param placementName - Placement 名称，在 Superwall Dashboard 中配置
 * @param options - 可选的配置选项
 * @returns registerPlacement 函数和当前状态
 *
 * @example
 * ```tsx
 * const { registerPlacement, state } = useSuperwallPaywall('campaign_trigger');
 *
 * <Button onPress={() => registerPlacement({ placement: 'campaign_trigger' })} title="显示 Paywall" />
 * ```
 */
export function useSuperwall() {
  const { registerPlacement, state } = usePlacement({
    onPresent: info => {
      console.log('[Paywall Presented]', info);
    },
    onDismiss: (info, result) => {
      console.log('[Paywall Dismissed]', info, 'Result:', result);
    },
    onSkip: reason => {
      console.log('[Paywall Skipped]', reason);
    },
    onError: error => {
      console.log('[Paywall Error]', error);
    },
  });

  return {
    registerPlacement,
    state,
  };
}

/**
 * 使用 Superwall 用户管理的 hook
 * 提供用户识别和属性设置功能
 *
 * @example
 * ```tsx
 * const { identify, update, signOut } = useSuperwallUser();
 *
 * // 登录时识别用户
 * await identify(userId);
 * await update({ username: userInfo.username, phone: userInfo.phone });
 * ```
 */
export function useSuperwallUser() {
  return useUser();
}

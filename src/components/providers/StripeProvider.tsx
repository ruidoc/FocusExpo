import { StripeProvider } from '@stripe/stripe-react-native';
import * as Linking from 'expo-linking';
import { useCallback, useEffect, type ReactElement } from 'react';

// Stripe 可发布密钥（测试环境）
// TODO: 替换为你的 Stripe publishable key
const STRIPE_PUBLISHABLE_KEY =
  'pk_test_51PP0XS1n1QMvNfT8hAF8yllFt8BYJhzFdOteg8sBwbEgbJnn42T86fu7TY4FD0pGLBvLKAYm7S6oPIiCtedvemPL00KKNl2DOX';

// 商户标识符（Apple Pay 需要）
const MERCHANT_IDENTIFIER = 'merchant.com.focusone';

// URL Scheme（用于 3D Secure 和银行重定向后返回应用）
const URL_SCHEME = 'focusone';

interface StripeProviderWrapperProps {
  children: ReactElement;
}

/**
 * Stripe 支付 Provider 包装组件
 *
 * 功能：
 * 1. 初始化 Stripe SDK
 * 2. 处理 Deep Link 回调（3D Secure、银行重定向等）
 * 3. 支持 Apple Pay（需要配置 merchantIdentifier）
 */
export const StripeProviderWrapper = ({
  children,
}: StripeProviderWrapperProps) => {
  // 处理 Stripe 相关的 Deep Link 回调
  const handleDeepLink = useCallback(async (url: string | null) => {
    if (url && url.includes('stripe-redirect')) {
      console.log('【Stripe】Deep link received:', url);
      // Stripe SDK 会自动处理 URL 回调
      // 这里可以添加额外的处理逻辑
    }
  }, []);

  useEffect(() => {
    // 处理应用启动时的 deep link
    const handleInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      handleDeepLink(initialUrl);
    };

    handleInitialURL();

    // 监听 deep link 事件
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => {
      subscription.remove();
    };
  }, [handleDeepLink]);

  // 如果没有配置 publishable key，不渲染 StripeProvider
  if (
    !STRIPE_PUBLISHABLE_KEY ||
    STRIPE_PUBLISHABLE_KEY.includes('your_publishable_key')
  ) {
    console.warn('【Stripe】请配置 STRIPE_PUBLISHABLE_KEY');
    return children;
  }

  return (
    <StripeProvider
      publishableKey={STRIPE_PUBLISHABLE_KEY}
      merchantIdentifier={MERCHANT_IDENTIFIER}
      urlScheme={URL_SCHEME}
    >
      {children}
    </StripeProvider>
  );
};

export default StripeProviderWrapper;

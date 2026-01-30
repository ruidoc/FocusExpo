import {
  PresentPaymentSheetResult,
  useStripe,
} from '@stripe/stripe-react-native';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import request from './request';

/**
 * 从服务端获取 PaymentSheet 参数的响应类型
 */
interface PaymentSheetParams {
  paymentIntent: string; // PaymentIntent client secret
  customerSessionClientSecret?: string; // CustomerSession client secret
  customer?: string; // Customer ID
  publishableKey: string;
}

/**
 * 自定义错误类型
 */
interface StripePaymentError {
  code: string;
  message: string;
}

/**
 * 支付结果类型
 */
export type PaymentResult =
  | { success: true }
  | { success: false; error: StripePaymentError; canceled: boolean };

/**
 * Stripe 支付 Hook
 *
 * 使用示例：
 * ```tsx
 * const { initializePayment, presentPayment, loading } = useStripePayment();
 *
 * const handlePayment = async () => {
 *   const initialized = await initializePayment({ amount: 999, currency: 'cny' });
 *   if (initialized) {
 *     const result = await presentPayment();
 *     if (result.success) {
 *       // 支付成功
 *     }
 *   }
 * };
 * ```
 */
export const useStripePayment = () => {
  const { initPaymentSheet, presentPaymentSheet, resetPaymentSheetCustomer } =
    useStripe();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  /**
   * 从服务端获取 PaymentSheet 参数
   *
   * @param params 支付参数
   * @returns PaymentSheet 配置参数
   */
  const fetchPaymentSheetParams = async (params: {
    amount: number;
    currency?: string;
    productId?: string;
    productName?: string;
    period?: number;
  }): Promise<PaymentSheetParams | null> => {
    try {
      const response = await request.post<{ data: PaymentSheetParams }>(
        '/stripe/ios/create-payment-sheet',
        {
          amount: params.amount,
          currency: params.currency || 'cny',
          productId: params.productId,
          productName: params.productName,
          period: params.period,
        },
      );
      return (response as any).data as PaymentSheetParams;
    } catch (error) {
      console.error('【Stripe】获取支付参数失败:', error);
      return null;
    }
  };

  /**
   * 初始化 PaymentSheet
   *
   * @param params 支付参数
   * @returns 是否初始化成功
   */
  const initializePayment = useCallback(
    async (params: {
      amount: number;
      currency?: string;
      productId?: string;
      productName?: string;
      merchantDisplayName?: string;
      allowsDelayedPaymentMethods?: boolean;
      defaultBillingDetails?: {
        name?: string;
        email?: string;
        phone?: string;
        address?: {
          country?: string;
          city?: string;
          line1?: string;
          line2?: string;
          postalCode?: string;
          state?: string;
        };
      };
    }): Promise<boolean> => {
      setLoading(true);
      setReady(false);

      try {
        const paymentParams = await fetchPaymentSheetParams({
          amount: params.amount,
          currency: params.currency,
          productId: params.productId,
          productName: params.productName,
        });

        if (!paymentParams) {
          Alert.alert('错误', '获取支付信息失败，请稍后重试');
          return false;
        }

        const { error } = await initPaymentSheet({
          merchantDisplayName: params.merchantDisplayName || 'FocusOne',
          paymentIntentClientSecret: paymentParams.paymentIntent,
          customerId: paymentParams.customer,
          customerEphemeralKeySecret: paymentParams.customerSessionClientSecret,
          // 允许延迟支付方式（如银行转账）
          allowsDelayedPaymentMethods:
            params.allowsDelayedPaymentMethods ?? false,
          // 默认账单信息
          defaultBillingDetails: params.defaultBillingDetails,
          // iOS 返回 URL
          returnURL: 'focusone://stripe-redirect',
          // Apple Pay 配置
          applePay: {
            merchantCountryCode: 'CN',
          },
          // Google Pay 配置
          googlePay: {
            merchantCountryCode: 'CN',
            testEnv: __DEV__, // 开发环境使用测试模式
          },
        });

        if (error) {
          console.error('【Stripe】初始化 PaymentSheet 失败:', error);
          Alert.alert('错误', error.message || '初始化支付失败');
          return false;
        }

        setReady(true);
        return true;
      } catch (error) {
        console.error('【Stripe】初始化支付异常:', error);
        Alert.alert('错误', '初始化支付失败，请稍后重试');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [initPaymentSheet],
  );

  /**
   * 展示 PaymentSheet 并处理支付
   *
   * @returns 支付结果
   */
  const presentPayment = useCallback(async (): Promise<PaymentResult> => {
    if (!ready) {
      return {
        success: false,
        error: { code: 'Failed', message: '支付未初始化' },
        canceled: false,
      };
    }

    setLoading(true);

    try {
      const { error }: PresentPaymentSheetResult = await presentPaymentSheet();

      if (error) {
        console.log('【Stripe】支付结果:', error.code, error.message);
        const canceled = error.code === 'Canceled';
        if (!canceled) {
          Alert.alert('支付失败', error.message || '支付未完成');
        }
        return {
          success: false,
          error: { code: error.code, message: error.message || '支付失败' },
          canceled,
        };
      }

      console.log('【Stripe】支付成功');
      return { success: true };
    } catch (error) {
      console.error('【Stripe】支付异常:', error);
      return {
        success: false,
        error: { code: 'Failed', message: '支付异常' },
        canceled: false,
      };
    } finally {
      setLoading(false);
      setReady(false);
    }
  }, [ready, presentPaymentSheet]);

  /**
   * 一键支付（初始化 + 展示）
   *
   * @param params 支付参数
   * @returns 支付结果
   */
  const checkout = useCallback(
    async (params: {
      amount: number;
      currency?: string;
      productId?: string;
      productName?: string;
      merchantDisplayName?: string;
    }): Promise<PaymentResult> => {
      const initialized = await initializePayment(params);
      if (!initialized) {
        return {
          success: false,
          error: {
            code: 'Failed',
            message: '初始化失败',
          },
          canceled: false,
        };
      }
      return presentPayment();
    },
    [initializePayment, presentPayment],
  );

  /**
   * 用户登出时清除 Stripe 客户信息
   */
  const clearCustomer = useCallback(async () => {
    try {
      await resetPaymentSheetCustomer();
      console.log('【Stripe】已清除客户信息');
    } catch (error) {
      console.error('【Stripe】清除客户信息失败:', error);
    }
  }, [resetPaymentSheetCustomer]);

  return {
    /** 初始化 PaymentSheet */
    initializePayment,
    /** 展示 PaymentSheet */
    presentPayment,
    /** 一键支付（初始化 + 展示） */
    checkout,
    /** 清除客户信息（登出时调用） */
    clearCustomer,
    /** 是否正在加载 */
    loading,
    /** PaymentSheet 是否已准备好 */
    ready,
  };
};

export default useStripePayment;

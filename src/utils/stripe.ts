/**
 * Stripe WebView 支付 Hook
 *
 * 使用 Stripe Checkout Session + WebView 完成支付
 * 替代原生 SDK 的 PaymentSheet
 */
import type { StripePaymentResult } from '@/components/business';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import request from './request';

/**
 * Checkout Session 响应类型
 */
interface CheckoutSessionResponse {
  /** Checkout 页面 URL */
  checkoutUrl: string;
  /** Session ID */
  sessionId: string;
}

/**
 * 支付结果类型（导出供外部使用）
 */
export type PaymentResult =
  | { success: true; sessionId?: string }
  | { success: false; canceled: boolean; error?: string };

/**
 * Stripe WebView 支付 Hook
 *
 * 使用示例：
 * ```tsx
 * const { createCheckout, loading, checkoutUrl, visible, handleClose } = useStripePayment();
 *
 * const handlePayment = async () => {
 *   const result = await createCheckout({
 *     amount: 999,
 *     currency: 'cny',
 *     productName: '月度会员',
 *   });
 *   if (result) {
 *     // checkoutUrl 已设置，StripeWebView 会自动显示
 *   }
 * };
 *
 * return (
 *   <>
 *     <Button onPress={handlePayment}>支付</Button>
 *     <StripeWebView
 *       visible={visible}
 *       checkoutUrl={checkoutUrl}
 *       onClose={handleClose}
 *     />
 *   </>
 * );
 * ```
 */
export const useStripePayment = () => {
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [onCompleteCallback, setOnCompleteCallback] = useState<
    ((result: PaymentResult) => void) | null
  >(null);

  /**
   * 创建 Checkout Session 并获取支付链接
   */
  const createCheckoutSession = async (params: {
    amount: number;
    currency?: string;
    productId?: string;
    productName?: string;
    period?: number;
    /** 成功回调 URL（后端需要配置） */
    successUrl?: string;
    /** 取消回调 URL（后端需要配置） */
    cancelUrl?: string;
  }): Promise<CheckoutSessionResponse | null> => {
    try {
      const response = await request.post<{ data: CheckoutSessionResponse }>(
        '/stripe/create-checkout-session',
        {
          amount: params.amount,
          currency: params.currency || 'cny',
          productId: params.productId,
          productName: params.productName,
          period: params.period,
          successUrl: params.successUrl || 'focusone://stripe/success',
          cancelUrl: params.cancelUrl || 'focusone://stripe/cancel',
        },
      );
      return (response as any).data as CheckoutSessionResponse;
    } catch (error) {
      console.error('【Stripe】创建 Checkout Session 失败:', error);
      return null;
    }
  };

  /**
   * 创建订阅 Checkout Session
   */
  const createSubscriptionSession = async (params: {
    priceId: string;
    productId?: string;
    productName?: string;
    period?: number;
    successUrl?: string;
    cancelUrl?: string;
  }): Promise<CheckoutSessionResponse | null> => {
    try {
      const response = await request.post<{ data: CheckoutSessionResponse }>(
        '/stripe/create-subscription-session',
        {
          priceId: params.priceId,
          productId: params.productId,
          productName: params.productName,
          period: params.period,
          successUrl: params.successUrl || 'focusone://stripe/success',
          cancelUrl: params.cancelUrl || 'focusone://stripe/cancel',
        },
      );
      return (response as any).data as CheckoutSessionResponse;
    } catch (error) {
      console.error('【Stripe】创建订阅 Session 失败:', error);
      return null;
    }
  };

  /**
   * 发起一次性支付
   *
   * @param params 支付参数
   * @param onComplete 支付完成回调
   */
  const checkout = useCallback(
    async (
      params: {
        amount: number;
        currency?: string;
        productId?: string;
        productName?: string;
      },
      onComplete?: (result: PaymentResult) => void,
    ): Promise<boolean> => {
      setLoading(true);

      try {
        const session = await createCheckoutSession({
          amount: params.amount,
          currency: params.currency,
          productId: params.productId,
          productName: params.productName,
        });

        if (!session) {
          Alert.alert('错误', '创建支付订单失败，请稍后重试');
          setLoading(false);
          return false;
        }

        setCheckoutUrl(session.checkoutUrl);
        setSessionId(session.sessionId);
        setOnCompleteCallback(() => onComplete ?? null);
        setVisible(true);
        setLoading(false);
        return true;
      } catch (error) {
        console.error('【Stripe】发起支付失败:', error);
        Alert.alert('错误', '发起支付失败，请稍后重试');
        setLoading(false);
        return false;
      }
    },
    [],
  );

  /**
   * 发起订阅支付
   *
   * @param params 订阅参数
   * @param onComplete 支付完成回调
   */
  const subscribe = useCallback(
    async (
      params: {
        priceId: string;
        productId?: string;
        productName?: string;
        period?: number;
      },
      onComplete?: (result: PaymentResult) => void,
    ): Promise<boolean> => {
      setLoading(true);

      try {
        const session = await createSubscriptionSession({
          priceId: params.priceId,
          productId: params.productId,
          productName: params.productName,
          period: params.period,
        });

        if (!session) {
          Alert.alert('错误', '创建订阅失败，请稍后重试');
          setLoading(false);
          return false;
        }

        setCheckoutUrl(session.checkoutUrl);
        setSessionId(session.sessionId);
        setOnCompleteCallback(() => onComplete ?? null);
        setVisible(true);
        setLoading(false);
        return true;
      } catch (error) {
        console.error('【Stripe】发起订阅失败:', error);
        Alert.alert('错误', '发起订阅失败，请稍后重试');
        setLoading(false);
        return false;
      }
    },
    [],
  );

  /**
   * 处理 WebView 关闭
   */
  const handleClose = useCallback(
    (result: StripePaymentResult) => {
      setVisible(false);
      setCheckoutUrl('');

      const paymentResult: PaymentResult = result.success
        ? { success: true, sessionId: result.sessionId }
        : { success: false, canceled: result.canceled, error: result.error };

      if (result.success) {
        console.log('【Stripe】支付成功，session_id:', result.sessionId);
      } else if (result.canceled) {
        console.log('【Stripe】用户取消支付');
      } else {
        console.log('【Stripe】支付失败:', result.error);
      }

      // 调用完成回调
      onCompleteCallback?.(paymentResult);
      setOnCompleteCallback(null);
      setSessionId(null);
    },
    [onCompleteCallback],
  );

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    setLoading(false);
    setVisible(false);
    setCheckoutUrl('');
    setSessionId(null);
    setOnCompleteCallback(null);
  }, []);

  return {
    /** 发起一次性支付 */
    checkout,
    /** 发起订阅支付 */
    subscribe,
    /** 处理 WebView 关闭 */
    handleClose,
    /** 重置状态 */
    reset,
    /** 是否正在加载 */
    loading,
    /** WebView 是否可见 */
    visible,
    /** Checkout URL */
    checkoutUrl,
    /** 当前 Session ID */
    sessionId,
  };
};

export default useStripePayment;

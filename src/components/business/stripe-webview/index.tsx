/**
 * Stripe WebView 支付组件
 *
 * 使用 Stripe Checkout Session 在 WebView 中完成支付
 * 通过监听 URL 变化判断支付结果
 */
import { Button } from '@/components/ui';
import Icon from '@expo/vector-icons/Ionicons';
import { useTheme } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation } from 'react-native-webview';

/**
 * 支付结果类型
 */
export interface StripePaymentResult {
  success: boolean;
  canceled: boolean;
  sessionId?: string;
  error?: string;
}

/**
 * 组件 Props
 */
interface StripeWebViewProps {
  /** 是否显示 */
  visible: boolean;
  /** Stripe Checkout URL */
  checkoutUrl: string;
  /** 成功回调 URL 前缀（用于判断支付成功） */
  successUrlPrefix?: string;
  /** 取消回调 URL 前缀（用于判断用户取消） */
  cancelUrlPrefix?: string;
  /** 关闭回调 */
  onClose: (result: StripePaymentResult) => void;
  /** 标题 */
  title?: string;
}

/**
 * Stripe WebView 支付弹窗
 */
export const StripeWebView = ({
  visible,
  checkoutUrl,
  successUrlPrefix = 'focusone://stripe/success',
  cancelUrlPrefix = 'focusone://stripe/cancel',
  onClose,
  title = '安全支付',
}: StripeWebViewProps) => {
  const { colors } = useTheme();
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 判断 URL 是否是有效的 Stripe Checkout URL
  const isValidCheckoutUrl =
    checkoutUrl && checkoutUrl.startsWith('https://checkout.stripe.com');

  // 当 visible 或 checkoutUrl 变化时，重置状态
  useEffect(() => {
    if (visible && isValidCheckoutUrl) {
      setLoading(true);
      setError(null);
      console.log('【Stripe WebView】准备加载:', checkoutUrl);
    }
  }, [visible, checkoutUrl, isValidCheckoutUrl]);

  /**
   * 从 URL 中提取 session_id
   */
  const extractSessionId = (url: string): string | undefined => {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('session_id') ?? undefined;
    } catch {
      // 对于 deep link，尝试简单解析
      const match = url.match(/session_id=([^&]+)/);
      return match?.[1];
    }
  };

  /**
   * 处理 URL 变化
   */
  const handleNavigationStateChange = useCallback(
    (navState: WebViewNavigation) => {
      const { url, loading: isLoading } = navState;
      console.log('【Stripe WebView】URL 变化:', url, '加载中:', isLoading);

      // 更新加载状态
      if (!isLoading) {
        setLoading(false);
      }

      // 检查是否是成功 URL
      if (url.startsWith(successUrlPrefix)) {
        const sessionId = extractSessionId(url);
        console.log('【Stripe WebView】支付成功，session_id:', sessionId);
        onClose({ success: true, canceled: false, sessionId });
        return;
      }

      // 检查是否是取消 URL
      if (url.startsWith(cancelUrlPrefix)) {
        console.log('【Stripe WebView】用户取消支付');
        onClose({ success: false, canceled: true });
        return;
      }
    },
    [successUrlPrefix, cancelUrlPrefix, onClose],
  );

  /**
   * 处理 URL 请求（用于拦截 deep link）
   */
  const handleShouldStartLoadWithRequest = useCallback(
    (request: { url: string }) => {
      const { url } = request;

      // 拦截 success URL
      if (url.startsWith(successUrlPrefix)) {
        const sessionId = extractSessionId(url);
        onClose({ success: true, canceled: false, sessionId });
        return false; // 阻止加载
      }

      // 拦截 cancel URL
      if (url.startsWith(cancelUrlPrefix)) {
        onClose({ success: false, canceled: true });
        return false; // 阻止加载
      }

      // 允许其他 URL 加载
      return true;
    },
    [successUrlPrefix, cancelUrlPrefix, onClose],
  );

  /**
   * 处理关闭
   */
  const handleClose = useCallback(() => {
    onClose({ success: false, canceled: true });
  }, [onClose]);

  /**
   * 处理加载开始
   */
  const handleLoadStart = useCallback(() => {
    setLoading(true);
  }, []);

  /**
   * 处理加载完成
   */
  const handleLoadEnd = useCallback(() => {
    setLoading(false);
  }, []);

  /**
   * 处理加载错误
   */
  const handleError = useCallback(() => {
    setLoading(false);
    setError('页面加载失败，请检查网络后重试');
  }, []);

  /**
   * 重试加载
   */
  const handleRetry = useCallback(() => {
    setError(null);
    setLoading(true);
    webViewRef.current?.reload();
  }, []);

  // 不显示 Modal 时返回 null
  if (!visible) {
    return null;
  }

  // URL 无效时显示加载状态
  if (!isValidCheckoutUrl) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}>
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
            <View className="w-7" />
            <Text className="text-[17px] font-semibold text-foreground">
              {title}
            </Text>
            <Pressable onPress={handleClose} className="p-1">
              <Icon name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="mt-3 text-sm text-foreground/60">
              正在准备支付...
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}>
      <SafeAreaView className="flex-1 bg-background">
        {/* 顶部导航栏 */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
          <View className="w-7" />
          <Text className="text-[17px] font-semibold text-foreground">
            {title}
          </Text>
          <Pressable onPress={handleClose} className="p-1">
            <Icon name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* WebView 容器 */}
        <View className="flex-1">
          {error ? (
            <View className="flex-1 items-center justify-center p-5">
              <Icon name="warning-outline" size={48} color={colors.primary} />
              <Text className="text-base text-foreground text-center mt-3 mb-5">
                {error}
              </Text>
              <Button type="primary" onPress={handleRetry}>
                重试
              </Button>
            </View>
          ) : (
            <>
              <WebView
                key={checkoutUrl} // 关键：URL 变化时强制重新渲染
                ref={webViewRef}
                source={{ uri: checkoutUrl }}
                onNavigationStateChange={handleNavigationStateChange}
                onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
                onLoadStart={handleLoadStart}
                onLoadEnd={handleLoadEnd}
                onError={handleError}
                startInLoadingState={false}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                sharedCookiesEnabled={true}
                thirdPartyCookiesEnabled={true}
                className="flex-1"
              />
              {/* {loading && (
                <View className="absolute inset-0 bg-background items-center justify-center">
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text className="mt-3 text-sm text-foreground/60">
                    正在加载支付页面...
                  </Text>
                </View>
              )} */}
            </>
          )}
        </View>

        {/* 底部安全提示 */}
        <View className="flex-row items-center justify-center py-2 bg-muted">
          <Icon name="lock-closed" size={12} color={colors.text} />
          <Text className="text-xs text-foreground/50 ml-1">
            由 Stripe 提供安全支付服务
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default StripeWebView;

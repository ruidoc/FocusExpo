/**
 * PostHog Provider 封装组件
 * 统一管理 PostHog 初始化配置
 */

import { setGlobalPostHogInstance } from '@/utils/analytics';
import { PostHogProvider, usePostHog } from 'posthog-react-native';
import { ReactNode, useEffect } from 'react';

// PostHog 配置
const POSTHOG_API_KEY = 'phc_A4Pt2WQHEQLedNR9wyLMxSHrpdnOdUTCiR8LHNGT5QG';
const POSTHOG_HOST = 'https://us.i.posthog.com';

interface PostHogProviderWrapperProps {
  children: ReactNode;
}

/**
 * 内部组件：用于设置全局 PostHog 实例
 */
const PostHogInstanceSetter = ({ children }: { children: ReactNode }) => {
  const posthog = usePostHog();

  useEffect(() => {
    // 设置全局实例，供非组件代码使用
    setGlobalPostHogInstance(posthog);
    console.log('[PostHog] 全局实例已设置');

    return () => {
      // 清理时移除全局实例
      setGlobalPostHogInstance(null);
    };
  }, [posthog]);

  return <>{children}</>;
};

/**
 * PostHog Provider 封装组件
 * 在 SuperwallProvider 外层使用，确保 PostHog 先初始化
 */
export const PostHogProviderWrapper = ({ children }: PostHogProviderWrapperProps) => {
  return (
    <PostHogProvider
      apiKey={POSTHOG_API_KEY}
      options={{
        host: POSTHOG_HOST,
        enableSessionReplay: true,
      }}
      autocapture
    >
      <PostHogInstanceSetter>{children}</PostHogInstanceSetter>
    </PostHogProvider>
  );
};

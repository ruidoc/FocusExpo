/**
 * PostHog Provider 封装组件
 * 统一管理 PostHog 初始化配置
 */

import { setGlobalPostHogInstance } from '@/utils/analytics';
import { PostHogProvider, usePostHog } from 'posthog-react-native';
import { ReactNode, useEffect } from 'react';

import { POSTHOG_HOST } from '@/config/env';

// PostHog 配置
const POSTHOG_API_KEY = 'phc_A4Pt2WQHEQLedNR9wyLMxSHrpdnOdUTCiR8LHNGT5QG';
// 通过自建代理访问 PostHog，解决中国大陆访问不稳定问题
// host 由 @/config/env.ts 统一管理，基于 API_BASE_URL + '/i'

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
      setGlobalPostHogInstance(null);
    };
  }, [posthog]);

  return <>{children}</>;
};

/**
 * PostHog Provider 封装组件
 * 在 SuperwallProvider 外层使用，确保 PostHog 先初始化
 */
export const PostHogProviderWrapper = ({
  children,
}: PostHogProviderWrapperProps) => {
  return (
    <PostHogProvider
      apiKey={POSTHOG_API_KEY}
      options={{
        host: POSTHOG_HOST,
        enableSessionReplay: false, // 关闭 Session Replay，减少代理压力
        // 增加 flush 间隔，减少网络请求频率
        flushInterval: 30000, // 30秒（默认 10-15秒）
        flushAt: 20, // 累积 20 个事件才 flush（默认 20）
      }}>
      <PostHogInstanceSetter>{children}</PostHogInstanceSetter>
    </PostHogProvider>
  );
};

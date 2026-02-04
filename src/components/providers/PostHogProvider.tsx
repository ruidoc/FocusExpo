/**
 * PostHog Provider 封装组件
 * 统一管理 PostHog 初始化配置
 */

import { useExperimentStore } from '@/stores';
import type { FeatureFlagState } from '@/stores/experiment';
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
 * 内部组件：用于设置全局 PostHog 实例并监听 Feature Flags
 */
const PostHogInstanceSetter = ({ children }: { children: ReactNode }) => {
  const posthog = usePostHog();
  const setFeatureFlags = useExperimentStore(state => state.setFeatureFlags);

  useEffect(() => {
    // 设置全局实例，供非组件代码使用
    setGlobalPostHogInstance(posthog);
    console.log('[PostHog] 全局实例已设置');

    // 监听 Feature Flags 加载完成
    const unsubscribe = posthog.onFeatureFlags(flags => {
      console.log('[PostHog] ========== onFeatureFlags 触发 ==========');
      console.log('[PostHog] 所有标记:', flags);

      const flagStates: Record<string, FeatureFlagState> = {};

      if (Array.isArray(flags)) {
        // 如果返回数组 ['flag1', 'flag2']
        for (const key of flags) {
          const enabled = posthog.isFeatureEnabled(String(key)) || false;
          const payload = posthog.getFeatureFlagPayload(String(key));

          flagStates[String(key)] = {
            key: String(key),
            enabled,
            variant: enabled,
            payload,
            serverValue: enabled, // 保存原始服务器值
            isOverridden: false,
          };
        }
      } else if (flags && typeof flags === 'object') {
        // 如果返回对象 {flag1: true, flag2: 'variant'}
        for (const [key, value] of Object.entries(flags)) {
          const payload = posthog.getFeatureFlagPayload(key);
          // 根据 serverValue 决定 enabled 状态
          // 如果 serverValue 是 "test"，enabled 为 true
          // 如果 serverValue 是 "control"，enabled 为 false
          // 否则使用 isFeatureEnabled 的结果
          let enabled: boolean;
          if (value === 'test') {
            enabled = true;
          } else if (value === 'control') {
            enabled = false;
          } else if (typeof value === 'boolean') {
            enabled = value;
          } else {
            enabled = posthog.isFeatureEnabled(key) || false;
          }

          flagStates[key] = {
            key,
            enabled,
            variant: value,
            payload,
            serverValue: value, // 保存原始服务器值
            isOverridden: false,
          };
        }
      }

      console.log(
        '[PostHog] 解析出',
        Object.keys(flagStates).length,
        '个Feature Flags',
      );
      console.log('[PostHog] Feature Flags 详情:', flagStates);
      console.log('[PostHog] ========== 同步到 ExperimentStore ==========');
      setFeatureFlags(flagStates);
    });

    return () => {
      // 清理时移除全局实例和取消订阅
      if (unsubscribe) unsubscribe();
      setGlobalPostHogInstance(null);
    };
  }, [posthog, setFeatureFlags]);

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
      }}
      autocapture>
      <PostHogInstanceSetter>{children}</PostHogInstanceSetter>
    </PostHogProvider>
  );
};

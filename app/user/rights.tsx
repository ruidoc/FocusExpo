import { Page } from '@/components/business';
import { Toast } from '@/components/ui';
import { useSubscriptionStore } from '@/stores';
import {
  trackPaywallOpened,
  trackManageSubscriptionClicked,
  trackRightsPageViewed,
} from '@/utils';
import Icon from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const BENEFITS = [
  { icon: 'infinite' as const, title: '无限契约', desc: '不限专注契约数量' },
  { icon: 'apps' as const, title: '更多应用位', desc: '屏蔽更多分心应用' },
  { icon: 'stats-chart' as const, title: '高级统计', desc: '多维度数据分析' },
  { icon: 'shield-checkmark' as const, title: '优先支持', desc: '专属客服通道' },
];
const PRIVACY_URL = 'https://focus.freeshore.cn/privacy';

const RightsPage = () => {
  const { dark } = useTheme();
  const subStore = useSubscriptionStore();
  const [loading, setLoading] = useState(false);
  const isFocusedRef = useRef(true);

  const sub = subStore.subscription;
  const isActive = subStore.isSubscribed;

  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;
      trackRightsPageViewed({
        screen_name: 'rights_page',
        entry_source: 'rights_page',
        subscription_status: subStore.subscription?.status,
        is_entitled: subStore.isSubscribed,
        expires_at: subStore.subscription?.expires_at,
      });
      useSubscriptionStore.getState().getSubscription();
      return () => {
        isFocusedRef.current = false;
      };
    }, [subStore.isSubscribed, subStore.subscription?.expires_at, subStore.subscription?.status]),
  );

  const handleUpgrade = async () => {
    setLoading(true);
    trackPaywallOpened('paywall_index', {
      entry_source: 'rights_page',
      screen_name: 'rights_page',
    });
    try {
      if (!isFocusedRef.current) return;
      router.push('/paywall');
    } finally {
      setLoading(false);
    }
  };

  const onManageSubscriptions = async () => {
    trackManageSubscriptionClicked({
      screen_name: 'rights_page',
      subscription_status: sub?.status,
      is_entitled: isActive,
      expires_at: sub?.expires_at,
    });
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL(
          'itms-apps://apps.apple.com/account/subscriptions',
        );
      }
    } catch {
      Toast('无法打开订阅管理页面');
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  const sourceLabel: Record<string, string> = {
    app_store: 'App Store',
    superwall: 'App Store',
    stripe: 'Stripe',
    play_store: 'Google Play',
  };

  const statusLabel = (s: string) => {
    if (s === 'active') return '生效中';
    if (s === 'canceled' || s === 'cancelled') return '已取消';
    return '已到期';
  };

  const statusColor = (s: string) => {
    if (s === 'active') return '#16B364';
    if (s === 'canceled' || s === 'cancelled') return '#F59E0B';
    return '#EF4444';
  };

  const ACCENT = dark ? '#C4A6FF' : '#7A5AF8';
  const ACCENT_BG = dark ? '#1A1530' : '#F3EEFF';
  const CARD = dark ? '#1C1C26' : '#fff';
  const BORDER = dark ? '#2A2A3A' : '#E5E7EB';
  const TEXT2 = dark ? '#8A8A98' : '#94A3B8';

  return (
    <Page>
      <ScrollView className="flex-1 px-5 pt-5">
        {isActive && sub && (
          <View
            className="rounded-[18px] p-5 mb-6 border"
            style={{
              backgroundColor: dark ? '#2A1F48' : '#EDE5FF',
              borderColor: dark ? '#4A3580' : '#C4A6FF',
            }}>
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center gap-2">
                <Icon name="diamond" size={22} color="#FFC107" />
                <Text
                  className="text-lg font-bold"
                  style={{ color: dark ? '#D4BBFF' : '#6B3FD4' }}>
                  VIP 会员
                </Text>
              </View>
              <View
                className="px-2.5 py-0.5 rounded-xl"
                style={{ backgroundColor: statusColor(sub.status) + '20' }}>
                <Text
                  className="text-xs font-semibold"
                  style={{ color: statusColor(sub.status) }}>
                  {sub.is_trial === 1 ? '试用中' : statusLabel(sub.status)}
                </Text>
              </View>
            </View>
            <View className="flex-row flex-wrap gap-4">
              {[
                { label: '订阅来源', value: sourceLabel[sub.source] || sub.source },
                {
                  label: '订阅周期',
                  value:
                    sub.period === 1
                      ? '月度'
                      : sub.period === 7
                        ? '周度'
                      : sub.period === 12
                        ? '年度'
                        : `${sub.period}期`,
                },
                { label: '开始时间', value: formatDate(sub.started_at) },
                { label: '到期时间', value: formatDate(sub.expires_at) },
              ].map(item => (
                <View key={item.label} className="w-[45%]">
                  <Text
                    className="text-[11px] mb-0.5"
                    style={{ color: dark ? '#8A7DB8' : '#9B8ACE' }}>
                    {item.label}
                  </Text>
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: dark ? '#D4BBFF' : '#6B3FD4' }}>
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {!isActive && (
          <>
            <Text
              className="text-2xl font-extrabold text-center mb-2"
              style={{ color: dark ? '#E5E7EB' : '#0F172A' }}>
              解锁全部能力
            </Text>
            <Text
              className="text-sm text-center mb-7"
              style={{ color: TEXT2, lineHeight: 22 }}>
              不限契约数量，屏蔽更多应用，掌控你的专注时间
            </Text>
          </>
        )}

        <View className="flex-row flex-wrap gap-2.5 mb-7">
          {BENEFITS.map(b => (
            <View
              key={b.icon}
              className="w-[48%] rounded-[14px] p-4 border-hairline"
              style={{ backgroundColor: CARD, borderColor: BORDER }}>
              <View
                className="w-9 h-9 rounded-[10px] justify-center items-center mb-2.5"
                style={{ backgroundColor: ACCENT_BG }}>
                <Icon name={b.icon} size={18} color={ACCENT} />
              </View>
              <Text
                className="text-[15px] font-semibold mb-0.5"
                style={{ color: dark ? '#E5E7EB' : '#0F172A' }}>
                {b.title}
              </Text>
              <Text className="text-xs" style={{ color: TEXT2 }}>
                {b.desc}
              </Text>
            </View>
          ))}
        </View>

        {!isActive ? (
          <TouchableOpacity
            className="h-[54px] rounded-[14px] justify-center items-center mb-4"
            style={{ backgroundColor: '#7A5AF8', opacity: loading ? 0.7 : 1 }}
            activeOpacity={0.8}
            disabled={loading}
            onPress={handleUpgrade}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-[17px] font-bold text-white">立即订阅</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            className="h-[54px] rounded-[14px] justify-center items-center mb-4 border"
            style={{ backgroundColor: CARD, borderColor: BORDER }}
            activeOpacity={0.7}
            onPress={onManageSubscriptions}>
            <Text
              className="text-[17px] font-bold"
              style={{ color: ACCENT }}>
              管理订阅
            </Text>
          </TouchableOpacity>
        )}

        <View className="flex-row justify-center gap-6 mb-5">
          {!isActive && (
            <TouchableOpacity className="py-2" onPress={onManageSubscriptions}>
              <Text className="text-sm" style={{ color: ACCENT }}>
                管理订阅
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="flex-row justify-center gap-4 pb-8">
          <TouchableOpacity
            onPress={() =>
              Linking.openURL('https://focusone.ruidoc.cn/agreement')
            }>
            <Text className="text-xs" style={{ color: TEXT2 }}>
              用户协议
            </Text>
          </TouchableOpacity>
          <Text className="text-xs" style={{ color: TEXT2 }}>
            ·
          </Text>
          <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL)}>
            <Text className="text-xs" style={{ color: TEXT2 }}>
              隐私政策
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Page>
  );
};

export default RightsPage;

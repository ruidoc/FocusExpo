import { FieldGroup, FieldItem, Flex } from '@/components/ui';
import {
  useBenefitStore,
  useRecordStore,
  useSubscriptionStore,
  useUserStore,
} from '@/stores';
import { toast } from '@/utils';
import Icon from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const App = () => {
  const store = useUserStore();
  const subStore = useSubscriptionStore();
  const recStore = useRecordStore();
  const benefitStore = useBenefitStore();
  const { dark } = useTheme();
  const insets = useSafeAreaInsets();

  const toLogin = () => {
    if (!store.uInfo) {
      router.push('/login/wx');
    } else {
      router.push('/user/edit');
    }
  };

  const toNavigate = (route: any) => {
    if (route === 'Vip') {
      return toast('VIP功能暂未开放');
    }
    if (route) {
      router.push(route);
    }
  };

  const formatMins = (m: number) => {
    const h = Math.floor((m || 0) / 60);
    const mm = (m || 0) % 60;
    if (h) return `${h}h${mm}m`;
    return `${mm}m`;
  };

  const formatExpiry = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  const MenuIcon = ({
    icon,
    size = 18,
  }: {
    icon: keyof typeof Icon.glyphMap;
    size?: number;
  }) => <Icon name={icon} size={size} color={dark ? '#6B7280' : '#94A3B8'} />;

  useFocusEffect(
    useCallback(() => {
      if (store.uInfo) {
        useSubscriptionStore.getState().getSubscription();
      }
    }, [store.uInfo]),
  );

  const sub = subStore.subscription;
  const isActive = subStore.isSubscribed;

  const sourceLabel: Record<string, string> = {
    app_store: 'App Store',
    superwall: 'App Store',
    stripe: 'Stripe',
    play_store: 'Google Play',
  };

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: dark ? '#14141C' : '#fff' }}>
      {/* 个人信息 */}
      <Flex
        className="justify-between items-center px-6 pb-5"
        style={{ paddingTop: insets.top + 16 }}>
        <Flex onPress={toLogin}>
          <Image
            source={
              store.uInfo?.avatar
                ? { uri: store.uInfo.avatar }
                : require('@/assets/images/logo.png')
            }
            className="w-14 h-14 rounded-[18px] mr-3.5"
          />
          <View>
            {store.uInfo ? (
              <>
                <Text
                  className="text-[22px] font-semibold mb-0.5"
                  style={{ color: dark ? '#E5E7EB' : '#0F172A' }}>
                  {store.uInfo.username}
                </Text>
                <Text
                  className="text-[13px]"
                  style={{ color: dark ? '#8A8A98' : '#94A3B8' }}>
                  {store.uInfo.phone}
                </Text>
              </>
            ) : (
              <Text
                className="text-[22px] font-semibold"
                style={{ color: dark ? '#E5E7EB' : '#0F172A' }}>
                请登录
              </Text>
            )}
          </View>
        </Flex>
        {store.uInfo && (
          <TouchableOpacity
            activeOpacity={0.6}
            className="p-2"
            onPress={() => router.push('/user/edit')}>
            <Icon
              name="chevron-forward"
              size={20}
              color={dark ? '#6B7280' : '#94A3B8'}
            />
          </TouchableOpacity>
        )}
      </Flex>

      {/* 会员卡片 */}
      {store.uInfo && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => toNavigate('paywall')}
          className="mx-4 rounded-2xl p-[18px] overflow-hidden"
          style={
            isActive
              ? {
                  backgroundColor: dark ? '#1C1A14' : '#FFFBF0',
                  borderWidth: 1,
                  borderColor: dark
                    ? 'rgba(212,164,74,0.25)'
                    : 'rgba(212,164,74,0.35)',
                }
              : {
                  backgroundColor: dark ? '#1C1C26' : '#F5F7FB',
                  borderWidth: 1,
                  borderColor: dark ? '#2A2A3A' : '#E5E7EB',
                }
          }>
          <View className="flex-row items-center justify-between">
            <View>
              <View className="flex-row items-center gap-1.5">
                <Icon
                  name="diamond"
                  size={18}
                  color={isActive ? '#D4A44A' : dark ? '#6B7280' : '#94A3B8'}
                />
                <Text
                  className="text-base font-semibold"
                  style={{
                    color: isActive ? '#D4A44A' : dark ? '#8A8A98' : '#64748B',
                  }}>
                  {isActive ? 'Pro 会员' : 'Pro 会员'}
                </Text>
              </View>
              {!isActive && (
                <Text
                  className="text-[12px] mt-1"
                  style={{ color: dark ? '#555' : '#B0B8C4' }}>
                  今日剩余可专注：
                  {(() => {
                    const left = Math.max(
                      benefitStore.day_duration - benefitStore.today_used,
                      0,
                    );
                    if (left >= 60) {
                      const h = Math.floor(left / 60);
                      const m = left % 60;
                      return m > 0 ? `${h}小时${m}分钟` : `${h}小时`;
                    }
                    return `${left}分钟`;
                  })()}
                </Text>
              )}
            </View>
            {!isActive && (
              <TouchableOpacity
                activeOpacity={0.7}
                className="px-3.5 py-1.5 rounded-[20px]"
                style={{ backgroundColor: '#D4A44A' }}
                onPress={() => toNavigate('paywall')}>
                <Text className="text-[13px] font-semibold text-white">
                  升级
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {isActive && sub && (
            <View className="flex-row mt-3.5 gap-5">
              <View className="gap-0.5">
                <Text
                  className="text-[11px]"
                  style={{ color: dark ? '#7A7060' : '#B8A080' }}>
                  订阅来源
                </Text>
                <Text
                  className="text-[13px] font-medium"
                  style={{ color: '#D4A44A' }}>
                  {sourceLabel[sub.source] || sub.source}
                </Text>
              </View>
              <View className="gap-0.5">
                <Text
                  className="text-[11px]"
                  style={{ color: dark ? '#7A7060' : '#B8A080' }}>
                  到期时间
                </Text>
                <Text
                  className="text-[13px] font-medium"
                  style={{ color: '#D4A44A' }}>
                  {formatExpiry(sub.expires_at)}
                </Text>
              </View>
              {sub.is_trial === 1 && (
                <View className="gap-0.5">
                  <Text
                    className="text-[11px]"
                    style={{ color: dark ? '#7A7060' : '#B8A080' }}>
                    状态
                  </Text>
                  <Text
                    className="text-[13px] font-medium"
                    style={{ color: '#D4A44A' }}>
                    试用中
                  </Text>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* 菜单列表 */}
      <Flex className="flex-col items-stretch mt-7 gap-2 opacity-85">
        <FieldGroup className="rounded-[10px] mx-4">
          <FieldItem
            icon={<MenuIcon icon="shield-checkmark-outline" />}
            title="权限管理"
            onPress={() => toNavigate('setting/permission')}
            titleStyle={{ fontSize: 15, marginLeft: 10 }}
          />
          <FieldItem
            icon={<MenuIcon icon="chatbubble-ellipses-outline" />}
            title="意见反馈"
            onPress={() => toNavigate('setting/feedback')}
            titleStyle={{ fontSize: 15, marginLeft: 10 }}
          />
          <FieldItem
            icon={<MenuIcon icon="information-circle-outline" />}
            title="关于我们"
            onPress={() => toNavigate('setting/about')}
            titleStyle={{ fontSize: 15, marginLeft: 10 }}
          />
          <FieldItem
            icon={<MenuIcon icon="settings-outline" />}
            title="设置"
            onPress={() => toNavigate('setting')}
            titleStyle={{ fontSize: 15, marginLeft: 10 }}
          />
        </FieldGroup>
      </Flex>
    </ScrollView>
  );
};

export default App;

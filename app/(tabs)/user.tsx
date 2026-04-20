import { DayDurationBar } from '@/components/business';
import { FieldGroup, FieldItem, Flex, Toast } from '@/components/ui';
import { useBenefitStore, useSubscriptionStore, useUserStore } from '@/stores';
import { useCustomTheme } from '@/config/theme';
import Icon from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const App = () => {
  const store = useUserStore();
  const subStore = useSubscriptionStore();
  const bstore = useBenefitStore();
  const { colors, isDark } = useCustomTheme();
  const insets = useSafeAreaInsets();
  const showVip = bstore.features.includes('show-vip');

  const toLogin = () => {
    if (!store.uInfo) {
      router.push('/login/wx');
    } else {
      router.push('/user/edit');
    }
  };

  const toNavigate = (route: any) => {
    if (route === 'Vip') {
      return Toast('VIP功能暂未开放');
    }
    if (route) {
      router.push(route);
    }
  };

  const toVipEntry = () => {
    if (isActive) {
      router.push('/user/rights');
      return;
    }
    router.push('/paywall');
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
  }) => <Icon name={icon} size={size} color={colors.text3} />;

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
      style={{ backgroundColor: colors.background }}>
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
                  style={{ color: colors.text }}>
                  {store.uInfo.username}</Text>
                <Text
                  className="text-[13px]"
                  style={{ color: colors.text3 }}>
                  {store.uInfo.phone || '请绑定手机号'}
                </Text>
              </>
            ) : (
              <Text
                className="text-[22px] font-semibold"
                style={{ color: colors.text }}>
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
              color={colors.text3}
            />
          </TouchableOpacity>
        )}
      </Flex>

      {/* 今日专注时长进度条（仅免费用户显示） */}
      <View className="ml-6 mr-6 mb-6">
        <DayDurationBar />
      </View>

      {/* 会员卡片 */}
      {store.uInfo && showVip && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={toVipEntry}
          className="mx-4 rounded-2xl p-[18px] overflow-hidden"
          style={
            isActive
              ? {
                  backgroundColor: isDark ? '#1C1A14' : '#FFFBF0',
                  borderWidth: 0,
                  borderColor: isDark
                    ? 'rgba(212,164,74,0.25)'
                    : 'rgba(212,164,74,0.35)',
                }
              : {
                  backgroundColor: isDark ? colors.border : colors.muted,
                  borderWidth: 0,
                  borderColor: isDark ? '#2A2A3A' : '#E5E7EB',
                }
          }>
          <View className="flex-row items-center justify-between">
            <View>
              <View className="flex-row items-center gap-1.5">
                <Icon name="diamond" size={18} color={'#D4A44A'} />
                <Text
                  className="text-base font-semibold"
                  style={{
                    color: isActive ? '#D4A44A' : isDark ? '#8A8A98' : '#64748B',
                  }}>
                  {isActive ? 'Pro 会员' : 'Pro 会员'}
                </Text>
              </View>
              {!isActive && (
                <Text className="mt-1 text-[12px] text-[#8A8A9890]">
                  升级 Pro 解锁每日无限专注时长
                </Text>
              )}
            </View>
            {!isActive && (
              <TouchableOpacity
                activeOpacity={0.7}
                className="px-3.5 py-1.5 rounded-[20px]"
                style={{ backgroundColor: '#D4A44A' }}
                onPress={() => router.push('/paywall')}>
                <Text className="text-[13px] font-semibold text-[#461702]">
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
                  style={{ color: isDark ? '#7A7060' : '#B8A080' }}>
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
                  style={{ color: isDark ? '#7A7060' : '#B8A080' }}>
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
                    style={{ color: isDark ? '#7A7060' : '#B8A080' }}>
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
      <Flex className="flex-col items-stretch mt-4 gap-2 opacity-85">
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

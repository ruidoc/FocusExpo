/**
 * Paywall 支付页
 *
 * 按参考图样式：深色紫蓝背景、订阅卡片、五星评价、渐变按钮
 * 使用 App Store IAP（expo-iap）订阅支付
 */
import { Page } from '@/components/business';
import { Checkbox, Toast } from '@/components/ui';
import { useSubscriptionStore, useUserStore } from '@/stores';
import request from '@/utils/request';
import Icon from '@expo/vector-icons/Ionicons';
import { useTheme } from '@react-navigation/native';
import type { Purchase, SubscriptionProduct } from 'expo-iap';
import { ErrorCode, useIAP } from 'expo-iap';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ProductConfig {
  id?: string;
  name: string;
  period: number;
  product_id: string;
  price_id?: string;
  price: number;
  original_price?: number;
  is_subscription?: number;
}

const FALLBACK_PRODUCTS: ProductConfig[] = [
  {
    name: '周度会员',
    period: 0,
    product_id: 'com.focusone.week',
    price: 699,
    original_price: 999,
    is_subscription: 1,
  },
  {
    name: '年度会员',
    period: 12,
    product_id: 'com.focusone.vip_12',
    price: 299,
    original_price: 999,
    is_subscription: 1,
  },
];

const TESTIMONIAL =
  '「专注力明显提升，计划功能帮我养成了稳定习惯，强烈推荐！」';

// 权益列表（按参考图：闪电、目标、图表、盾牌）
const BENEFITS = [
  { icon: 'flash' as const, text: '无限专注计划与深度练习' },
  { icon: 'flag' as const, text: '设定目标并实时跟踪进度' },
  { icon: 'stats-chart' as const, text: '详细数据分析与表现洞察' },
  { icon: 'shield-checkmark' as const, text: '专家精选内容，助你达成目标' },
];

type DisplayProduct = ProductConfig & { iapProduct?: SubscriptionProduct };

// 设计色板
const BG = '#100E26';
const CARD_BG = '#1C1A32';
const YELLOW = '#FBBF24';
const PURPLE_LIGHT = '#8B5CF6';
const PURPLE_DARK = '#6D28D9';
const WHITE = '#FFFFFF';
const TEXT_MUTED = 'rgba(255,255,255,0.7)';

const PaywallPage = () => {
  useTheme(); // 本页固定深色主题
  const insets = useSafeAreaInsets();
  const subStore = useSubscriptionStore();
  const userStore = useUserStore();
  const [configs, setConfigs] = useState<ProductConfig[]>(FALLBACK_PRODUCTS);
  const [selectedSku, setSelectedSku] = useState<string>(
    FALLBACK_PRODUCTS[1].product_id,
  );
  const [configLoading, setConfigLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<
    'idle' | 'processing' | 'success' | 'failed'
  >('idle');
  const [agreed, setAgreed] = useState(false);

  const {
    connected,
    subscriptions,
    fetchProducts,
    requestPurchase,
    restorePurchases,
  } = useIAP({
    onPurchaseSuccess: async (_purchase: Purchase) => {
      setPaymentStatus('success');
      Toast('订阅成功，感谢您的购买');
      // Webhook 入库可能有延迟，短轮询获取订阅后再关闭
      await subStore.getSubscription();
      for (let i = 0; i < 3; i++) {
        await new Promise(r => setTimeout(r, 1000));
        await subStore.getSubscription();
        if (useSubscriptionStore.getState().isSubscribed) break;
      }
      router.back();
    },
    onPurchaseError: (error: { code?: string; message?: string }) => {
      if (error?.code === ErrorCode.E_USER_CANCELLED) {
        setPaymentStatus('idle');
        return;
      }
      setPaymentStatus('failed');
      Toast(error?.message ?? '购买失败');
    },
  });

  const fetchConfig = useCallback(async () => {
    setConfigLoading(true);
    try {
      const res = (await request.get('/product/list', {
        params: { product_class: 'iOS', is_subscription: 1 },
      })) as { statusCode?: number; data?: ProductConfig[] };
      if (
        res?.statusCode === 200 &&
        Array.isArray(res.data) &&
        res.data.length > 0
      ) {
        const list = res.data.map((p: any) => ({
          name: p.name ?? '会员',
          period: p.period ?? 0,
          product_id: p.product_id ?? p.id ?? '',
          price_id: p.price_id,
          price: p.price ?? 0,
          original_price: p.original_price ?? p.price,
          is_subscription: p.is_subscription ?? 1,
        }));
        setConfigs(list);
        setSelectedSku(prev =>
          list.some((c: ProductConfig) => c.product_id === prev)
            ? prev
            : list[0].product_id,
        );
      }
    } catch (e) {
      console.log('[Paywall] 获取商品配置失败，使用静态数据:', e);
    } finally {
      setConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    if (!connected || configs.length === 0) return;
    const skus = configs.map(c => c.product_id);
    fetchProducts({ skus, type: 'subs' }).catch(() => {
      Toast('商品加载失败，请检查网络与 App Store 配置');
    });
  }, [connected, configs, fetchProducts]);

  const displayProducts: DisplayProduct[] = useMemo(() => {
    return configs.map(c => ({
      ...c,
      iapProduct: subscriptions.find(
        (s: SubscriptionProduct) => s.id === c.product_id,
      ),
    }));
  }, [configs, subscriptions]);

  const selectedProduct =
    displayProducts.find(p => p.product_id === selectedSku) ??
    displayProducts[0];

  const formatPrice = (priceInCents: number) =>
    `¥${(priceInCents / 100).toFixed(2)}`;

  const getPriceDisplay = (p: DisplayProduct) => {
    if (p.iapProduct?.displayPrice) {
      return p.iapProduct.displayPrice;
    }
    return formatPrice(p.price);
  };

  const getPillLabel = (p: ProductConfig, idx: number) => {
    if (idx === 0) return '免费';
    if (p.original_price && p.original_price > p.price) {
      const rate = Math.round((1 - p.price / p.original_price) * 100);
      return `省 ${rate}%`;
    }
    return null;
  };

  const doCheckout = async () => {
    if (!selectedProduct) return;
    setPaymentStatus('processing');
    try {
      const appAccountToken = userStore.uInfo?.superwall_uuid;
      await requestPurchase({
        request: {
          ios: {
            sku: selectedProduct.product_id,
            ...(appAccountToken && { appAccountToken }),
          },
        },
        type: 'subs',
      });
    } catch (err: any) {
      if (err?.code !== ErrorCode.E_USER_CANCELLED) {
        setPaymentStatus('failed');
        Toast(err?.message ?? '下单失败');
      } else {
        setPaymentStatus('idle');
      }
    }
  };

  const handleCheckout = () => {
    if (!selectedProduct) return;
    if (!agreed) {
      Alert.alert('会员自动续费服务协议', '已阅读并同意会员自动续费服务协议', [
        { text: '取消', style: 'cancel' },
        {
          text: '同意',
          onPress: () => {
            setAgreed(true);
            doCheckout();
          },
        },
      ]);
    } else {
      doCheckout();
    }
  };

  const onRestore = async () => {
    try {
      await restorePurchases();
      await subStore.getSubscription();
      Toast('已恢复购买记录');
    } catch {
      Toast('恢复失败，请稍后重试');
    }
  };

  const isSelected = (p: ProductConfig) => p.product_id === selectedSku;

  return (
    <Page bgcolor={BG}>
      {/* 右上角关闭 */}
      <Pressable
        onPress={() => router.back()}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={{
          position: 'absolute',
          top: insets.top,
          right: 16,
          zIndex: 10,
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: 'rgba(255,255,255,0.12)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Icon name="close" size={22} color={WHITE} />
      </Pressable>

      {/* 滚动区 */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 52,
          paddingBottom: 24,
        }}
        showsVerticalScrollIndicator={false}>
        {/* 标题：解锁 专业版 掌控专注（专业版高亮、居中、不大写粗） */}
        <View className="mb-6 items-center">
          <Text
            className="text-3xl leading-10"
            style={{ color: WHITE }}>
            解锁 <Text style={{ color: PURPLE_LIGHT }}>专业版</Text> 掌控专注
          </Text>
        </View>

        {/* 权益列表 */}
        <View className="mb-6" style={{ gap: 16 }}>
          {BENEFITS.map((b, i) => (
            <View key={i} className="flex-row items-center">
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: PURPLE_LIGHT,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 14,
                }}>
                <Icon name={b.icon} size={18} color={WHITE} />
              </View>
              <Text className="flex-1 text-[15px]" style={{ color: WHITE }}>
                {b.text}
              </Text>
            </View>
          ))}
        </View>

        {/* 订阅卡片 */}
        {!connected || configLoading ? (
          <View className="py-8 items-center">
            <ActivityIndicator size="large" color={PURPLE_LIGHT} />
          </View>
        ) : (
          <View style={{ gap: 12, marginBottom: 20 }}>
            {displayProducts.map((p, idx) => {
              const selected = isSelected(p);
              const pillLabel = getPillLabel(p, idx);
              const isYearly = p.period >= 12;
              return (
                <Pressable
                  key={p.product_id}
                  onPress={() => setSelectedSku(p.product_id)}
                  style={{
                    backgroundColor: CARD_BG,
                    borderRadius: 16,
                    padding: 18,
                    borderWidth: 2,
                    borderColor: selected
                      ? PURPLE_LIGHT
                      : 'rgba(255,255,255,0.2)',
                    overflow: 'hidden',
                  }}>
                  {/* BEST OFFER 角标（年度） */}
                  {isYearly && (
                    <View
                      style={{
                        position: 'absolute',
                        top: -2,
                        right: 16,
                        zIndex: 1,
                        backgroundColor: PURPLE_DARK,
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        borderBottomLeftRadius: 8,
                        borderBottomRightRadius: 8,
                      }}>
                      <Text
                        className="text-xs font-bold"
                        style={{ color: WHITE }}>
                        最划算
                      </Text>
                    </View>
                  )}
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text
                        className="text-base font-semibold"
                        style={{ color: WHITE }}>
                        {p.name}
                      </Text>
                      <Text
                        className="text-sm mt-1"
                        style={{ color: TEXT_MUTED }}>
                        3 天免费试用
                      </Text>
                    </View>
                    {pillLabel && (
                      <View
                        style={{
                          backgroundColor: YELLOW,
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 12,
                          marginHorizontal: 10,
                        }}>
                        <Text
                          className="text-xs font-bold"
                          style={{ color: '#1F2937' }}>
                          {pillLabel}
                        </Text>
                      </View>
                    )}
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text
                        className="text-lg font-bold"
                        style={{ color: WHITE }}>
                        {getPriceDisplay(p as DisplayProduct)}
                      </Text>
                      <Text className="text-xs" style={{ color: TEXT_MUTED }}>
                        {isYearly ? '每周' : '每周'}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* 用户评价 */}
        <View
          style={{
            backgroundColor: CARD_BG,
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
          }}>
          {/* 五星 */}
          <View className="flex-row justify-center mb-3" style={{ gap: 4 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <Icon key={i} name="star" size={18} color={YELLOW} />
            ))}
          </View>
          <Text
            className="text-sm text-center leading-5"
            style={{ color: TEXT_MUTED }}>
            {TESTIMONIAL}
          </Text>
        </View>

        {paymentStatus === 'success' && (
          <View className="items-center mb-6">
            <Icon name="checkmark-circle" size={40} color="#22C55E" />
            <Text
              className="text-base font-semibold mt-2"
              style={{ color: '#22C55E' }}>
              支付成功
            </Text>
          </View>
        )}

        {/* 立即扣款前可随时取消 - 滚动区底部 */}
        <View
          className="flex-row items-center justify-center pt-4 pb-2"
          style={{ gap: 8 }}>
          <View
            style={{
              width: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: 'rgba(139,92,246,0.3)',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Icon name="checkmark" size={12} color={PURPLE_LIGHT} />
          </View>
          <Text className="text-sm" style={{ color: TEXT_MUTED }}>
            立即扣款前可随时取消
          </Text>
        </View>
      </ScrollView>

      {/* 底部固定区 */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: insets.bottom,
          backgroundColor: BG,
        }}>
        {/* 勾选《会员自动续费服务协议》 */}
        <View className="flex-row items-center mb-3 gap-1">
          <Checkbox
            value={agreed}
            onChange={setAgreed}
            size={18}
            activeColor={PURPLE_LIGHT}
          />
          <View
            className="flex-1 flex-row flex-wrap items-center"
            style={{ gap: 0 }}>
            <Pressable onPress={() => setAgreed(!agreed)}>
              <Text className="text-xs" style={{ color: TEXT_MUTED }}>
                已阅读并同意{' '}
              </Text>
            </Pressable>
            <Pressable
              onPress={() =>
                Linking.openURL('https://focusone.ruidoc.cn/agreement')
              }>
              <Text className="text-xs text-white">
                《会员自动续费服务协议》
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 渐变主按钮 */}
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={!connected || paymentStatus === 'processing'}
          onPress={handleCheckout}
          style={{
            opacity: !connected || paymentStatus === 'processing' ? 0.6 : 1,
            height: 56,
            borderRadius: 28,
            overflow: 'hidden',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <LinearGradient
            colors={[PURPLE_LIGHT, PURPLE_DARK]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            {paymentStatus === 'processing' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-lg font-bold" style={{ color: WHITE }}>
                开始免费试用
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
        {/* <Text
          className="text-xs text-center mt-3 mb-4"
          style={{ color: TEXT_MUTED }}>
          3 天免费试用，之后{' '}
          {selectedProduct &&
            getPriceDisplay(selectedProduct as DisplayProduct)}
          /周
        </Text> */}
      </View>
    </Page>
  );
};

export default PaywallPage;

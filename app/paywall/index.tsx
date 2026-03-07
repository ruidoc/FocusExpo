/**
 * Paywall 支付页 — App Store IAP 订阅
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

const BENEFITS = [
  '无限选择APP数量，可选分类',
  '不限制每日专注时长',
  '多维度专注数据分析',
  '优先体验新功能',
];

type DisplayProduct = ProductConfig & { iapProduct?: SubscriptionProduct };

// 设计色板 — 金色 VIP 主题
const BG = '#111111';
const CARD_BG = '#1E1C16';
const GOLD = '#D4A44A';
const GOLD_LIGHT = '#EFCB68';
const GOLD_DARK = '#B8862D';
const WHITE = '#FFFFFF';
const TEXT_MUTED = 'rgba(255,255,255,0.6)';

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
      {/* 顶部栏：左关闭 / 右恢复购买 */}
      <View
        className="flex-row items-center justify-between"
        style={{
          position: 'absolute',
          top: insets.top,
          left: 16,
          right: 16,
          zIndex: 10,
        }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: 'rgba(255,255,255,0.12)',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Icon name="close" size={20} color={WHITE} />
        </Pressable>
        <Pressable onPress={onRestore} hitSlop={12}>
          <Text className="text-[13px]" style={{ color: TEXT_MUTED }}>
            恢复购买
          </Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: insets.top + 60,
          paddingBottom: 24,
        }}
        showsVerticalScrollIndicator={false}>
        {/* 标题 */}
        <View className="flex-row items-center justify-center mb-8">
          <Text
            className="text-[28px] font-bold mr-1"
            style={{ color: WHITE, lineHeight: 36 }}>
            专注契约
          </Text>
          <LinearGradient
            colors={[GOLD_LIGHT, GOLD_DARK]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 8,
            }}>
            <Text className="text-[18px] font-bold" style={{ color: WHITE }}>
              Pro
            </Text>
          </LinearGradient>
        </View>

        {/* 权益 — 对勾 + 单行 */}
        <View style={{ gap: 20, marginBottom: 36 }}>
          {BENEFITS.map((text, i) => (
            <View key={i} className="flex-row items-center" style={{ gap: 14 }}>
              <Icon name="checkmark-circle" size={22} color={GOLD} />
              <Text
                className="text-[16px] font-medium"
                style={{ color: 'rgba(255,255,255,0.75)' }}>
                {text}
              </Text>
            </View>
          ))}
        </View>

        {/* 订阅卡片 */}
        {!connected || configLoading ? (
          <View className="py-8 items-center">
            <ActivityIndicator size="large" color={GOLD} />
          </View>
        ) : (
          <View style={{ gap: 12, marginBottom: 8 }}>
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
                    borderColor: selected ? GOLD : 'rgba(255,255,255,0.12)',
                    overflow: 'hidden',
                  }}>
                  {isYearly && (
                    <View
                      style={{
                        position: 'absolute',
                        top: -2,
                        right: 16,
                        zIndex: 1,
                        backgroundColor: GOLD_DARK,
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
                        style={{ color: selected ? GOLD_LIGHT : WHITE }}>
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
                          backgroundColor: GOLD,
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 12,
                          marginHorizontal: 10,
                        }}>
                        <Text
                          className="text-xs font-bold"
                          style={{ color: '#1A1200' }}>
                          {pillLabel}
                        </Text>
                      </View>
                    )}
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text
                        className="text-lg font-bold"
                        style={{ color: selected ? GOLD_LIGHT : WHITE }}>
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
      </ScrollView>

      {/* 底部固定区 */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: insets.bottom + 8,
          backgroundColor: BG,
        }}>
        {/* CTA 按钮 */}
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={!connected || paymentStatus === 'processing'}
          onPress={handleCheckout}
          style={{
            opacity: !connected || paymentStatus === 'processing' ? 0.6 : 1,
            height: 54,
            borderRadius: 27,
            overflow: 'hidden',
          }}>
          <LinearGradient
            colors={[GOLD_LIGHT, GOLD_DARK]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            {paymentStatus === 'processing' ? (
              <ActivityIndicator color="#1A1200" />
            ) : (
              <Text
                className="text-[17px] font-bold"
                style={{ color: '#1A1200' }}>
                开始免费试用
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* 协议 */}
        <View
          className="flex-row justify-center items-center mt-3"
          style={{ gap: 2 }}>
          <Checkbox
            value={agreed}
            onChange={setAgreed}
            size={16}
            activeColor={GOLD}
          />
          <Pressable onPress={() => setAgreed(!agreed)}>
            <Text className="text-[11px]" style={{ color: TEXT_MUTED }}>
              同意
            </Text>
          </Pressable>
          <Pressable
            onPress={() =>
              Linking.openURL('https://focusone.ruidoc.cn/agreement')
            }>
            <Text
              className="text-[11px]"
              style={{ color: 'rgba(255,255,255,0.8)' }}>
              《自动续费服务协议》
            </Text>
          </Pressable>
        </View>
      </View>
    </Page>
  );
};

export default PaywallPage;

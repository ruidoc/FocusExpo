/**
 * Paywall 支付页 — App Store IAP 订阅
 */
import { Page } from '@/components/business';
import { Checkbox, Toast } from '@/components/ui';
import { useSubscriptionStore, useUserStore } from '@/stores';
import type { Product } from '@/stores/subscription';
import {
  trackPaywallOpened,
  trackPaywallClosed,
  trackPaywallProductSelected,
  trackPaywallPurchaseClicked,
  trackPurchaseCancelled,
  trackPurchaseStarted,
  trackPurchaseCompleted,
  trackPurchaseFailed,
  trackRestoreCompleted,
  trackRestoreFailed,
  trackRestoreStarted,
} from '@/utils';
import { isSubscriptionEntitled } from '@/utils/subscription';
import Icon from '@expo/vector-icons/Ionicons';
import { useTheme } from '@react-navigation/native';
import type { Purchase, SubscriptionProduct } from 'expo-iap';
import { ErrorCode, isEligibleForIntroOfferIOS, useIAP } from 'expo-iap';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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

const BENEFITS = [
  '无限选择APP数量，可选分类',
  '不限制每日专注时长',
  '多维度专注数据分析',
  '优先体验新功能',
];

// 设计色板 — 金色 VIP 主题
const BG = '#111111';
const CARD_BG = '#1E1C16';
const GOLD = '#D4A44A';
const GOLD_LIGHT = '#EFCB68';
const GOLD_DARK = '#B8862D';
const WHITE = '#FFFFFF';
const TEXT_MUTED = 'rgba(255,255,255,0.6)';

type OfferPeriod = {
  unit: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' | '';
  value: number;
};

type OfferInfo = {
  displayPrice: string;
  paymentMode: '' | 'FREETRIAL' | 'PAYASYOUGO' | 'PAYUPFRONT';
  period: OfferPeriod;
  periodCount: number;
  price: number;
  type: 'introductory' | 'promotional';
};

type SubscriptionInfoLike = {
  introductoryOffer?: OfferInfo;
  subscriptionGroupId?: string;
};

type DisplayProduct = Product & {
  iapProduct?: SubscriptionProduct;
  isEligibleForIntroOffer?: boolean;
};

type RuntimeDiscount = {
  localizedPrice?: string;
  priceFormatted?: string;
  priceString?: string;
  paymentMode?: string;
  modeType?: string;
  subscriptionPeriod?: string;
  recurringSubscriptionPeriod?: string;
  numberOfPeriods?: string | number;
  numOfPeriods?: string | number;
};

const formatPeriodLabel = (period?: OfferPeriod) => {
  if (!period || !period.value) return '';
  switch (period.unit) {
    case 'DAY':
      return `${period.value}天`;
    case 'WEEK':
      return period.value === 1 ? '首周' : `${period.value}周`;
    case 'MONTH':
      return period.value === 1 ? '首月' : `${period.value}个月`;
    case 'YEAR':
      return period.value === 1 ? '首年' : `${period.value}年`;
    default:
      return '';
  }
};

const normalizePriceText = (text?: string) => text?.replace(/\.00\b/, '') || '';

const getSubscriptionInfo = (
  product?: SubscriptionProduct,
): SubscriptionInfoLike => {
  return (
    (
      product as SubscriptionProduct & {
        subscriptionInfoIOS?: SubscriptionInfoLike;
      }
    )?.subscriptionInfoIOS ?? {}
  );
};

const parseIsoPeriod = (period?: string) => {
  const match = period?.match(
    /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?$/,
  );
  if (!match) return null;

  const [, years, months, weeks, days] = match;
  if (years) return { unit: 'YEAR' as const, value: Number(years) };
  if (months) return { unit: 'MONTH' as const, value: Number(months) };
  if (weeks) return { unit: 'WEEK' as const, value: Number(weeks) };
  if (days) return { unit: 'DAY' as const, value: Number(days) };
  return null;
};

const getDiscountFromJsonRepresentation = (product?: SubscriptionProduct) => {
  const jsonRepresentation = (product as any)?.jsonRepresentationIOS;
  if (!jsonRepresentation) return null;

  try {
    const parsed = JSON.parse(jsonRepresentation);
    const discounts = parsed?.attributes?.offers?.flatMap(
      (offer: any) => offer?.discounts || [],
    );
    return discounts?.[0] || null;
  } catch {
    return null;
  }
};

const getDiscount = (product?: SubscriptionProduct): RuntimeDiscount | null => {
  const runtimeDiscount =
    (product as any)?.discounts?.[0] || (product as any)?.discountsIOS?.[0];
  return runtimeDiscount || getDiscountFromJsonRepresentation(product);
};

const getOfferPaymentMode = (
  product?: SubscriptionProduct,
  discount?: RuntimeDiscount,
) => {
  const rawMode =
    (product as any)?.introductoryPricePaymentModeIOS ||
    discount?.paymentMode ||
    discount?.modeType ||
    '';

  const normalizedMode = String(rawMode).toUpperCase();
  if (normalizedMode === 'FREETRIAL' || normalizedMode === 'FREE_TRIAL') {
    return 'FREETRIAL' as const;
  }
  if (normalizedMode === 'PAYASYOUGO' || normalizedMode === 'PAY_AS_YOU_GO') {
    return 'PAYASYOUGO' as const;
  }
  if (normalizedMode === 'PAYUPFRONT' || normalizedMode === 'PAY_UP_FRONT') {
    return 'PAYUPFRONT' as const;
  }
  return '' as const;
};

const getOfferPeriodText = (
  product?: SubscriptionProduct,
  paymentMode?: string,
  discount?: RuntimeDiscount | null,
) => {
  const parsedIsoPeriod = parseIsoPeriod(
    discount?.subscriptionPeriod || discount?.recurringSubscriptionPeriod,
  );

  const introductoryPeriodUnit = (product as any)
    ?.introductoryPriceSubscriptionPeriodIOS as OfferPeriod['unit'] | undefined;
  const introductoryPeriodCount = Number(
    (product as any)?.introductoryPriceNumberOfPeriodsIOS,
  );

  const fallbackPeriod =
    parsedIsoPeriod ||
    (introductoryPeriodUnit && introductoryPeriodCount
      ? {
          unit: introductoryPeriodUnit,
          value: introductoryPeriodCount,
        }
      : null);

  if (!fallbackPeriod?.value) return '';

  if (paymentMode === 'FREETRIAL') {
    return formatPeriodLabel(fallbackPeriod);
  }

  if (fallbackPeriod.unit === 'WEEK' && fallbackPeriod.value === 1) {
    return '首周';
  }
  if (fallbackPeriod.unit === 'MONTH' && fallbackPeriod.value === 1) {
    return '首月';
  }
  if (fallbackPeriod.unit === 'YEAR' && fallbackPeriod.value === 1) {
    return '首年';
  }
  if (fallbackPeriod.unit === 'DAY' && fallbackPeriod.value === 7) {
    return '首周';
  }

  return formatPeriodLabel(fallbackPeriod);
};

const getOfferPriceText = (discount?: RuntimeDiscount | null) => {
  return normalizePriceText(
    discount?.localizedPrice ||
      discount?.priceFormatted ||
      discount?.priceString,
  );
};

const getOfferCopy = (product?: DisplayProduct) => {
  if (!product?.iapProduct) {
    return {
      offerText: '',
      checkoutText: '立即开通',
    };
  }

  const info = getSubscriptionInfo(product.iapProduct);
  const explicitOffer = info.introductoryOffer;
  const eligible = product.isEligibleForIntroOffer;
  const discount = getDiscount(product.iapProduct);
  const paymentMode =
    explicitOffer?.paymentMode ||
    getOfferPaymentMode(product.iapProduct, discount);

  if (!paymentMode) {
    return {
      offerText: '',
      checkoutText: '立即开通',
    };
  }

  if (eligible === false) {
    return {
      offerText: '新用户优惠仅可享受一次',
      checkoutText: '立即开通',
    };
  }

  const periodText =
    (explicitOffer && formatPeriodLabel(explicitOffer.period)) ||
    getOfferPeriodText(product.iapProduct, paymentMode, discount);
  const offerPriceText =
    explicitOffer?.displayPrice || getOfferPriceText(discount);

  if (paymentMode === 'FREETRIAL') {
    return {
      offerText: `${periodText}免费试用`,
      checkoutText: `开始${periodText}免费试用`,
    };
  }

  if (offerPriceText) {
    return {
      offerText: `${periodText}${offerPriceText}`,
      checkoutText: `${periodText}${offerPriceText}开通`,
    };
  }

  return {
    offerText: '',
    checkoutText: '立即开通',
  };
};

const getTrackProductProps = (product?: DisplayProduct) => ({
  screen_name: 'paywall_index',
  product_id: product?.product_id,
  product_name: product?.name,
  period: product?.period,
  price: product?.price,
  currency: 'CNY',
  offer_type: getOfferPaymentMode(product?.iapProduct, getDiscount(product?.iapProduct))
    .toLowerCase() || 'none',
  offer_price: getDiscount(product?.iapProduct)?.priceString,
  is_intro_offer_eligible: product?.isEligibleForIntroOffer,
});

const PaywallPage = () => {
  useTheme(); // 本页固定深色主题
  const insets = useSafeAreaInsets();
  const { products, getProducts } = useSubscriptionStore();
  const userStore = useUserStore();
  const subStore = useSubscriptionStore();
  const [selectedSku, setSelectedSku] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<
    'idle' | 'processing' | 'success' | 'failed'
  >('idle');
  const [agreed, setAgreed] = useState(false);
  const [introOfferEligibility, setIntroOfferEligibility] = useState<
    Record<string, boolean>
  >({});

  const {
    connected,
    subscriptions,
    fetchProducts,
    requestPurchase,
    restorePurchases,
  } = useIAP({
    onPurchaseSuccess: async (_purchase: Purchase) => {
      setPaymentStatus('success');
      trackPurchaseCompleted(selectedProduct?.product_id, {
        ...getTrackProductProps(selectedProduct),
        purchase_source: 'app_store',
      });
      const synced = await waitForSubscriptionSync();
      if (!synced) {
        Alert.alert(
          '购买已完成',
          'App Store 已确认购买，权益通常会在几秒内同步完成。若未立即生效，可稍后返回会员页查看或点击“恢复购买”。',
          [
            {
              text: '知道了',
              onPress: () => router.back(),
            },
          ],
        );
        return;
      }

      Toast('订阅成功，权益已生效');
      router.back();
    },
    onPurchaseError: (error: { code?: string; message?: string }) => {
      if (error?.code === ErrorCode.E_USER_CANCELLED) {
        setPaymentStatus('idle');
        trackPurchaseCancelled(selectedProduct?.product_id, selectedProduct?.period, {
          ...getTrackProductProps(selectedProduct),
          purchase_source: 'app_store',
        });
        return;
      }
      setPaymentStatus('failed');
      trackPurchaseFailed(selectedProduct?.product_id, {
        ...getTrackProductProps(selectedProduct),
        error_code: error?.code,
        error_message: error?.message,
        purchase_source: 'app_store',
      });
      Toast(error?.message ?? '购买失败');
    },
  });

  useEffect(() => {
    trackPaywallOpened('paywall_index', {
      entry_source: 'paywall',
      screen_name: 'paywall_index',
    });
  }, []);

  useEffect(() => {
    if (products.length === 0) {
      getProducts();
    }
  }, [products.length, getProducts]);

  // products 加载后默认选中 period 最大的套餐
  useEffect(() => {
    if (products.length > 0 && !selectedSku) {
      const best = products.reduce((a, b) => (a.period > b.period ? a : b));
      setSelectedSku(best.product_id);
    }
  }, [products, selectedSku]);

  useEffect(() => {
    if (!connected || products.length === 0) return;
    const skus = products.map(c => c.product_id);
    fetchProducts({ skus, type: 'subs' }).catch(() => {
      Toast('商品加载失败，请检查网络与 App Store 配置');
    });
  }, [connected, products, fetchProducts]);

  useEffect(() => {
    const groupIds = Array.from(
      new Set(
        subscriptions
          .map(product => getSubscriptionInfo(product).subscriptionGroupId)
          .filter(Boolean),
      ),
    ) as string[];

    if (groupIds.length === 0) {
      setIntroOfferEligibility({});
      return;
    }

    let mounted = true;
    Promise.all(
      groupIds.map(async groupId => {
        const eligible = await isEligibleForIntroOfferIOS(groupId);
        return [groupId, eligible] as const;
      }),
    )
      .then(entries => {
        if (!mounted) return;
        setIntroOfferEligibility(Object.fromEntries(entries));
      })
      .catch(error => {
        console.warn('[Paywall] 获取 intro offer 资格失败:', error);
      });

    return () => {
      mounted = false;
    };
  }, [subscriptions]);

  const displayProducts: DisplayProduct[] = useMemo(() => {
    return products.map(c => ({
      ...c,
      iapProduct: subscriptions.find(
        (s: SubscriptionProduct) => s.id === c.product_id,
      ),
      isEligibleForIntroOffer:
        introOfferEligibility[
          getSubscriptionInfo(
            subscriptions.find(
              (s: SubscriptionProduct) => s.id === c.product_id,
            ),
          ).subscriptionGroupId || ''
        ],
    }));
  }, [products, subscriptions, introOfferEligibility]);

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

  const getPillLabel = (p: Product) => {
    if (p.original_price && p.original_price > p.price) {
      const rate = Math.round((1 - p.price / p.original_price) * 100);
      return `省 ${rate}%`;
    }
    return null;
  };

  const waitForSubscriptionSync = async () => {
    const delays = [0, 1000, 1500, 2000, 2500, 3000, 4000];

    for (const delay of delays) {
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      await subStore.getSubscription();
      const currentSubscription = useSubscriptionStore.getState().subscription;
      if (isSubscriptionEntitled(currentSubscription)) {
        return true;
      }
    }

    return false;
  };

  const doCheckout = async () => {
    if (!selectedProduct) return;
    setPaymentStatus('processing');
    const productTrackProps = {
      ...getTrackProductProps(selectedProduct),
      placement: 'paywall_index',
    };
    trackPaywallPurchaseClicked(
      selectedProduct.product_id,
      selectedProduct.period,
      productTrackProps,
    );
    trackPurchaseStarted(
      selectedProduct.product_id,
      selectedProduct.period,
      {
        ...productTrackProps,
        purchase_source: 'app_store',
      },
    );
    try {
      const appAccountToken = userStore.uInfo?.account_token;
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
        trackPurchaseFailed(selectedProduct.product_id, {
          ...productTrackProps,
          error_code: err?.code,
          error_message: err?.message,
          purchase_source: 'app_store',
        });
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
    trackRestoreStarted({
      screen_name: 'paywall_index',
      entry_source: 'paywall_index',
    });
    try {
      await restorePurchases();
      const synced = await waitForSubscriptionSync();
      trackRestoreCompleted({
        screen_name: 'paywall_index',
        entry_source: 'paywall_index',
        subscription_status: useSubscriptionStore.getState().subscription?.status,
        is_entitled: synced,
      });
      Toast(synced ? '已恢复购买记录' : '已提交恢复请求，请稍后查看');
    } catch (error: any) {
      trackRestoreFailed({
        screen_name: 'paywall_index',
        entry_source: 'paywall_index',
        error_code: error?.code,
        error_message: error?.message,
      });
      Toast('恢复失败，请稍后重试');
    }
  };

  const isSelected = (p: Product) => p.product_id === selectedSku;

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
          onPress={() => {
            trackPaywallClosed('paywall_index', {
              screen_name: 'paywall_index',
              product_id: selectedProduct?.product_id,
              period: selectedProduct?.period,
              close_action: 'close_button',
            });
            router.back();
          }}
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
        {!connected || products.length === 0 ? (
          <View className="py-8 items-center">
            <ActivityIndicator size="large" color={GOLD} />
          </View>
        ) : (
          <View style={{ gap: 12, marginBottom: 8 }}>
            {displayProducts.map(p => {
              const selected = isSelected(p);
              const pillLabel = getPillLabel(p);
              const isYearly = p.period >= 12;
              return (
                <Pressable
                  key={p.product_id}
                  onPress={() => {
                    setSelectedSku(p.product_id);
                    trackPaywallProductSelected(p.product_id, p.period, {
                      ...getTrackProductProps(p),
                    });
                  }}
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
                        {getOfferCopy(p).offerText || '标准价格，自动续费'}
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
                        {getPriceDisplay(p)}
                      </Text>
                      <Text className="text-xs" style={{ color: TEXT_MUTED }}>
                        {p.period >= 12 ? '/年' : p.period >= 7 ? '/周' : '/月'}
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
                {getOfferCopy(selectedProduct).checkoutText}
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

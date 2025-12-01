import { Page } from '@/components/business';
import { Toast } from '@/components/ui';
import { useVipStore } from '@/stores';
import { fenToYuan } from '@/utils';
import { useTheme } from '@react-navigation/native';
import { Purchase, useIAP, validateReceipt } from 'expo-iap';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// 产品类型定义
const VipPage = () => {
  const store = useVipStore();
  const { colors, dark } = useTheme();
  const [isAgreed, setIsAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    connected,
    purchaseHistories,
    fetchProducts,
    requestPurchase,
    finishTransaction,
    getPurchaseHistories,
  } = useIAP({
    onPurchaseSuccess: purchase => {
      console.log('Purchase successful:', purchase);
      // Handle successful purchase
      validatePurchase(purchase);
    },
    onPurchaseError: error => {
      console.error('Purchase failed:', error);
      // Handle purchase error
    },
    onSyncError: error => {
      console.log('Sync error:', error);
      // Handle transaction finished
    },
  });

  const consumableSkus = [
    'com.focusone.coins_10',
    'com.focusone.coins_30',
    'com.focusone.coins_50',
  ];
  const validatePurchase = async (purchase: Purchase) => {
    try {
      const result = await validateReceipt(purchase.transactionId);
      if (result.isValid) {
        // Grant user the purchased content
        console.log('Receipt is valid');
        try {
          await finishTransaction({ purchase, isConsumable: true });
        } catch (e) {
          console.warn('finishTransaction error:', e);
        }
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  useEffect(() => {
    // if (!connected) return;
    setLoading(true);
    // 必须获取商品列表，才能唤起购买弹窗
    fetchProducts({ skus: consumableSkus, type: 'inapp' })
      .then(() => {
        console.log('商品获取成功');
      })
      .catch(() => {
        Toast({ message: '商品获取失败，请检查产品配置与网络' });
      })
      .finally(() => setLoading(false));
  }, [connected, fetchProducts]);

  useEffect(() => {
    // 加载产品列表
    store.getProducts();
  }, [store]);

  // 设计常量
  const THEME_COLOR = colors.primary; // 使用应用主题色
  // const DARK_BG = dark ? '#121212' : '#FAFAFA';
  const TEXT_LIGHT = '#FFFFFF';
  const TEXT_SECONDARY = '#999999';
  const CARD_BG = dark ? '#222222' : '#FFFFFF';

  const styles = StyleSheet.create({
    // 套餐选择区域
    sectionContainer: {
      paddingHorizontal: 15,
      marginBottom: 30,
    },
    sectionTitle: {
      fontSize: 22,
      color: colors.text,
      marginBottom: 20,
      fontWeight: 'bold',
    },
    plansContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    planCard: {
      width: '32%',
      borderRadius: 15,
      borderWidth: 1.5,
      borderColor: 'transparent',
      overflow: 'hidden',
      backgroundColor: dark ? '#222222' : '#333333',
    },
    planCardSelected: {
      borderColor: THEME_COLOR,
    },
    planContent: {
      padding: 15,
      paddingTop: 40,
      alignItems: 'center',
    },
    planGradient: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
    planLabel: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: THEME_COLOR,
      paddingVertical: 6,
      zIndex: 1,
    },
    planLabelText: {
      color: '#000',
      fontWeight: 'bold',
      textAlign: 'center',
      fontSize: 12,
    },
    planName: {
      fontSize: 16,
      color: TEXT_LIGHT,
      fontWeight: 'bold',
      marginBottom: 15,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
    },
    priceSymbol: {
      fontSize: 18,
      color: TEXT_LIGHT,
      fontWeight: 'bold',
      marginBottom: 3,
    },
    price: {
      fontSize: 36,
      color: TEXT_LIGHT,
      fontWeight: 'bold',
      lineHeight: 38,
    },
    originalPrice: {
      fontSize: 14,
      color: TEXT_SECONDARY,
      textDecorationLine: 'line-through',
      marginLeft: 6,
      marginBottom: 7,
    },
    renewalText: {
      color: TEXT_SECONDARY,
      fontSize: 14,
      marginTop: 15,
      textAlign: 'left',
    },

    // 会员特权区域
    // 底部支付区域
    bottomContainer: {
      padding: 15,
      paddingBottom: 30,
    },
    agreementRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 15,
    },
    checkCircle: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: TEXT_SECONDARY,
      marginRight: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkCircleSelected: {
      borderColor: THEME_COLOR,
      backgroundColor: THEME_COLOR,
    },
    checkMark: {
      color: '#000',
      fontSize: 12,
      fontWeight: 'bold',
    },
    agreementText: {
      color: TEXT_SECONDARY,
      flex: 1,
      fontSize: 13,
    },
    agreementLink: {
      color: colors.text,
      fontWeight: 'bold',
    },
    helpIcon: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1.5,
      borderColor: TEXT_SECONDARY,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
    },
    helpText: {
      color: TEXT_SECONDARY,
      fontSize: 12,
    },
    payButton: {
      height: 55,
      borderRadius: 8,
      backgroundColor: THEME_COLOR,
      justifyContent: 'center',
      alignItems: 'center',
    },
    payText: {
      color: '#000',
      fontSize: 18,
      fontWeight: 'bold',
    },
    // 合规入口区域
    complianceRow: {
      marginTop: 14,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    smallButton: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border || '#E5E7EB',
      backgroundColor: CARD_BG,
    },
    smallButtonText: {
      color: colors.text,
      fontSize: 14,
    },
    linksRow: {
      marginTop: 12,
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
    },
    linkText: {
      color: THEME_COLOR,
      fontSize: 13,
      marginRight: 14,
    },
  });

  const toCharge = (id?: string) => {
    if (!id) return;
    const { close } = Toast.loading({
      message: '等待支付...',
      duration: 0,
      forbidPress: true,
    });
    requestPurchase({ request: { ios: { sku: id } } }).finally(() => {
      close();
    });
  };

  // iOS 合规：恢复购买
  const onRestorePurchases = async () => {
    if (Platform.OS !== 'ios') return;
    getPurchaseHistories(consumableSkus).then(() => {
      console.log('恢复购买记录：', purchaseHistories.length || 0);
    });
  };

  // iOS 合规：管理订阅
  const onManageSubscriptions = async () => {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL(
          'itms-apps://apps.apple.com/account/subscriptions',
        );
      }
    } catch (e) {
      console.warn('打开订阅管理失败：', e);
    }
  };

  const openAgreement = () => {
    Linking.openURL('https://focusone.ruidoc.cn/agreement');
  };

  const openPrivacy = () => {
    Linking.openURL('https://focusone.ruidoc.cn/privacy');
  };

  // 处理价格显示，移除小数点后的0
  const formatPrice = (price: string): string => {
    return price.replace('.00', '');
  };

  return (
    <Page>
      {/* 套餐选择 */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>选择套餐</Text>
        <View style={styles.plansContainer}>
          {store.products.map(product => {
            const isSelected = store.selectedProduct?.id === product.id;
            // 为不同套餐添加适当的标签
            return (
              <TouchableOpacity
                key={product.id}
                activeOpacity={0.8}
                style={[styles.planCard, isSelected && styles.planCardSelected]}
                onPress={() => store.setSelectedProduct(product)}>
                {/* 选中状态的渐变背景 */}
                {isSelected && (
                  <LinearGradient
                    colors={[
                      'rgba(61, 208, 115, 0.2)',
                      'rgba(61, 208, 115, 0.05)',
                    ]}
                    style={styles.planGradient}
                  />
                )}
                {/* 标签 */}
                <View style={styles.planLabel}>
                  <Text style={styles.planLabelText}>购买币</Text>
                </View>
                {/* 内容 */}
                <View style={styles.planContent}>
                  <Text style={styles.planName}>
                    {product.name || '会员套餐'}
                  </Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceSymbol}>¥</Text>
                    <Text style={styles.price}>
                      {formatPrice(fenToYuan(product.price))}
                    </Text>
                    {product.original_price > product.price && (
                      <Text style={styles.originalPrice}>
                        {formatPrice(fenToYuan(product.original_price))}元
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.renewalText}></Text>
      </View>

      {/* 底部支付与合规入口 */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.agreementRow}
          onPress={() => setIsAgreed(!isAgreed)}>
          <View
            style={[
              styles.checkCircle,
              isAgreed && styles.checkCircleSelected,
            ]}>
            {isAgreed && <Text style={styles.checkMark}>✓</Text>}
          </View>
          <Text style={styles.agreementText}>
            已阅读并同意{' '}
            <Text style={styles.agreementLink}>《会员自动续费服务协议》</Text>
            ，不支持退款
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.payButton, !isAgreed && { opacity: 0.7 }]}
          disabled={!isAgreed || !store.selectedProduct}
          onPress={() => toCharge(store.selectedProduct?.product_id)}>
          <Text style={styles.payText}>立即续费</Text>
        </TouchableOpacity>

        {/* 合规入口：恢复购买、管理订阅 */}
        <View style={styles.complianceRow}>
          <TouchableOpacity
            style={styles.smallButton}
            onPress={onRestorePurchases}>
            <Text style={styles.smallButtonText}>恢复购买</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.smallButton}
            onPress={onManageSubscriptions}>
            <Text style={styles.smallButtonText}>管理订阅</Text>
          </TouchableOpacity>
        </View>

        {/* 协议与隐私链接 */}
        <View style={styles.linksRow}>
          <TouchableOpacity onPress={openAgreement}>
            <Text style={styles.linkText}>用户协议</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={openPrivacy}>
            <Text style={styles.linkText}>隐私政策</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Page>
  );
};

export default VipPage;

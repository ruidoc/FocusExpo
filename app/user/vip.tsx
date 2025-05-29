import { CusPage } from '@/components';
import { vipStore } from '@/stores/vip';
import { fenToYuan } from '@/utils';
import { Flex } from '@fruits-chain/react-native-xiaoshu';
import { useTheme } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { observer, useLocalObservable } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// 产品类型定义
interface Product {
  id: string;
  name?: string;
  price: number;
  original_price: number;
  period?: number;
  product_id?: string;
  price_id?: string;
  is_subscription?: number;
}

const VipPage = observer(() => {
  const store = useLocalObservable(() => vipStore);
  const { colors, dark } = useTheme();
  const [isAgreed, setIsAgreed] = useState(false);

  useEffect(() => {
    // 加载产品列表
    store.getProducts();
  }, []);

  // 设计常量
  const THEME_COLOR = '#3DD073'; // 绿色主题色
  const DARK_BG = dark ? '#121212' : '#FAFAFA';
  const TEXT_LIGHT = '#FFFFFF';
  const TEXT_SECONDARY = '#999999';
  const CARD_BG = dark ? '#222222' : '#FFFFFF';

  const styles = StyleSheet.create({
    // 会员状态区域
    memberStatusCard: {
      backgroundColor: dark ? '#1A1A1A' : '#222222',
      borderRadius: 16,
      padding: 20,
      marginHorizontal: 15,
      marginTop: 15,
      marginBottom: 30,
      position: 'relative',
      overflow: 'hidden',
    },
    statusText: {
      color: THEME_COLOR,
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    validUntil: {
      color: '#AAAAAA',
      fontSize: 15,
      marginBottom: 6,
    },
    downloadLimit: {
      color: '#AAAAAA',
      fontSize: 15,
    },
    infoIcon: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 5,
    },
    musicIcons: {
      position: 'absolute',
      right: 20,
      bottom: 20,
    },

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
    privilegesTitle: {
      fontSize: 22,
      color: colors.text,
      marginBottom: 20,
      fontWeight: 'bold',
    },
    privilegesContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 30,
    },
    privilegeItem: {
      alignItems: 'center',
      width: '31%',
    },
    privilegeIcon: {
      width: 60,
      height: 60,
      borderRadius: 15,
      backgroundColor: dark ? '#333' : '#444',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
    },
    privilegeName: {
      fontSize: 16,
      color: colors.text,
      fontWeight: 'bold',
      marginBottom: 6,
    },
    privilegeDesc: {
      fontSize: 13,
      color: TEXT_SECONDARY,
      textAlign: 'center',
    },

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
  });

  // 处理价格显示，移除小数点后的0
  const formatPrice = (price: string): string => {
    return price.replace('.00', '');
  };

  return (
    <CusPage>
      {/* 1. 会员状态区域 */}
      <View style={styles.memberStatusCard}>
        <Text style={styles.statusText}>会员生效中</Text>
        <Text style={styles.validUntil}>
          有效期至2025/06/11(未开启自动续费)
        </Text>
        <Flex align="center">
          <Text style={styles.downloadLimit}>本期歌曲下载剩余数额300/300</Text>
          <View style={styles.infoIcon}>
            <Text style={{ color: TEXT_LIGHT, fontSize: 12 }}>i</Text>
          </View>
        </Flex>
        <View style={styles.musicIcons}>{/* 这里可以放置音符图标 */}</View>
      </View>

      {/* 2. 套餐选择区域 */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>选择套餐</Text>
        <View style={styles.plansContainer}>
          {store.products.map(product => {
            const isSelected = store.selectedProduct?.id === product.id;
            // 为不同套餐添加适当的标签
            let label = null;
            if (
              product.name?.includes('月') &&
              !product.name?.includes('3个月')
            ) {
              label = '仅0.26元/天';
            } else if (product.name?.includes('年') || product.price > 5000) {
              label = product.name?.includes('年')
                ? '单月最低'
                : '支持微信支付';
            }

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
                {label && (
                  <View style={styles.planLabel}>
                    <Text style={styles.planLabelText}>{label}</Text>
                  </View>
                )}
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

        {/* 续费说明 */}
        <Text style={styles.renewalText}>到期续费8元/月</Text>
      </View>

      {/* 3. 会员特权区域 */}
      <View style={styles.sectionContainer}>
        <Text style={styles.privilegesTitle}>会员特权</Text>
        <View style={styles.privilegesContainer}>
          <View style={styles.privilegeItem}>
            <View style={styles.privilegeIcon}>{/* 音乐图标占位 */}</View>
            <Text style={styles.privilegeName}>会员曲库</Text>
            <Text style={styles.privilegeDesc}>丰富会员曲库</Text>
          </View>

          <View style={styles.privilegeItem}>
            <View style={styles.privilegeIcon}>{/* 下载图标占位 */}</View>
            <Text style={styles.privilegeName}>下载特权</Text>
            <Text style={styles.privilegeDesc}>300首/月免费</Text>
          </View>

          <View style={styles.privilegeItem}>
            <View style={styles.privilegeIcon}>{/* 设备图标占位 */}</View>
            <Text style={styles.privilegeName}>多端通用</Text>
            <Text style={styles.privilegeDesc}>手机/电脑</Text>
          </View>
        </View>
      </View>

      {/* 4. 底部支付区域 */}
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
          <View style={styles.helpIcon}>
            <Text style={styles.helpText}>?</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.payButton, !isAgreed && { opacity: 0.7 }]}
          disabled={!isAgreed || !store.selectedProduct}
          onPress={() => store.recharge()}>
          <Text style={styles.payText}>立即续费</Text>
        </TouchableOpacity>
      </View>
    </CusPage>
  );
});

export default VipPage;

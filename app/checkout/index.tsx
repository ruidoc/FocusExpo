/**
 * Stripe 支付示例页面
 *
 * 这是一个展示如何使用 Stripe PaymentSheet 的示例页面。
 * 你可以参考这个示例将 Stripe 支付集成到你的业务流程中。
 *
 * 使用流程：
 * 1. 配置 StripeProvider 的 publishableKey
 * 2. 实现服务端 API 接口（创建 PaymentIntent）
 * 3. 调用 checkout 或 initializePayment + presentPayment
 */
import { Page } from '@/components/business';
import { Button, Flex, Toast } from '@/components/ui';
import { useStripePayment } from '@/utils/stripe';
import Icon from '@expo/vector-icons/Ionicons';
import { useTheme } from '@react-navigation/native';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

// 示例商品
const PRODUCTS = [
  {
    id: 'monthly_vip',
    name: '月度会员',
    price: 1800, // 单位：分（18.00 元）
    description: '解锁30天专业版功能',
  },
  {
    id: 'yearly_vip',
    name: '年度会员',
    price: 9800, // 单位：分（98.00 元）
    description: '解锁365天专业版功能，享8折优惠',
  },
  {
    id: 'lifetime_vip',
    name: '永久会员',
    price: 19800, // 单位：分（198.00 元）
    description: '一次购买，永久使用',
  },
];

const CheckoutPage = () => {
  const { colors, dark } = useTheme();
  const { checkout, loading } = useStripePayment();
  const [selectedProduct, setSelectedProduct] = useState(PRODUCTS[0]);
  const [paymentStatus, setPaymentStatus] = useState<
    'idle' | 'processing' | 'success' | 'failed'
  >('idle');

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: colors.text,
      opacity: 0.6,
      marginBottom: 24,
    },
    productCard: {
      backgroundColor: dark ? '#1C1C26' : '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    productCardSelected: {
      borderColor: colors.primary,
    },
    productName: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    productDescription: {
      fontSize: 14,
      color: colors.text,
      opacity: 0.6,
      marginBottom: 8,
    },
    productPrice: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.primary,
    },
    checkIcon: {
      position: 'absolute',
      top: 12,
      right: 12,
    },
    divider: {
      height: 1,
      backgroundColor: dark ? '#2C2C36' : '#E5E7EB',
      marginVertical: 24,
    },
    summaryTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    summaryLabel: {
      fontSize: 14,
      color: colors.text,
      opacity: 0.6,
    },
    summaryValue: {
      fontSize: 14,
      color: colors.text,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: dark ? '#2C2C36' : '#E5E7EB',
    },
    totalLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    totalValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.primary,
    },
    buttonContainer: {
      marginTop: 32,
    },
    statusContainer: {
      alignItems: 'center',
      marginTop: 20,
    },
    statusText: {
      fontSize: 14,
      color: colors.text,
      marginTop: 8,
    },
    noteText: {
      fontSize: 12,
      color: colors.text,
      opacity: 0.5,
      textAlign: 'center',
      marginTop: 16,
      lineHeight: 18,
    },
  });

  // 格式化价格（分 -> 元）
  const formatPrice = (priceInCents: number) => {
    return `¥${(priceInCents / 100).toFixed(2)}`;
  };

  // 处理支付
  const handleCheckout = async () => {
    setPaymentStatus('processing');

    try {
      const result = await checkout({
        amount: selectedProduct.price,
        currency: 'cny',
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        merchantDisplayName: 'FocusOne',
      });

      if (result.success) {
        setPaymentStatus('success');
        Toast({ message: '支付成功！感谢您的购买' });
        // TODO: 这里可以跳转到成功页面或更新用户 VIP 状态
      } else if (result.canceled) {
        setPaymentStatus('idle');
        // 用户取消，不做任何提示
      } else {
        setPaymentStatus('failed');
        // 错误已在 checkout 内部显示
      }
    } catch (error) {
      setPaymentStatus('failed');
      console.error('支付异常:', error);
    }
  };

  return (
    <Page>
      <View style={styles.container}>
        <Text style={styles.title}>选择会员方案</Text>
        <Text style={styles.subtitle}>
          选择适合您的方案，解锁专业版功能
        </Text>

        {/* 商品列表 */}
        {PRODUCTS.map(product => {
          const isSelected = selectedProduct.id === product.id;
          return (
            <Flex
              key={product.id}
              onPress={() => setSelectedProduct(product)}
              style={[
                styles.productCard,
                isSelected && styles.productCardSelected,
              ]}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productDescription}>
                {product.description}
              </Text>
              <Text style={styles.productPrice}>
                {formatPrice(product.price)}
              </Text>
              {isSelected && (
                <View style={styles.checkIcon}>
                  <Icon
                    name="checkmark-circle"
                    size={24}
                    color={colors.primary}
                  />
                </View>
              )}
            </Flex>
          );
        })}

        <View style={styles.divider} />

        {/* 订单摘要 */}
        <Text style={styles.summaryTitle}>订单摘要</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>商品</Text>
          <Text style={styles.summaryValue}>{selectedProduct.name}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>数量</Text>
          <Text style={styles.summaryValue}>1</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>合计</Text>
          <Text style={styles.totalValue}>
            {formatPrice(selectedProduct.price)}
          </Text>
        </View>

        {/* 支付按钮 */}
        <View style={styles.buttonContainer}>
          <Button
            type="primary"
            size="xl"
            onPress={handleCheckout}
            loading={loading || paymentStatus === 'processing'}
            disabled={loading || paymentStatus === 'processing'}>
            {loading
              ? '准备中...'
              : paymentStatus === 'processing'
                ? '处理中...'
                : `支付 ${formatPrice(selectedProduct.price)}`}
          </Button>
        </View>

        {/* 支付状态 */}
        {paymentStatus === 'processing' && (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.statusText}>正在处理支付请求...</Text>
          </View>
        )}

        {paymentStatus === 'success' && (
          <View style={styles.statusContainer}>
            <Icon name="checkmark-circle" size={32} color="#22C55E" />
            <Text style={styles.statusText}>支付成功！</Text>
          </View>
        )}

        {/* 说明文字 */}
        <Text style={styles.noteText}>
          支付由 Stripe 安全处理{'\n'}
          支持信用卡、借记卡、Apple Pay 等多种支付方式
        </Text>
      </View>
    </Page>
  );
};

export default CheckoutPage;

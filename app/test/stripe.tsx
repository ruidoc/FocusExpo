/**
 * Stripe 订阅测试页面
 *
 * 用于测试 Stripe Subscription 订阅支付流程（WebView 方式）
 */
import { Page, StripeWebView } from '@/components/business';
import { Button, Flex } from '@/components/ui';
import request from '@/utils/request';
import { useStripePayment } from '@/utils/stripe';
import Icon from '@expo/vector-icons/Ionicons';
import { useTheme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';

// 产品类型
interface Product {
  id: string;
  name: string;
  period: number;
  product_id: string;
  price_id: string;
  price: number;
  original_price: number;
  is_subscription: 0 | 1;
}

// 测试卡号信息
const TEST_CARDS = [
  { number: '4242 4242 4242 4242', desc: '成功支付' },
  { number: '4000 0000 0000 3220', desc: '需要 3D Secure' },
  { number: '4000 0000 0000 9995', desc: '余额不足' },
];

type PaymentLog = {
  time: string;
  type: 'info' | 'success' | 'error';
  message: string;
};

const StripeTestPage = () => {
  const { colors, dark } = useTheme();
  const { subscribe, loading, visible, checkoutUrl, handleClose } =
    useStripePayment();

  // 状态
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logs, setLogs] = useState<PaymentLog[]>([]);

  // 添加日志
  const addLog = (type: PaymentLog['type'], message: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [{ time, type, message }, ...prev.slice(0, 19)]);
  };

  // 格式化金额（分 -> 元）
  const formatPrice = (cents: number) => `¥${(cents / 100).toFixed(2)}`;

  // 格式化周期
  const formatPeriod = (period: number) => {
    if (period === 1) return '月';
    if (period === 12) return '年';
    return `${period}个月`;
  };

  // 获取产品列表
  const fetchProducts = async () => {
    try {
      const response = await request.get<{ data: Product[] }>('/product/list', {
        params: {
          product_class: 'focus_stripe',
          is_subscription: '1',
        },
      });
      const productList = (response as any).data || [];
      setProducts(productList);
      if (productList.length > 0 && !selectedProduct) {
        setSelectedProduct(productList[0]);
      }
      addLog('info', `获取到 ${productList.length} 个订阅产品`);
    } catch (error) {
      console.error('获取产品列表失败:', error);
      addLog('error', '获取产品列表失败');
    } finally {
      setLoadingProducts(false);
      setRefreshing(false);
    }
  };

  // 初始化加载产品
  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 下拉刷新
  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  // 订阅支付
  const handleSubscribe = async () => {
    if (!selectedProduct) {
      addLog('error', '请先选择订阅产品');
      return;
    }

    addLog(
      'info',
      `开始订阅: ${selectedProduct.name} (${formatPrice(selectedProduct.price)}/${formatPeriod(selectedProduct.period)})`,
    );

    const success = await subscribe(
      {
        priceId: selectedProduct.price_id,
        productId: selectedProduct.product_id,
        productName: selectedProduct.name,
        period: selectedProduct.period,
      },
      result => {
        // 支付完成回调
        if (result.success) {
          addLog('success', '订阅成功！');
        } else if (result.canceled) {
          addLog('info', '用户取消订阅');
        } else {
          addLog('error', `订阅失败: ${result.error || '未知错误'}`);
        }
      },
    );

    if (!success) {
      addLog('error', '创建订阅会话失败');
    }
  };

  // 清空日志
  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <Page>
      <Stack.Screen options={{ title: 'Stripe 订阅测试' }} />
      <ScrollView
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {/* 产品列表 */}
        <View className="mt-4 mb-4">
          <Flex className="flex-row justify-between items-center mb-3">
            <Text
              className="text-base font-semibold"
              style={{ color: colors.text }}>
              选择订阅产品
            </Text>
            {loadingProducts && <ActivityIndicator size="small" />}
          </Flex>

          {products.length === 0 && !loadingProducts ? (
            <View
              className={`p-4 rounded-lg ${dark ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <Text
                className="text-center opacity-60"
                style={{ color: colors.text }}>
                暂无订阅产品，请确保数据库中有 product_class = focus_stripe
                的产品
              </Text>
            </View>
          ) : (
            products.map(product => {
              const isSelected = selectedProduct?.id === product.id;
              const hasDiscount = product.original_price > product.price;

              return (
                <Flex
                  key={product.id}
                  onPress={() => {
                    setSelectedProduct(product);
                    addLog('info', `选择产品: ${product.name}`);
                  }}
                  className={`mb-3 p-4 rounded-xl border ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : dark
                        ? 'border-gray-700 bg-gray-800/50'
                        : 'border-gray-200 bg-white'
                  }`}>
                  <Flex className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Flex className="flex-row items-center gap-2">
                        <Text
                          className="text-lg font-semibold"
                          style={{ color: colors.text }}>
                          {product.name}
                        </Text>
                        {hasDiscount && (
                          <View className="bg-red-500 px-2 py-0.5 rounded">
                            <Text className="text-xs text-white font-medium">
                              优惠
                            </Text>
                          </View>
                        )}
                      </Flex>
                      <Text
                        className="text-sm mt-1 opacity-60"
                        style={{ color: colors.text }}>
                        {formatPeriod(product.period)}订阅 · 自动续费
                      </Text>
                      <Flex className="flex-row items-baseline mt-2 gap-2">
                        <Text className="text-xl font-bold text-primary">
                          {formatPrice(product.price)}
                        </Text>
                        {hasDiscount && (
                          <Text className="text-sm text-gray-400 line-through">
                            {formatPrice(product.original_price)}
                          </Text>
                        )}
                        <Text
                          className="text-xs opacity-50"
                          style={{ color: colors.text }}>
                          /{formatPeriod(product.period)}
                        </Text>
                      </Flex>
                    </View>
                    {isSelected && (
                      <Icon
                        name="checkmark-circle"
                        size={24}
                        color={colors.primary}
                      />
                    )}
                  </Flex>
                </Flex>
              );
            })
          )}
        </View>

        {/* 订阅按钮 */}
        <View className="mb-4">
          <Button
            type="primary"
            size="l"
            onPress={handleSubscribe}
            loading={loading}
            disabled={loading || !selectedProduct}>
            {loading
              ? '处理中...'
              : selectedProduct
                ? `订阅 ${selectedProduct.name} - ${formatPrice(selectedProduct.price)}/${formatPeriod(selectedProduct.period)}`
                : '请选择订阅产品'}
          </Button>
        </View>

        {/* 测试卡号 */}
        <View className="mb-4">
          <Text
            className="text-base font-semibold mb-3"
            style={{ color: colors.text }}>
            测试卡号
          </Text>
          <View
            className={`p-3 rounded-lg ${dark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            {TEST_CARDS.map((card, index) => (
              <Flex
                key={index}
                className="flex-row justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                <Text
                  className="font-mono text-sm"
                  style={{ color: colors.text }}>
                  {card.number}
                </Text>
                <Text className="text-xs text-gray-500">{card.desc}</Text>
              </Flex>
            ))}
            <Text
              className="text-xs mt-2 opacity-50"
              style={{ color: colors.text }}>
              有效期：任意未来日期 | CVC：任意3位数
            </Text>
          </View>
        </View>

        {/* 日志区域 */}
        <View className="mb-6">
          <Flex className="flex-row justify-between items-center mb-3">
            <Text
              className="text-base font-semibold"
              style={{ color: colors.text }}>
              操作日志
            </Text>
            <Flex onPress={clearLogs}>
              <Text className="text-sm text-primary">清空</Text>
            </Flex>
          </Flex>

          <View
            className={`p-3 rounded-lg min-h-[150px] ${dark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            {logs.length === 0 ? (
              <Text
                className="text-sm opacity-50 text-center py-4"
                style={{ color: colors.text }}>
                暂无日志，请进行订阅操作
              </Text>
            ) : (
              logs.map((log, index) => (
                <Flex key={index} className="flex-row py-1">
                  <Text className="text-xs text-gray-500 w-20">{log.time}</Text>
                  <Icon
                    name={
                      log.type === 'success'
                        ? 'checkmark-circle'
                        : log.type === 'error'
                          ? 'close-circle'
                          : 'information-circle'
                    }
                    size={14}
                    color={
                      log.type === 'success'
                        ? '#22C55E'
                        : log.type === 'error'
                          ? '#EF4444'
                          : '#3B82F6'
                    }
                  />
                  <Text
                    className={`text-xs ml-1 flex-1 ${
                      log.type === 'success'
                        ? 'text-green-500'
                        : log.type === 'error'
                          ? 'text-red-500'
                          : 'text-blue-500'
                    }`}>
                    {log.message}
                  </Text>
                </Flex>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Stripe WebView 弹窗 */}
      <StripeWebView
        visible={visible}
        checkoutUrl={checkoutUrl}
        onClose={handleClose}
      />
    </Page>
  );
};

export default StripeTestPage;

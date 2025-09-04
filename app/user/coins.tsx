import { CusPage } from '@/components';
import { Toast } from '@fruits-chain/react-native-xiaoshu';
import { ErrorCode, useIAP } from 'expo-iap';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// 请将以下 SKU 替换为你在 App Store Connect 配置的实际消耗型产品 ID
const consumableSkus = ['com.focusone.coins_10', 'com.focusone.coins_30'];

export default function UserCoinsPage() {
  const [loading, setLoading] = React.useState<boolean>(false);
  const {
    connected,
    products,
    requestProducts,
    requestPurchase,
    validateReceipt,
  } = useIAP({
    onPurchaseSuccess: async purchase => {
      try {
        const result = await validateReceipt(purchase.transactionId);
        if (result?.isValid) {
          Toast({ message: '购买成功（本地校验通过）' });
          // TODO: 在生产环境将 purchase.transactionId/receipt 发到服务端二次校验并发放金币
        } else {
          Toast({ message: '购买成功但校验失败，请稍后重试' });
        }
      } catch {
        Toast({ message: '校验失败，请稍后重试' });
      }
    },
    onPurchaseError: error => {
      if (error?.code === ErrorCode.E_USER_CANCELLED) return;
      Alert.alert('购买失败', error?.message ?? '未知错误');
    },
    onSyncError: error => {
      console.warn('应用商店同步错误:', error.message);
    },
  });

  React.useEffect(() => {
    if (!connected) return;
    setLoading(true);
    requestProducts({ skus: consumableSkus, type: 'inapp' })
      .catch(() => {
        Toast({ message: '商品获取失败，请检查产品配置与网络' });
      })
      .finally(() => setLoading(false));
  }, [connected, requestProducts]);

  const onBuy = async (sku: string) => {
    try {
      await requestPurchase({ request: { ios: { sku } }, type: 'inapp' });
    } catch (err: any) {
      if (err?.code !== ErrorCode.E_USER_CANCELLED) {
        Toast({ message: '下单失败，请稍后重试' });
      }
    }
  };

  return (
    <CusPage>
      {!connected && (
        <View style={{ alignItems: 'center', marginTop: 24 }}>
          <Text style={{ color: '#fff' }}>正在连接 App Store…</Text>
        </View>
      )}
      {connected && (
        <ScrollView contentContainerStyle={{ paddingVertical: 12 }}>
          {loading && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 12,
              }}>
              <ActivityIndicator />
              <Text style={{ marginLeft: 8, color: '#fff' }}>加载中…</Text>
            </View>
          )}
          {products.map(p => (
            <View
              key={p.id}
              style={{
                padding: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#e5e5e5',
                marginBottom: 12,
                backgroundColor: '#fff',
              }}>
              <Text style={{ fontSize: 16, fontWeight: '500' }}>{p.title}</Text>
              <Text style={{ color: '#666', marginTop: 4 }}>
                {p.description}
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: 12,
                }}>
                <Text style={{ fontSize: 16 }}>{p.displayPrice}</Text>
                <TouchableOpacity
                  onPress={() => onBuy(p.id)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    backgroundColor: '#3b82f6',
                    borderRadius: 8,
                  }}>
                  <Text style={{ color: '#fff' }}>购买</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          {!loading && products.length === 0 && (
            <View style={{ alignItems: 'center', marginTop: 24 }}>
              <Text style={{ color: '#fff' }}>
                未获取到商品，请检查产品 ID 与配置
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </CusPage>
  );
}

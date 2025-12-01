import http from '@/utils/request';
import { registerApp, requestPayment } from 'expo-native-wechat';
import { create } from 'zustand';
import { combine } from 'zustand/middleware';

interface Product {
  id: string;
  name: string;
  period: number;
  product_id: string;
  price_id: string;
  price: number;
  original_price: number;
  is_subscription: number;
}

const VipStore = combine(
  {
    balance: 0 as number,
    selectedProduct: null as Product | null, // 当前选中的商品
    products: [] as Product[],
  },
  (set, get) => ({
    setSelectedProduct: (product: Product | null) => {
      set({ selectedProduct: product });
    },

    setBalance: (balance: number) => {
      set({ balance });
    },

    getProducts: async () => {
      try {
        const res: HttpRes = await http.get('/product/list', {
          params: {
            platform: 'iOS',
            is_subscription: 0,
          },
        });
        if (res.statusCode === 200) {
          set({ products: res.data });
        }
      } catch (error) {
        console.log('获取商品列表失败：', error);
      }
    },

    recharge: async () => {
      try {
        const { price, name } = get().selectedProduct || {};
        const res = await http.post('/payment/wechat-pay', {
          amount: price,
          description: name,
        });
        console.log('支付接口结果', res);
        await registerApp({
          appid: 'wxdc022c6a39cb32b7',
          log: true,
          universalLink: 'https://focusone.ruidoc.cn/iosapp/',
        });
        // const ready = await checkUniversalLinkReady();
        // console.log('微信支付准备结果', ready);
        const result = await requestPayment(res.data);
        console.log('支付结果：', result);
      } catch (error) {
        console.log('支付错误：', error);
      }
    },
  }),
);

const store = create(VipStore);

export default store;

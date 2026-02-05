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

interface Subscription {
  id: string;
  order_id: string | null;
  user_id: string;
  subscription_id: string; // 外部订阅ID（Stripe: sub_xxx / Apple: original_transaction_id）
  product_id: string;
  period: number; // 订阅周期（月）
  price: number; // 价格（分）
  status: number; // 0进行中、1已取消、2已到期
  is_trial: number; // 0否、1是
  source: string; // 订阅来源（app_store/stripe/play_store）
  started_at: string; // 订阅开始时间
  expires_at: string; // 订阅到期时间
  trial_ends_at: string | null; // 试用期结束时间
  canceled_at: string | null; // 取消时间
}

const SubscriptionStore = combine(
  {
    balance: 0 as number,
    selectedProduct: null as Product | null, // 当前选中的商品
    products: [] as Product[],
    subscription: null as Subscription | null, // 当前有效订阅
    isSubscribed: false, // 是否已订阅（便捷属性）
  },
  (set, get) => ({
    setSelectedProduct: (product: Product | null) => {
      set({ selectedProduct: product });
    },

    setBalance: (balance: number) => {
      set({ balance });
    },

    // 获取当前用户的有效订阅
    getSubscription: async () => {
      try {
        const res: HttpRes = await http.get('/subscription');
        if (res.statusCode === 200) {
          const subscription = res.data as Subscription | null;
          set({
            subscription,
            isSubscribed: !!subscription && subscription.status === 0,
          });
          console.log('[SubscriptionStore] 订阅状态:', subscription ? '已订阅' : '未订阅');
        }
      } catch (error) {
        console.log('[SubscriptionStore] 获取订阅信息失败：', error);
        // 失败时不阻断其他流程，保持默认值
      }
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

    // 清除订阅状态（退出登录时调用）
    clearSubscription: () => {
      set({ subscription: null, isSubscribed: false });
    },
  }),
);

const store = create(SubscriptionStore);

export default store;

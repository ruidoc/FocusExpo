import http from '@/request';
// import { registerApp, requestPayment } from 'expo-native-wechat';
import { makeAutoObservable } from 'mobx';

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

export class VipStore {
  constructor() {
    makeAutoObservable(this);
  }

  balance: number = 0;
  // 当前选中的商品
  selectedProduct: Product | null = null;

  products: Product[] = [];

  setSelectedProduct(product: Product | null) {
    this.selectedProduct = product;
  }

  setBalance(balance: number) {
    this.balance = balance;
  }

  async getProducts() {
    try {
      const res: HttpRes = await http.get('/product/list');
      if (res.statusCode === 200) {
        this.products = res.data;
      }
    } catch (error) {
      console.log('获取商品列表失败：', error);
    }
  }

  async recharge() {
    try {
      const { price, name } = this.selectedProduct || {};
      const res = await http.post('/payment/wechat-pay', {
        amount: price,
        description: name,
      });
      // registerApp({ appid: 'wxdc022c6a39cb32b7' });
      // const result = await requestPayment(res.data);
      console.log('支付结果：', res);
    } catch (error) {
      console.log('支付错误：', error);
    }
  }
}

export const vipStore = new VipStore();

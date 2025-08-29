import http from '@/request';
import { makeAutoObservable } from 'mobx';

export class BenefitStore {
  constructor() {
    makeAutoObservable(this);
  }

  // 自律币余额
  balance: number = 0;

  // 当前段位
  rank: string = '';

  // 可专注时长（分钟）
  focus_duration: number = 0;

  // 可限制的应用数量
  app_count: number = 0;

  // 可限制的分类数量（IOS）
  category_count: number;

  setBalance(balance: number) {
    this.balance = balance;
  }

  // 扣除自律币
  subBalance(balance: number = 1) {
    this.balance -= balance;
  }

  async getBenefit() {
    try {
      const res: HttpRes = await http.get('/benefit');
      if (res.statusCode === 200) {
        let { balance, rank, focus_duration, app_count, category_count } =
          res.data;
        // console.log('获取权益', res.data);
        this.setBalance(balance);
        this.rank = rank;
        this.focus_duration = focus_duration;
        this.app_count = app_count;
        this.category_count = category_count;
      }
    } catch (error) {
      console.log('获取权益失败：', error);
    }
  }
}

const store = new BenefitStore();

export default store;

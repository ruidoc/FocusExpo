import http from '@/utils/request';
import { create } from 'zustand';
import { combine } from 'zustand/middleware';

const BenefitStore = combine(
  {
    balance: 0 as number, // 自律币余额
    rank: '' as string, // 当前段位
    focus_duration: 0 as number, // 可专注时长（分钟）
    app_count: 1 as number, // 可限制的应用数量
    category_count: undefined as number | undefined, // 可限制的分类数量（IOS）
  },
  (set, get) => ({
    setBalance: (balance: number) => {
      set({ balance });
    },

    // 扣除自律币
    subBalance: (balance: number = 1) => {
      set({ balance: get().balance - balance });
    },

    getBenefit: async () => {
      try {
        const res: HttpRes = await http.get('/benefit');
        if (res.statusCode === 200) {
          let { balance, rank, focus_duration, app_count, category_count } =
            res.data;
          // console.log('获取权益', res.data);
          set({
            balance,
            rank,
            focus_duration,
            app_count,
            category_count,
          });
        }
      } catch (error) {
        console.log('获取权益失败：', error);
      }
    },
  }),
);

const store = create(BenefitStore);

export default store;

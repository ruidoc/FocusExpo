import { storage } from '@/utils';
import http from '@/utils/request';
import { create } from 'zustand';
import { combine } from 'zustand/middleware';

// 格式化日期为 YYYY-MM-DD
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const BenefitStore = combine(
  {
    balance: 0 as number, // 自律币余额
    rank: '' as string, // 当前段位
    day_duration: 0 as number, // 基础每日时长配额（分钟）
    app_count: 1 as number, // 可限制的应用数量
    category_count: undefined as number | undefined, // 可限制的分类数量（IOS）
    is_subscribed: false as boolean, // 是否已订阅
    today_used: 0 as number, // 今日已使用时长（分钟）
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
          let {
            balance,
            rank,
            day_duration,
            app_count,
            category_count,
            is_subscribed,
            today_used,
          } = res.data;
          // console.log('获取权益', res.data);
          set({
            balance,
            rank,
            day_duration,
            app_count,
            category_count,
            is_subscribed: !!is_subscribed,
            today_used: today_used || 0,
          });

          // 写入 App Groups，供 Extension 读取
          // 数字直接存字符串，Swift 用 integer(forKey:) 可自动转换
          storage.setGroup('is_subscribed', is_subscribed ? 'true' : 'false');
          storage.setGroup('app_count', String(app_count || 5));
          storage.setGroup('category_count', String(category_count || 0));
          storage.setGroup('day_duration', String(day_duration || 60));
          storage.setGroup('today_used', String(today_used || 0));
          storage.setGroup('today_date', formatDate(new Date()));
        }
      } catch (error) {
        console.log('获取权益失败：', error);
      }
    },

    // 更新今日已使用时长（本地）
    addTodayUsed: (minutes: number) => {
      const newUsed = get().today_used + minutes;
      set({ today_used: newUsed });
      storage.setGroup('today_used', String(newUsed));
    },
  }),
);

const store = create(BenefitStore);

export default store;

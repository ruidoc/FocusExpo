import http from '@/utils/request';
import { create } from 'zustand';
import { combine } from 'zustand/middleware';

export type Period = 'today' | 'week' | 'month';

export interface AppStatisItem {
  app: string;
  blocked_mins: number; // 设置的总屏蔽时长
  actual_mins: number; // 实际屏蔽时长
  task_count: number; // 任务数
  success_count: number; // 成功数
  success_rate: number; // 成功率 0-100
}

export interface AppStatisResp {
  period: Period | string;
  start_at: string; // ISO
  end_at: string; // ISO
  total_blocked_mins: number;
  total_actual_mins: number;
  total_success_rate: number;
  items: AppStatisItem[];
}

const StatisticStore = combine(
  {
    app_statis: null as AppStatisResp | null,
  },
  (set, get) => ({
    setAppStatis: (statis: AppStatisResp) => {
      set({ app_statis: statis });
    },

    fetchAppStatis: async (period: Period = 'today') => {
      try {
        let res: HttpRes = await http.get('/record/statis/apps', {
          params: { period },
        });
        if (res.statusCode === 200) {
          (get() as any).setAppStatis(res.data);
        }
      } catch (error) {
        console.log(error);
      }
    },
  }),
);

const store = create(StatisticStore);

export default store;

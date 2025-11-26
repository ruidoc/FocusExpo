import http from '@/utils/request';
import { makeAutoObservable } from 'mobx';

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

class StatisticStore {
  constructor() {
    makeAutoObservable(this);
  }

  app_statis: AppStatisResp = null;

  setAppStatis = (statis: AppStatisResp) => {
    this.app_statis = statis;
  };

  fetchAppStatis = async (period: Period = 'today') => {
    try {
      let res: HttpRes = await http.get('/record/statis/apps', {
        params: { period },
      });
      if (res.statusCode === 200) {
        this.setAppStatis(res.data);
      }
    } catch (error) {
      console.log(error);
    }
  };
}

const store = new StatisticStore();

export default store;

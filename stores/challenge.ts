import http from '@/request';
import { makeAutoObservable } from 'mobx';

export type Challenge = {
  id: string;
  title: string;
  description?: string;
  difficulty: 'easy' | 'normal' | 'hard';
  starts_at: string; // ISO
  ends_at: string; // ISO
  is_active: boolean;
  entry_coins: number;
  reward_apps: number; // 奖励可选 App 数
  reward_duration: number; // 奖励可专注时长（分钟）
  reward_unlimited: number; // 奖励会员天数（当前后端未发放）
  required_apps?: string[]; // bundleId[]
  goal_total_mins: number;
  goal_once_mins: number;
  goal_repeat_times: number;
  goal_repeat_days: number;
  created_at: string;
  updated_at: string;
};

export type UserChallenge = {
  id: string;
  user_id: string;
  challenge_id: string;
  challenge?: Challenge; // 关联
  status:
    | 'claimed'
    | 'in_progress'
    | 'succeeded'
    | 'failed'
    | 'cancelled'
    | 'expired';
  started_at?: string;
  plan_ids: string[];
  deadline_at: string;
  finished_at?: string;
  progress_percent: string; // '0.00' ~ '100.00'
  entry_coins: number;
  result_reason: string;
  created_at: string;
  updated_at: string;
};

class ChallengeStore {
  constructor() {
    makeAutoObservable(this);
  }

  // 所有挑战列表
  challenges: Challenge[] = [];
  // 我的挑战列表
  my_challenges: UserChallenge[] = [];

  setChallenges = (challenges: Challenge[]) => {
    this.challenges = challenges;
  };

  fetchChallenges = async () => {
    try {
      let res: HttpRes = await http.get('/record/statis/apps', {});
      if (res.statusCode === 200) {
        this.setChallenges(res.data);
      }
    } catch (error) {
      console.log(error);
    }
  };
}

const store = new ChallengeStore();

export default store;

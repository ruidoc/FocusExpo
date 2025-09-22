import http from '@/utils/request';
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

  setMyChallenges = (challenges: UserChallenge[]) => {
    this.my_challenges = challenges;
  };

  // 获取挑战列表
  fetchChallenges = async (is_active?: boolean, ongoing?: boolean) => {
    try {
      const params: any = {};
      if (is_active !== undefined) params.is_active = is_active ? 1 : 0;
      if (ongoing !== undefined) params.ongoing = ongoing ? 1 : 0;

      const res: HttpRes = await http.get('/challenge/list', params);
      if (res.statusCode === 200) {
        this.setChallenges(res.data);
      }
      return res;
    } catch (error) {
      console.log('fetchChallenges error:', error);
      throw error;
    }
  };

  // 获取单个挑战详情
  fetchChallengeById = async (id: string): Promise<Challenge | null> => {
    try {
      const res: HttpRes = await http.get(`/challenge/${id}`);
      if (res.statusCode === 200) {
        return res.data;
      }
      return null;
    } catch (error) {
      console.log('fetchChallengeById error:', error);
      throw error;
    }
  };

  // 领取挑战
  claimChallenge = async (
    id: string,
    plan_ids: string[],
  ): Promise<UserChallenge | null> => {
    try {
      const res: HttpRes = await http.post(`/challenge/claim/${id}`, {
        plan_ids,
      });
      if (res.statusCode === 200) {
        // 更新我的挑战列表
        const existingIndex = this.my_challenges.findIndex(
          uc => uc.challenge_id === id && uc.status === 'in_progress',
        );
        if (existingIndex >= 0) {
          this.my_challenges[existingIndex] = res.data;
        } else {
          this.my_challenges.unshift(res.data);
        }
        return res.data;
      }
      return null;
    } catch (error) {
      console.log('claimChallenge error:', error);
      throw error;
    }
  };

  // 更新挑战进度
  updateChallengeProgress = async (
    userChallengeId: string,
    percent: number,
  ): Promise<UserChallenge | null> => {
    try {
      const res: HttpRes = await http.put(
        `/challenge/progress/${userChallengeId}`,
        {
          percent,
        },
      );
      if (res.statusCode === 200) {
        // 更新本地数据
        const index = this.my_challenges.findIndex(
          uc => uc.id === userChallengeId,
        );
        if (index >= 0) {
          this.my_challenges[index] = res.data;
        }
        return res.data;
      }
      return null;
    } catch (error) {
      console.log('updateChallengeProgress error:', error);
      throw error;
    }
  };

  // 完成挑战
  finishChallenge = async (
    userChallengeId: string,
    status: 'succeeded' | 'failed' | 'cancelled',
    reason?: string,
  ): Promise<UserChallenge | null> => {
    try {
      const res: HttpRes = await http.put(
        `/challenge/finish/${userChallengeId}`,
        {
          status,
          reason,
        },
      );
      if (res.statusCode === 200) {
        // 更新本地数据
        const index = this.my_challenges.findIndex(
          uc => uc.id === userChallengeId,
        );
        if (index >= 0) {
          this.my_challenges[index] = res.data;
        }
        return res.data;
      }
      return null;
    } catch (error) {
      console.log('finishChallenge error:', error);
      throw error;
    }
  };

  // 获取用户挑战列表
  fetchUserChallenges = async (status?: string) => {
    try {
      const params: any = {};
      if (status) params.status = status;

      const res: HttpRes = await http.get('/challenge/user/list', params);
      if (res.statusCode === 200) {
        this.setMyChallenges(res.data);
      }
      return res;
    } catch (error) {
      console.log('fetchUserChallenges error:', error);
      throw error;
    }
  };

  // 便捷方法：获取进行中的用户挑战
  fetchInProgressChallenges = async () => {
    return this.fetchUserChallenges('in_progress');
  };

  // 便捷方法：获取活跃的挑战列表
  fetchActiveChallenges = async () => {
    return this.fetchChallenges(true, true);
  };
}

const store = new ChallengeStore();

export default store;

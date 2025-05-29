import { makeAutoObservable } from 'mobx';
import http from '@/request';
import { Toast } from '@fruits-chain/react-native-xiaoshu';
import { NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentMinute } from '@/utils';

const { NativeClass } = NativeModules;
class PlanStore {
  constructor() {
    makeAutoObservable(this);
  }

  cus_plans: CusPlan[] = []; // 任务列表
  once_plans: CusPlan[] = []; // 一次性任务列表
  cur_plan: CusPlan = null; // 当前任务
  next_plan: CusPlan = null; // 下一个

  // 当前任务已运行时长，退出重进后重新计时
  curplan_minute: number = 0;

  get is_focus_mode() {
    return this.cur_plan && this.cur_plan.mode === 'focus';
  }
  get all_plans() {
    return [...this.cus_plans, ...this.once_plans];
  }

  setCusPlans = (plans: any[]) => {
    this.cus_plans = plans;
    AsyncStorage.setItem('cus_plans', JSON.stringify(plans));
  };

  setOncePlans = (plans: any[]) => {
    this.once_plans = plans;
    AsyncStorage.setItem('once_plans', JSON.stringify(plans));
  };

  setCurPlanMinute = (minute: number) => {
    this.curplan_minute = minute;
  };

  // 更新计划列表
  updatePlans = () => {
    let plan_arrs = this.all_plans.map(plan => ({
      id: plan.id,
      start: plan.repeat === 'once' ? plan.start_sec : plan.start_min * 60,
      end: plan.repeat === 'once' ? plan.end_sec : plan.end_min * 60,
      duration: plan.end_min - plan.start_min,
      repeat: plan.repeat,
      mode: plan.mode,
    }));
    NativeClass.setTimerange(JSON.stringify(plan_arrs));
  };

  // 重新获取当前任务
  resetPlan = () => {
    // 获取当前时间的分钟数（当天从0点开始的总分钟数）
    let minutes = getCurrentMinute();
    // start_min 和 end_min 存储的是一天中的分钟数，例如 8:30 对应 510 分钟（8*60+30）
    // 这里查找当前时间分钟数在任务的开始和结束分钟数之间的计划
    this.cur_plan = this.all_plans.find(
      it => minutes >= it.start_min && minutes < it.end_min,
    );
    this.next_plan = this.all_plans.find(it => minutes < it.start_min);
    let once = this.once_plans.find(it => minutes >= it.end_min);
    if (once) {
      this.rmOncePlan(once.id);
    }
  };

  addPlan = async (
    form: Record<string, string>,
    fun: (data?: HttpRes) => void,
  ) => {
    try {
      let res: HttpRes = await http.post('/plan/add', form);
      if (res.statusCode === 200) {
        fun(res);
        this.getPlans();
      } else {
        Toast(res.message);
        fun();
      }
    } catch (error) {
      console.log(error);
      fun();
    }
  };

  getPlans = async (fun?: (data?: HttpRes) => void) => {
    try {
      let res: HttpRes = await http.get('/plan/lists');
      if (res.statusCode === 200) {
        this.setCusPlans(res.data);
        this.updatePlans();
        if (!this.cur_plan) {
          this.resetPlan();
        }
        if (fun) fun(res);
      }
    } catch (error) {
      console.log(error);
    }
  };

  removePlan = async (id: string, fun?: (data?: HttpRes) => void) => {
    try {
      let res: HttpRes = await http.delete('/plan/remove/' + id);
      if (res.statusCode === 200) {
        if (fun) fun(res);
        this.getPlans();
      }
    } catch (error) {
      console.log(error);
    }
  };
  clearPlans = () => {
    this.once_plans = [];
    this.cus_plans = [];
    this.updatePlans();
  };
  addOncePlan = (form: CusPlan) => {
    this.once_plans.push(form);
    console.log('【添加一次性任务】', form);
    AsyncStorage.setItem('once_plans', JSON.stringify(this.once_plans));
    this.updatePlans();
  };
  rmOncePlan = (id: string) => {
    let index = this.once_plans.findIndex(r => r.id === id);
    if (index > -1) {
      this.once_plans.splice(index, 1);
    }
    this.updatePlans();
  };
}

const store = new PlanStore();

export default store;

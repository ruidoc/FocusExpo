import { getCurrentMinute, parseRepeat, storage } from '@/utils';
import http from '@/utils/request';
import { Toast } from '@fruits-chain/react-native-xiaoshu';
import { makeAutoObservable } from 'mobx';
import { NativeModules } from 'react-native';
import { BenefitStore, RecordStore } from '.';

const { NativeModule } = NativeModules;
class PlanStore {
  constructor() {
    makeAutoObservable(this);
  }

  cus_plans: CusPlan[] = []; // 任务列表
  once_plans: CusPlan[] = []; // 一次性任务列表
  cur_plan: CusPlan = null; // 当前任务
  next_plan: CusPlan = null; // 下一个
  paused: boolean = false; // 是否处于暂停中（iOS）

  // 当前任务已运行时长，退出重进后重新计时
  curplan_minute: number = 0;

  get is_focus_mode() {
    return this.cur_plan && this.cur_plan.mode === 'focus';
  }
  get all_plans() {
    return [...this.cus_plans, ...this.once_plans];
  }

  setCusPlans = (plans: any[]) => {
    let final_plans = plans.map(r => ({
      ...r,
      repeat: parseRepeat(r.repeat),
    }));
    this.cus_plans = final_plans;
    storage.set('cus_plans', JSON.stringify(plans));
  };

  setOncePlans = (plans: any[]) => {
    this.once_plans = plans;
    storage.set('once_plans', JSON.stringify(plans));
  };

  setCurPlanMinute = (minute: number) => {
    this.curplan_minute = minute;
  };
  setPaused = (v: boolean) => {
    this.paused = v;
  };

  // 设置当前任务的暂停状态，并同步到列表中
  setCurrentPlanPause = async (paused: boolean) => {
    let record_id = RecordStore.record_id;
    if (paused && record_id) {
      BenefitStore.subBalance();
      await RecordStore.pauseRecord(record_id);
    }
    this.cur_plan.is_pause = paused;
    this.setPaused(paused);
  };

  // 专注计划完成
  complatePlan = async () => {
    console.log('【专注计划完成】');
    // let record_id = RecordStore.record_id;
    // if (record_id) {
    //   await RecordStore.completeRecord(record_id);
    // }
    RecordStore.removeRecordId();
    this.setCurrentPlanPause(false);
    this.setCurPlanMinute(0);
    this.resetPlan();
  };

  // 专注计划终止
  exitPlan = async () => {
    let record_id = RecordStore.record_id;
    if (record_id) {
      await RecordStore.exitRecord(record_id);
    }
    RecordStore.removeRecordId();
    this.setCurrentPlanPause(false);
    this.setCurPlanMinute(0);
    this.resetPlan();
  };

  // 更新计划列表（Android原生占位，iOS不同步）
  updatePlans = () => {
    let plan_arrs = this.all_plans.map(plan => ({
      id: plan.id,
      start: plan.repeat === 'once' ? plan.start_sec : plan.start_min * 60,
      end: plan.repeat === 'once' ? plan.end_sec : plan.end_min * 60,
      duration: plan.end_min - plan.start_min,
      repeat: plan.repeat,
      mode: plan.mode,
    }));
    console.log('计划列表：', plan_arrs);
    // NativeClass.setTimerange(JSON.stringify(plan_arrs));
  };

  setCurPlan = (id: string, is_pause: boolean) => {
    let cur_plan = this.all_plans.find(p => p.id === id);
    if (cur_plan) {
      cur_plan.is_pause = is_pause;
      this.cur_plan = cur_plan;
    } else {
      this.resetPlan();
    }
  };

  // iOS 定时屏蔽配置：与保存计划并行执行
  setScheduleIOS = async () => {
    try {
      // 基于现有计划 + 当前即将新增的计划，组装下发的 iOS 周期任务
      const existing = this.cus_plans
        .filter((p: any) => Array.isArray(p.repeat))
        .map((p: any) => ({
          id: p.id,
          start: p.start_min * 60,
          end: p.end_min * 60,
          repeatDays: p.repeat,
          mode: p.mode,
        }));
      const json = JSON.stringify(existing);
      await NativeModule.configurePlannedLimits(json);
      return true;
    } catch (e) {
      console.log('IOS添加时间段失败：', e);
      return false;
    }
  };

  // 重新获取当前任务
  resetPlan = () => {
    // 获取当前时间的分钟数（当天从0点开始的总分钟数）
    const minutes = getCurrentMinute();
    // 今天是周几（1=周一 ... 7=周日）
    const jsDay = new Date().getDay(); // 0=周日 ... 6=周六
    const today = jsDay === 0 ? 7 : jsDay;

    // 仅保留：一次性任务，或周期任务且今天在 repeat 中
    const filteredPlans = this.all_plans.filter(p => {
      const r = parseRepeat((p as any).repeat);
      if (r === 'once') return true;
      // 若没有有效 repeat 数组，默认认为不匹配（避免误触发）
      if (!Array.isArray(r) || r.length === 0) return false;
      return r.includes(today);
    });

    // 查找当前正在进行中的计划
    this.cur_plan =
      filteredPlans.find(p => minutes >= p.start_min && minutes < p.end_min) ||
      null;

    // 查找下一个计划（同日内开始时间在当前之后的第一个）
    this.next_plan = filteredPlans.find(p => minutes < p.start_min) || null;

    // 清理已过期的一次性任务
    const finishedOnce = this.once_plans.find(p => minutes >= p.end_min);
    if (finishedOnce) {
      this.rmOncePlan(finishedOnce.id);
    }
  };

  addPlan = async (
    form: Record<string, any>,
    fun: (data?: HttpRes) => void,
  ) => {
    try {
      console.log('计划参数：', form);
      let form_data = JSON.parse(JSON.stringify(form));
      form_data.repeat = form_data.repeat.join(',');
      let res: HttpRes = await http.post('/plan/add', form_data);
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
        let plans_count = storage.getString('cus_plans_count');
        this.setCusPlans(res.data);
        // console.log('【周期计划数量】: ', plans_count, res.data.length);
        if (!plans_count || plans_count !== `${res.data.length}`) {
          this.setScheduleIOS();
          storage.set('cus_plans_count', `${res.data.length}`);
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
        await this.getPlans();
        // iOS: 删除后需要重新同步周期任务至原生
        try {
          const plans = this.cus_plans
            .filter((p: any) => Array.isArray(p.repeat))
            .map((p: any) => ({
              id: p.id,
              start: p.start_min * 60,
              end: p.end_min * 60,
              repeatDays: p.repeat as number[],
              mode: p.mode,
            }));
          const json = JSON.stringify(plans);
          const mod: any = (NativeModules as any).NativeModule;
          if (mod?.configurePlannedLimits)
            await mod.configurePlannedLimits(json);
        } catch (e) {
          console.log('iOS 同步删除后计划失败', e);
        }
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
    storage.set('once_plans', JSON.stringify(this.once_plans));
    this.updatePlans();
  };
  rmOncePlan = (id: string) => {
    let index = this.once_plans.findIndex(r => r.id === id);
    if (index > -1) {
      this.once_plans.splice(index, 1);
    }
    storage.set('once_plans', JSON.stringify(this.once_plans));
    this.updatePlans();
  };
}

const store = new PlanStore();

export default store;

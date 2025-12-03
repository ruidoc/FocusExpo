import { Toast } from '@/components/ui';
import { getCurrentMinute, parseRepeat, storage } from '@/utils';
import http from '@/utils/request';
import dayjs from 'dayjs';
import { NativeModules } from 'react-native';
import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { useBenefitStore as benefit, useRecordStore as record } from '.';

const { NativeModule } = NativeModules;

const PlanStore = combine(
  {
    cus_plans: [] as CusPlan[], // 任务列表
    once_plans: [] as CusPlan[], // 一次性任务列表
    active_plan: null as CusPlan | null, // 当前任务
    next_plan: null as CusPlan | null, // 下一个
    editing_plan: null as CusPlan | null, // 当前编辑的任务
    paused_plan_id: '' as string, // 暂停中的任务
    exit_plan_ids: [] as string[], // 退出任务ID列表
    curplan_minute: 0 as number, // 当前任务已运行时长，退出重进后重新计时
  },
  (set, get) => ({
    is_focus_mode() {
      return get().active_plan && get().active_plan.mode === 'focus';
    },
    all_plans() {
      return [...get().cus_plans, ...get().once_plans];
    },
    is_pause() {
      return get().active_plan && get().active_plan.id === get().paused_plan_id;
    },

    setCusPlans: (plans: any[]) => {
      let final_plans = plans.map(r => ({
        ...r,
        repeat: parseRepeat(r.repeat),
      }));
      set({ cus_plans: final_plans });
      storage.set('cus_plans', JSON.stringify(plans));
    },

    setOncePlans: (plans: any[]) => {
      set({ once_plans: plans });
      storage.set('once_plans', JSON.stringify(plans));
    },

    addExitPlanIds: (id: string) => {
      // 拼接字符串为当天日期+id
      let date = dayjs().format('YYYY-MM-DD');
      (get() as any).setExitPlanIds([...get().exit_plan_ids, `${date}:${id}`]);
    },

    setExitPlanIds: (ids: string[]) => {
      let date = dayjs().format('YYYY-MM-DD');
      console.log('退出任务列表', ids);
      let today_ids = ids.filter(r => r.includes(date));
      set({ exit_plan_ids: today_ids });
      storage.set('exit_plan_ids', today_ids.join(','));
      (get() as any).resetPlan();
    },

    setCurPlanMinute: (minute: number) => {
      set({ curplan_minute: minute });
    },
    setPaused: (id: string) => {
      set({ paused_plan_id: id });
      storage.set('paused_plan_id', id);
    },

    // 编辑任务相关方法
    setEditingPlan: (plan: CusPlan | null) => {
      set({ editing_plan: plan });
    },

    clearEditingPlan: () => {
      set({ editing_plan: null });
    },

    // 设置当前任务的暂停状态，并同步到列表中
    pauseCurPlan: async (paused: boolean) => {
      let record_id = record.getState().record_id;
      if (paused && record_id) {
        benefit.getState().subBalance();
        await record.getState().pauseRecord(record_id);
      }
      if (get().active_plan) {
        if (paused) {
          (get() as any).setPaused(get().active_plan.id);
        } else {
          (get() as any).setPaused('');
        }
      }
    },

    // 专注计划完成
    complatePlan: async () => {
      console.log('【专注计划完成】');
      record.getState().removeRecordId();
      (get() as any).pauseCurPlan(false);
      (get() as any).setCurPlanMinute(0);
      (get() as any).resetPlan();
    },

    // 专注计划终止
    exitPlan: async () => {
      let record_id = storage.getString('record_id');
      if (record_id) {
        await record.getState().exitRecord(record_id);
        record.getState().removeRecordId();
        (get() as any).pauseCurPlan(false);
        (get() as any).setCurPlanMinute(0);
        (get() as any).resetPlan();
      }
    },

    // 更新计划列表（Android原生占位，iOS不同步）
    updatePlans: () => {
      let plan_arrs = (get() as any).all_plans.map((plan: CusPlan) => ({
        id: plan.id,
        start: plan.repeat === 'once' ? plan.start_sec : plan.start_min * 60,
        end: plan.repeat === 'once' ? plan.end_sec : plan.end_min * 60,
        duration: plan.end_min - plan.start_min,
        repeat: plan.repeat,
        mode: plan.mode,
      }));
      console.log('计划列表：', plan_arrs);
      // NativeClass.setTimerange(JSON.stringify(plan_arrs));
    },

    // iOS 定时屏蔽配置：与保存计划并行执行
    setScheduleIOS: async () => {
      try {
        // 基于现有计划 + 当前即将新增的计划，组装下发的 iOS 周期任务
        const existing = get()
          .cus_plans.filter((p: any) => Array.isArray(p.repeat))
          .map((p: any) => ({
            id: p.id,
            start: p.start_min * 60,
            end: p.end_min * 60,
            repeatDays: p.repeat,
            mode: p.mode,
          }));
        const json = JSON.stringify(existing);
        await NativeModule.setSchedulePlans(json);
        return true;
      } catch (e) {
        console.log('IOS添加时间段失败：', e);
        return false;
      }
    },

    // 重新获取当前任务
    resetPlan: () => {
      // 获取当前时间的分钟数（当天从0点开始的总分钟数）
      const minutes = getCurrentMinute();
      // 今天是周几（1=周一 ... 7=周日）
      const jsDay = new Date().getDay(); // 0=周日 ... 6=周六
      const today = jsDay === 0 ? 7 : jsDay;

      // 仅保留：一次性任务，或周期任务且今天在 repeat 中
      const filteredPlans = (get() as any).all_plans().filter((p: CusPlan) => {
        const r = parseRepeat((p as any).repeat);
        if (r === 'once') return true;
        // 若没有有效 repeat 数组，默认认为不匹配（避免误触发）
        if (!Array.isArray(r) || r.length === 0) return false;
        return r.includes(today);
      });

      // 查找当前正在进行中的计划
      const active_plan =
        filteredPlans.find(
          (p: CusPlan) =>
            minutes >= p.start_min &&
            minutes < p.end_min &&
            !get().exit_plan_ids.includes(
              `${dayjs().format('YYYY-MM-DD')}:${p.id}`,
            ),
        ) || null;

      // 查找下一个计划（同日内开始时间在当前之后的第一个）
      const next_plan =
        filteredPlans.find((p: CusPlan) => minutes < p.start_min) || null;

      set({ active_plan, next_plan });

      // 清理已过期的一次性任务
      const finishedOnce = get().once_plans.find(
        (p: CusPlan) => minutes >= p.end_min,
      );
      if (finishedOnce) {
        (get() as any).rmOncePlan(finishedOnce.id);
      }
    },

    addPlan: async (
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
          (get() as any).getPlans(null, () => (get() as any).setScheduleIOS());
        } else {
          Toast(res.message);
          fun();
        }
      } catch (error) {
        console.log(error);
        fun();
      }
    },

    editPlan: async (
      id: string,
      form: Record<string, any>,
      fun: (data?: HttpRes) => void,
    ) => {
      try {
        console.log('编辑计划参数：', form);
        let form_data = JSON.parse(JSON.stringify(form));
        form_data.repeat = form_data.repeat.join(',');
        let res: HttpRes = await http.put(`/plan/edit/${id}`, form_data);
        if (res.statusCode === 200) {
          fun(res);
          (get() as any).getPlans(null, () => (get() as any).setScheduleIOS());
          (get() as any).clearEditingPlan(); // 编辑成功后清除编辑状态
        } else {
          Toast(res.message);
          fun();
        }
      } catch (error) {
        console.log(error);
        fun();
      }
    },

    getPlans: async (params: any = {}, fun?: (data?: HttpRes) => void) => {
      try {
        if (!params || !params.date) {
          params = {
            date: dayjs().format('YYYY-MM-DD'),
          };
        }
        let res: HttpRes = await http.get('/plan/lists', { params });
        if (res.statusCode === 200) {
          (get() as any).setCusPlans(res.data);
          if (fun) fun(res);
        }
      } catch (error) {
        console.log(error);
      }
    },

    removePlan: async (id: string, fun?: (data?: HttpRes) => void) => {
      try {
        let res: HttpRes = await http.delete('/plan/remove/' + id);
        if (res.statusCode === 200) {
          if (fun) fun(res);
          await (get() as any).getPlans(null, () =>
            (get() as any).setScheduleIOS(),
          );
          // iOS: 删除后需要重新同步周期任务至原生
          try {
            const plans = get()
              .cus_plans.filter((p: any) => Array.isArray(p.repeat))
              .map((p: any) => ({
                id: p.id,
                start: p.start_min * 60,
                end: p.end_min * 60,
                repeatDays: p.repeat as number[],
                mode: p.mode,
              }));
            const json = JSON.stringify(plans);
            const mod: any = (NativeModules as any).NativeModule;
            if (mod?.setSchedulePlans) await mod.setSchedulePlans(json);
          } catch (e) {
            console.log('iOS 同步删除后计划失败', e);
          }
        }
      } catch (error) {
        console.log(error);
      }
    },
    clearPlans: () => {
      set({ once_plans: [], cus_plans: [] });
      (get() as any).updatePlans();
    },
    addOncePlan: (form: CusPlan) => {
      const once_plans = [...get().once_plans, form];
      set({ once_plans });
      console.log('【添加一次性任务】', form);
      storage.set('once_plans', JSON.stringify(once_plans));
      (get() as any).updatePlans();
    },
    rmOncePlan: (id: string) => {
      const once_plans = get().once_plans.filter(r => r.id !== id);
      set({ once_plans });
      storage.set('once_plans', JSON.stringify(once_plans));
      (get() as any).updatePlans();
    },
  }),
);

const store = create(PlanStore);

export default store;

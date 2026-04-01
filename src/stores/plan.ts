import { Toast } from '@/components/ui';
import { deletePlan, updatePlan } from '@/native/ios';
import type { FocusStatus, PlanConfig } from '@/native/type';
import {
  getCurrentMinute,
  parseRepeat,
  storage,
} from '@/utils';

import http from '@/utils/request';
import dayjs from 'dayjs';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import {
  useBenefitStore as benefit,
  useRecordStore as record,
  useAppStore,
} from '.';

const PlanStore = combine(
  {
    cus_plans: [] as CusPlan[], // 任务列表
    today_plans: [] as CusPlan[], // 今日契约（独立于筛选）
    once_plans: [] as CusPlan[], // 一次性任务列表
    active_plan: null as CusPlan | null, // 当前任务
    next_plan: null as CusPlan | null, // 下一个
    editing_plan: null as CusPlan | null, // 当前编辑的任务
    paused_plan_id: '' as string, // 暂停中的任务
    exit_plan_ids: [] as string[], // 退出任务ID列表
    curplan_minute: 0 as number, // 当前任务已运行时长，退出重进后重新计时
    native_focus: { active: false } as FocusStatus, // iOS 原生专注快照
  },
  (set, get) => ({
    is_allow_mode() {
      return (
        get().active_plan?.mode === 'allow' ||
        get().native_focus.mode === 'allow'
      );
    },
    all_plans() {
      return [...get().cus_plans, ...get().once_plans];
    },
    focus_plan() {
      const nativePlanId = get().native_focus.plan_id;
      if (nativePlanId) {
        const matched = [...get().cus_plans, ...get().once_plans].find(
          (p: CusPlan) => p.id === nativePlanId,
        );
        if (matched) return matched;
      }
      return get().active_plan;
    },
    has_active_task() {
      if (Platform.OS === 'ios') {
        return !!get().native_focus.active;
      }
      return !!get().active_plan;
    },
    is_pause() {
      return (
        !!(get().active_plan && get().active_plan.id === get().paused_plan_id) ||
        !!get().native_focus.paused
      );
    },
    setNativeFocus: (focus: FocusStatus) => {
      set({ native_focus: focus });
    },
    clearNativeFocus: () => {
      set({ native_focus: { active: false } });
    },
    syncActivePlanWithNative: (planId?: string | null) => {
      if (!planId) return;
      const target =
        [...get().cus_plans, ...get().once_plans].find(p => p.id === planId) ||
        null;
      if (target) {
        set({ active_plan: target });
      }
    },

    setCusPlans: (plans: any[]) => {
      let final_plans = plans.map(r => ({
        ...r,
        repeat: parseRepeat(r.repeat),
      }));
      set({ cus_plans: final_plans });
      storage.set('cus_plans', JSON.stringify(plans));
      // 设置完数据后，重新计算当前任务
      (get() as any).resetPlan();
    },

    setOncePlans: (plans: any[]) => {
      set({ once_plans: plans });
      storage.set('once_plans', JSON.stringify(plans));
      // 设置完数据后，重新计算当前任务
      (get() as any).resetPlan();
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
      const activePlanId = get().active_plan?.id;

      // 幂等：已在目标状态则跳过副作用，避免重复扣币和重复调用 pauseRecord
      const alreadyPaused = !!(activePlanId && activePlanId === get().paused_plan_id);
      if (paused && alreadyPaused) return;
      if (!paused && !alreadyPaused) return;

      let record_id = record.getState().record_id;
      if (paused && record_id) {
        await record.getState().pauseRecord(record_id);
        benefit.getState().subBalance();
      }
      if (activePlanId) {
        (get() as any).setPaused(paused ? activePlanId : '');
      }
    },

    // 专注计划完成
    complatePlan: async () => {
      console.log('【专注计划完成】');
      (get() as any).clearNativeFocus();
      record.getState().removeRecordId();
      (get() as any).pauseCurPlan(false);
      (get() as any).setCurPlanMinute(0);
      (get() as any).resetPlan();
      record.getState().getStatis();
      // 同步权益数据，更新 today_used
      benefit.getState().getBenefit();
    },

    // 专注计划终止
    exitPlan: async () => {
      const record_id = record.getState().record_id || storage.getString('record_id');
      (get() as any).clearNativeFocus();
      if (record_id) {
        await record.getState().exitRecord(record_id);
        record.getState().removeRecordId();
        (get() as any).pauseCurPlan(false);
        (get() as any).setCurPlanMinute(0);
        (get() as any).resetPlan();
      }
    },

    // 更新iOS专注计划
    updateIOSPlan: async (plan: CusPlan) => {
      const repeat = parseRepeat(plan.repeat);
      // 原生 parsePlanDate 只认 yyyy-MM-dd；接口常为 ISO 字符串，不规范化会导致解析失败、跳过「尚未开始」校验误触 shield
      const toYmd = (d: string | undefined) => {
        if (!d) return null;
        const t = dayjs(d);
        return t.isValid() ? t.format('YYYY-MM-DD') : null;
      };
      const data: PlanConfig = {
        id: plan.id,
        name: plan.name,
        start: plan.start_min, // Minutes
        end: plan.end_min, // Minutes
        days: repeat === 'once' ? [] : (repeat as number[]), // 一次性任务使用空数组
        apps: plan.apps || [],
        mode: plan.mode || 'shield',
        start_date: toYmd(plan.start_date),
        end_date: toYmd(plan.end_date),
      };
      console.log('同步计划到 IOS Native:', JSON.stringify(data));
      await updatePlan(data);
    },

    // 重新获取当前任务
    resetPlan: () => {
      // 防御性检查：确保 cus_plans 和 once_plans 已初始化
      const cus_plans = get().cus_plans || [];
      const once_plans = get().once_plans || [];

      const minutes = getCurrentMinute();
      const dateKey = dayjs().format('YYYY-MM-DD');

      const today_plans = get().today_plans || [];
      const todayPeriodicIds = new Set(today_plans.map(p => p.id));

      const inFocusWindow = (p: CusPlan) =>
        minutes >= p.start_min &&
        minutes < p.end_min &&
        !get().exit_plan_ids.includes(`${dateKey}:${p.id}`);

      // 当前进行中：先扫 cus（顺序与列表一致），仅认「今日」周期契约；再扫一次性任务
      let active_plan: CusPlan | null = null;
      for (const p of cus_plans) {
        if (todayPeriodicIds.has(p.id) && inFocusWindow(p)) {
          active_plan = p;
          break;
        }
      }
      if (!active_plan) {
        for (const p of once_plans) {
          if (parseRepeat((p as any).repeat) === 'once' && inFocusWindow(p)) {
            active_plan = p;
            break;
          }
        }
      }

      // 下一个契约：仅今日契约中，按开始时间排序后取「尚未开始」的第一个
      const sortedToday = [...today_plans].sort(
        (a, b) => a.start_min - b.start_min,
      );
      const next_plan =
        sortedToday.find((p: CusPlan) => minutes < p.start_min) || null;

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
          (get() as any).updateIOSPlan(res.data);
          (get() as any).getPlans();
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
        form_data.id = id;
        form_data.repeat = form_data.repeat.join(',');
        let res: HttpRes = await http.put(`/plan/edit/${id}`, form_data);
        if (res.statusCode === 200) {
          fun(res);
          (get() as any).updateIOSPlan(form_data);
          (get() as any).getPlans();
          (get() as any).clearEditingPlan(); // 编辑成功后清除编辑状态
        } else {
          Toast(res.message);
          fun();
        }
      } catch (error) {
        console.log('编辑计划失败：', error);
        fun();
      }
    },

    getPlans: async (params = {}, fun?: (data?: HttpRes) => void) => {
      try {
        let res: HttpRes = await http.get('/plan/lists', { params });
        if (res.statusCode === 200) {
          (get() as any).setCusPlans(res.data);
          (get() as any).getTodayPlans();
          if (fun) fun(res);
        }
      } catch (error) {
        console.log(error);
      }
    },

    getTodayPlans: async () => {
      try {
        let res: HttpRes = await http.get('/plan/lists', {
          params: { period: 'today' },
        });
        if (res.statusCode === 200) {
          const plans = (res.data || []).map((r: any) => ({
            ...r,
            repeat: parseRepeat(r.repeat),
          }));
          set({ today_plans: plans });
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
          // iOS: 立即删除原生端计划
          await deletePlan(id);
          await (get() as any).getPlans();
        }
      } catch (error) {
        console.log(error);
      }
    },
    clearPlans: () => {
      set({ once_plans: [], cus_plans: [] });
    },
    addOncePlan: (form: CusPlan) => {
      const once_plans = [...get().once_plans, form];
      set({ once_plans });
      console.log('【添加一次性任务】', form);
      storage.set('once_plans', JSON.stringify(once_plans));
    },
    rmOncePlan: (id: string) => {
      const once_plans = get().once_plans.filter(r => r.id !== id);
      set({ once_plans });
      storage.set('once_plans', JSON.stringify(once_plans));
    },

    // 全量同步计划到 iOS 原生侧
    syncAllPlansToNative: async () => {
      try {
        // 1. 确保 ios_all_apps 数据已就绪
        const astore = useAppStore.getState();
        if (astore.ios_all_apps.length === 0) {
          await astore.getIosApps();
        }
        // 2. 获取服务器端所有计划
        const serverPlans = get().cus_plans;
        // 3. 同步每个计划到原生侧
        let successCount = 0;
        for (const plan of serverPlans) {
          try {
            await (get() as any).updateIOSPlan(plan);
            successCount++;
          } catch (error) {
            console.error(`同步计划失败: ${plan.id}`, error);
          }
        }
        return {
          success: true,
          total: serverPlans.length,
          successCount,
        };
      } catch (error) {
        console.error('全量同步失败:', error);
        throw error;
      }
    },
  }),
);

const store = create(PlanStore);

export default store;

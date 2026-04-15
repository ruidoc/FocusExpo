import { Toast } from '@/components/ui';
import { incrementFocusCount, storage } from '@/utils';
import http from '@/utils/request';
import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { useBenefitStore, usePlanStore } from '.';

const RecordStore = combine(
  {
    records: [] as RecordInfo[], // 任务列表
    record_id: '' as string, // 当前记录Id
    total_mins: 0 as number, // 计划专注时长（分钟数）
    actual_mins: 0 as number, // 实际专注时长（分钟数）
    actual_mins_snapshot_curplan_minute: 0 as number,
    actual_mins_snapshot_record_id: '' as string,
    success_rate: '0%' as string, // 专注成功率
  },
  (set, get) => ({
    // Getter 方法改为普通函数
    cur_record() {
      return get().records.find(x => x.id === get().record_id);
    },

    setRecords: (records: any[]) => {
      set({ records });
    },
    setRecordId: async (id: string) => {
      set({ record_id: id });
      storage.set('record_id', id);
      await storage.setGroup('record_id', id);
    },
    removeRecordId: async () => {
      set({ record_id: '' });
      storage.delete('record_id');
      try {
        await storage.setGroup('record_id', '');
      } catch (error) {
        console.log('removeRecordId setGroup', error);
      }
    },

    // 格式化专注时长
    formatMinute: () => {
      let hour = Math.floor(get().actual_mins / 60);
      let mint = get().actual_mins % 60;
      if (hour) {
        return `${hour}小时${mint}分钟`;
      }
      return `${mint}分钟`;
    },

    addRecord: async (
      plan: CusPlan,
      bet_amount: number,
    ): Promise<string | null> => {
      try {
        let res: HttpRes = await http.post('/record/add', {
          title: plan.name || '一次性任务',
          plan_id: plan.id,
          start_min: plan.start_min,
          total_min: plan.end_min - plan.start_min,
          apps: plan.apps,
          mode: plan.mode,
          base_amount: 0,
          bet_amount,
        });
        console.log('添加记录结果：', res);
        if (res.statusCode === 200 && res.data?.id) {
          await (get() as any).setRecordId(res.data.id);
          return res.data.id as string;
        }
        if (res.statusCode === 200) {
          Toast('创建记录失败：缺少记录 ID');
        } else {
          Toast(res.message);
        }
        return null;
      } catch (error) {
        console.log(error);
        return null;
      }
    },

    getRecords: async (fun?: (data?: HttpRes) => void) => {
      try {
        let res: HttpRes = await http.get('/record/lists');
        if (res.statusCode === 200) {
          (get() as any).setRecords(res.data);
          if (fun) fun(res);
        }
      } catch (error) {
        console.log(error);
      }
    },

    getStatis: async () => {
      try {
        let res: HttpRes = await http.get('/record/statis');
        if (res.statusCode === 200) {
          const pstore = usePlanStore.getState();
          // console.log('统计数据：', res.data);
          set({
            actual_mins: res.data.actual_mins,
            actual_mins_snapshot_curplan_minute: pstore.curplan_minute,
            actual_mins_snapshot_record_id: get().record_id,
            success_rate: res.data.success_rate,
            total_mins: res.data.total_mins,
          });
        }
      } catch (error) {
        console.log(error);
      }
    },

    // 静默同步 actual_min 到后端（仅在前台兜底等关键时刻调用，失败不弹 Toast）
    updateActualMins: async (id: string, actual_min: number) => {
      try {
        if (!id) return;
        let res: HttpRes = await http.post(
          '/record/update/' + id,
          { actual_min },
          { silent: true } as any,
        );
        if (res.statusCode !== 200) {
          throw new Error('更新失败');
        }
        return res;
      } catch (error) {
        console.log('【静默上报失败】', error);
      }
    },

    // 专注完成
    completeRecord: async (id: string) => {
      try {
        let res: HttpRes = await http.post('/record/complete/' + id);
        if (res.statusCode === 200) {
          incrementFocusCount();
          (get() as any).getRecords();
          (get() as any).getStatis();
        }
      } catch (error) {
        console.log(error);
      }
    },

    // 暂停专注
    pauseRecord: async (id: string) => {
      try {
        let res: HttpRes = await http.post('/record/pause/' + id);
        if (res.statusCode === 200) {
          console.log('暂停专注成功');
        }
      } catch (error) {
        console.log(error);
      }
    },

    // 退出专注（携带当前已用时长，后端一并更新）
    exitRecord: async (record_id: string) => {
      try {
        const actual_min = usePlanStore.getState().curplan_minute;
        let res: HttpRes = await http.post('/record/fail/' + record_id, {
          reason: 'user_exit',
          actual_min: actual_min > 0 ? actual_min : undefined,
        });
        if (res.statusCode === 200) {
          (get() as any).getRecords();
          (get() as any).getStatis();
          useBenefitStore.getState().getBenefit();
        }
      } catch (error) {
        console.log(error);
      }
    },
  }),
);

const store = create(RecordStore);

export default store;

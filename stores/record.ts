import { storage } from '@/utils';
import http from '@/utils/request';
import { withRetry } from '@/utils/retry';
import { Toast } from '@fruits-chain/react-native-xiaoshu';
import { makeAutoObservable } from 'mobx';
import { BenefitStore } from '.';

class RecordStore {
  constructor() {
    makeAutoObservable(this);
  }

  records: RecordInfo[] = []; // 任务列表

  record_id: string = ''; // 当前记录Id

  total_mins: number = 0; // 计划专注时长（分钟数）
  actual_mins: number = 0; // 实际专注时长（分钟数）
  success_rate: string = '0%'; // 专注成功率

  get cur_record() {
    return this.records.find(x => x.id === this.record_id);
  }

  setRecords = (records: any[]) => {
    this.records = records;
  };
  setRecordId = (id: string) => {
    this.record_id = id;
    storage.set('record_id', id);
    storage.setGroup('record_id', id);
  };
  removeRecordId = () => {
    this.record_id = '';
    storage.delete('record_id');
    storage.setGroup('record_id', '');
  };

  // 格式化专注时长
  get formatMinute() {
    let hour = Math.floor(this.actual_mins / 60);
    let mint = this.actual_mins % 60;
    if (hour) {
      return `${hour}小时${mint}分钟`;
    }
    return `${mint}分钟`;
  }

  addRecord = async (plan: CusPlan, bet_amount: number) => {
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
      if (res.statusCode === 200) {
        this.setRecordId(res.data.id);
      } else {
        Toast(res.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  getRecords = async (fun?: (data?: HttpRes) => void) => {
    try {
      let res: HttpRes = await http.get('/record/lists');
      if (res.statusCode === 200) {
        this.setRecords(res.data);
        if (fun) fun(res);
      }
    } catch (error) {
      console.log(error);
    }
  };

  getStatis = async () => {
    try {
      let res: HttpRes = await http.get('/record/statis');
      if (res.statusCode === 200) {
        // console.log('统计数据：', res.data);
        this.actual_mins = res.data.actual_mins;
        this.success_rate = res.data.success_rate;
        this.total_mins = res.data.total_mins;
      }
    } catch (error) {
      console.log(error);
    }
  };

  // 每分钟更新专注时长（带重试）
  updateActualMins = async (id: string, actual_min: number) => {
    try {
      if (!id) return;
      await withRetry(
        async () => {
          let res: HttpRes = await http.post('/record/update/' + id, {
            actual_min,
          });
          if (res.statusCode !== 200) {
            throw new Error('更新失败');
          }
          return res;
        },
        {
          maxRetries: 2,
          retryDelay: 500,
        },
      );
      console.log('上报成功:', actual_min);
    } catch (error) {
      console.error('上报失败（已重试）:', error);
      // 失败后本地缓存，下次补偿上报
      // TODO: 可以在下次成功时补偿上报缺失的分钟数
    }
  };

  // 专注完成
  completeRecord = async (id: string) => {
    try {
      let res: HttpRes = await http.post('/record/complete/' + id);
      if (res.statusCode === 200) {
        this.getRecords();
      }
    } catch (error) {
      console.log(error);
    }
  };

  // 暂停专注
  pauseRecord = async (id: string) => {
    try {
      let res: HttpRes = await http.post('/record/pause/' + id);
      if (res.statusCode === 200) {
        console.log('暂停专注成功');
      }
    } catch (error) {
      console.log(error);
    }
  };

  // 退出专注
  exitRecord = async (record_id: string) => {
    try {
      let res: HttpRes = await http.post('/record/fail/' + record_id, {
        reason: 'user_exit',
      });
      if (res.statusCode === 200) {
        this.getRecords();
        BenefitStore.getBenefit();
      }
    } catch (error) {
      console.log(error);
    }
  };
}

const store = new RecordStore();

export default store;

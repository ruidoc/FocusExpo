import http from '@/request';
import { Toast } from '@fruits-chain/react-native-xiaoshu';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeAutoObservable } from 'mobx';
import { BenefitStore } from '.';

class RecordStore {
  constructor() {
    makeAutoObservable(this);
  }

  records: RecordInfo[] = []; // 任务列表

  total_mins: number = 0; // 计划专注时长（分钟数）
  actual_mins: number = 0; // 实际专注时长（分钟数）
  success_rate: string = '0%'; // 专注成功率

  setRecords = (records: any[]) => {
    this.records = records;
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

  addRecord = async (
    plan: CusPlan,
    apps: string[],
    bet_amount: number,
    description?: string,
  ) => {
    try {
      let res: HttpRes = await http.post('/record/add', {
        plan_id: plan.id,
        start_min: plan.start_min,
        total_min: plan.end_min - plan.start_min,
        apps: apps,
        mode: plan.mode,
        base_amount: 1,
        bet_amount,
      });
      if (res.statusCode === 200) {
        AsyncStorage.setItem('record_id', res.data.id);
        // 记录描述仅本地存储，避免后端字段不兼容
        if (description && typeof description === 'string') {
          try {
            await AsyncStorage.setItem(
              `record_desc:${res.data.id}`,
              description,
            );
          } catch {
            // ignore
          }
        }
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

  // 每分钟更新专注时长
  updateActualMins = async (id: string, actual_min: number) => {
    try {
      if (!id) return;
      let res: HttpRes = await http.post('/record/update/' + id, {
        actual_min,
      });
      if (res.statusCode === 200) {
        this.getRecords();
      }
    } catch (error) {
      console.log(error);
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
  exitRecord = async (plan_id: string) => {
    try {
      let res: HttpRes = await http.post('/record/fail/' + plan_id);
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

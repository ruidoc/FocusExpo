import { makeAutoObservable } from 'mobx';
import http from '@/request';
import { Toast } from '@fruits-chain/react-native-xiaoshu';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';

class RecordStore {
  constructor() {
    makeAutoObservable(this);
  }

  records: RecordInfo[] = []; // 任务列表

  exit_count: number = 0; // 中途退出次数
  total_plan: number = 0; // 计划专注时长（分钟数）
  total_real: number = 0; // 实际专注时长（分钟数）
  total_exit: number = 0; // 退出时长（分钟数）

  setRecords = (records: any[]) => {
    this.records = records;
  };

  // 设置专注总时长(分钟数)
  setTotalReal = async (timestamp: number, reset = false) => {
    const todayKey = `total_real_${dayjs().format('YYYYMMDD')}`;
    let total_real = await AsyncStorage.getItem(todayKey);
    if (total_real !== null) {
      // 今天已存在，直接累加或重置
      if (!reset) {
        this.total_real = Number(total_real) + timestamp;
        await AsyncStorage.setItem(todayKey, this.total_real.toString());
      } else {
        this.total_real = timestamp;
        await AsyncStorage.setItem(todayKey, timestamp.toString());
      }
    } else {
      // 今天第一次写，先清理旧 key
      const allKeys = await AsyncStorage.getAllKeys();
      const realKeys = allKeys.filter(
        k => k.startsWith('total_real_') && k !== todayKey,
      );
      if (realKeys.length > 0) {
        await AsyncStorage.multiRemove(realKeys);
      }
      this.total_real = reset ? timestamp : timestamp;
      await AsyncStorage.setItem(todayKey, this.total_real.toString());
    }
  };

  setExitCount = async (count?: number) => {
    const todayKey = `exit_count_${dayjs().format('YYYYMMDD')}`;
    let exit_count = await AsyncStorage.getItem(todayKey);

    if (exit_count !== null) {
      // 今天已存在，直接累加或重置
      if (count === undefined) {
        this.exit_count = Number(exit_count) + 1;
        await AsyncStorage.setItem(todayKey, this.exit_count.toString());
      } else {
        this.exit_count = count;
        await AsyncStorage.setItem(todayKey, count.toString());
      }
    } else {
      // 今天第一次写，先清理旧 key
      const allKeys = await AsyncStorage.getAllKeys();
      const exitKeys = allKeys.filter(
        k => k.startsWith('exit_count_') && k !== todayKey,
      );
      if (exitKeys.length > 0) {
        await AsyncStorage.multiRemove(exitKeys);
      }
      this.exit_count = count === undefined ? 1 : count;
      await AsyncStorage.setItem(todayKey, this.exit_count.toString());
    }
  };

  // 格式化专注时长
  get formatMinute() {
    let hour = Math.floor(this.total_real / 60);
    let mint = this.total_real % 60;
    if (hour) {
      return `${hour}小时${mint}分钟`;
    }
    return `${mint}分钟`;
  }

  addRecord = async (plan: CusPlan, apps: string[]) => {
    try {
      let res: HttpRes = await http.post('/record/add', {
        plan_id: plan.id,
        start_min: plan.start_min,
        plan_min: plan.end_min - plan.start_min,
        apps: apps,
        mode: plan.mode,
      });
      if (res.statusCode === 200) {
        AsyncStorage.setItem('record_id', res.data.id);
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
        // this.resetPlan();
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
        console.log('统计数据：', res.data);
        // this.setTotalReal(res.data.total_real, true);
        // this.setExitCount(res.data.exit_count);
      }
    } catch (error) {
      console.log(error);
    }
  };

  updateRecord = async (id: string, form: Record<string, any>) => {
    try {
      let res: HttpRes = await http.post('/record/update/' + id, form);
      if (res.statusCode === 200) {
        this.getRecords();
      }
    } catch (error) {
      console.log(error);
    }
  };

  // 专注完成
  completeRecord = async (id: string, minutes: string) => {
    try {
      let res: HttpRes = await http.post('/record/complete/' + id, {
        minutes: Number(minutes),
      });
      if (res.statusCode === 200) {
        this.getRecords();
      }
    } catch (error) {
      console.log(error);
    }
  };

  // 中途退出
  exitRecord = async (plan_id: string, form: Record<string, any>) => {
    try {
      let res: HttpRes = await http.post('/record/exit/' + plan_id, form);
      if (res.statusCode === 200) {
        this.getRecords();
      }
    } catch (error) {
      console.log(error);
    }
  };

  // 中途退出/半路开始，继续专注
  continueRecord = async (plan: CusPlan, apps: string[]) => {
    try {
      let res: HttpRes = await http.post('/record/continue', {
        plan_id: plan.id,
        start_min: plan.start_min,
        plan_min: plan.end_min - plan.start_min,
        apps: apps,
        mode: plan.mode,
      });
      if (res.statusCode === 200) {
        AsyncStorage.setItem('record_id', res.data.id);
      } else {
        Toast(res.message);
      }
    } catch (error) {
      console.log(error);
    }
  };
}

const store = new RecordStore();

export default store;

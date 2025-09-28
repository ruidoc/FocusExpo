import staticData from '@/config/static.json';
import dayjs from 'dayjs';
import Toast from 'react-native-toast-message';

export const toast = (
  message: string,
  type: 'info' | 'error' | 'success' = 'info',
) => {
  Toast.show({ text1: message, type: type });
};

export const checkCodePushUpdate = async () => {
  try {
    // const update = await CodePush.checkForUpdate();
    // if (update) {
    //   const downloadProgress = ({
    //     receivedBytes,
    //     totalBytes,
    //   }: {
    //     receivedBytes: number;
    //     totalBytes: number;
    //   }) => {
    //     // 处理下载进度
    //     const progress = (receivedBytes / totalBytes) * 100;
    //     console.log(`下载进度: ${progress}%`);
    //   };
    //   // 下载并安装更新
    //   await update.download(downloadProgress);
    // }
  } catch (error) {
    console.error('CodePush 更新检查失败:', error);
  }
};

export const fenToYuan = (fen: number | string): string => {
  if (typeof fen === 'string') fen = parseInt(fen, 10);
  return (fen / 100).toFixed(2);
};

// 解析 repeat 字段：支持 'once' | number[] | '1,2,3'
export const parseRepeat = (repeat: any): 'once' | number[] => {
  if (repeat === 'once') return 'once';
  if (Array.isArray(repeat)) {
    return repeat
      .map((d: any) => Number(d))
      .filter((d: number) => d >= 1 && d <= 7);
  }
  if (typeof repeat === 'string') {
    const parts = repeat
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(n => Number(n))
      .filter(n => !Number.isNaN(n) && n >= 1 && n <= 7);
    return parts.length > 0 ? parts : [];
  }
  return [];
};

// 获取当前分钟数
export const getCurrentMinute = (more = false): number => {
  let today = dayjs();
  let now = today.hour() * 60 + today.minute();
  if (more && today.second() > 0) {
    now += 1;
  }
  return now;
};

// 获取本周日期数据
export const getWeekDates = () => {
  const today = new Date();
  const currentDay = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));

  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    weekDates.push({
      date: date,
      dayName: staticData.repeats.map(w => '周' + w.label)[i],
      dayNumber: date.getDate(),
      isToday: date.toDateString() === today.toDateString(),
    });
  }
  return weekDates;
};

// 重新导出存储实例和相关工具
export { storage } from './storage';

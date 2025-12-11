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
// 周几约定：0=周日, 1=周一, 2=周二, ..., 6=周六
export const parseRepeat = (repeat: any): 'once' | number[] => {
  if (repeat === 'once') return 'once';
  if (Array.isArray(repeat)) {
    return repeat
      .map((d: any) => Number(d))
      .filter((d: number) => d >= 0 && d <= 6);
  }
  if (typeof repeat === 'string') {
    const parts = repeat
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(n => Number(n))
      .filter(n => !Number.isNaN(n) && n >= 0 && n <= 6);
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

// 分钟转几小时几分钟
export const minutesToHours = (minutes: number): string => {
  if (minutes < 0) return '0分钟';

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} 分钟`;
  } else if (remainingMinutes === 0) {
    return `${hours} 小时`;
  } else {
    return `${hours} 小时 ${remainingMinutes} 分`;
  }
};

// 判断两个日期范围是否有交集
const hasDateRangeOverlap = (
  planStart: string | undefined,
  planEnd: string | undefined,
  targetStart: dayjs.Dayjs,
  targetEnd: dayjs.Dayjs,
): boolean => {
  // 如果计划没有日期范围，返回 true（表示不受日期限制）
  if (!planStart || !planEnd) {
    return true;
  }

  const planStartDate = dayjs(planStart);
  const planEndDate = dayjs(planEnd);

  // 判断日期范围是否有交集：计划开始 <= 目标结束 && 计划结束 >= 目标开始
  return (
    (planStartDate.isBefore(targetEnd, 'day') ||
      planStartDate.isSame(targetEnd, 'day')) &&
    (planEndDate.isAfter(targetStart, 'day') ||
      planEndDate.isSame(targetStart, 'day'))
  );
};

// 根据筛选类型过滤任务
export const getPlansByPeriod = (allPlans: CusPlan[], period: string) => {
  if (period === 'today') {
    // 今日：显示今天的任务
    const today = dayjs();
    const jsDay = today.day(); // 0=周日 ... 6=周六
    const todayDay = jsDay; // 转换为 0=周日, 1=周一 ... 6=周六
    const todayStart = today.startOf('day');
    const todayEnd = today.endOf('day');

    return allPlans.filter(plan => {
      // 检查日期范围是否包含今天
      const hasDateMatch = hasDateRangeOverlap(
        plan.start_date,
        plan.end_date,
        todayStart,
        todayEnd,
      );

      if (!hasDateMatch) {
        return false;
      }

      const repeat = Array.isArray(plan.repeat) ? plan.repeat : [];

      // 一次性任务：只要日期范围匹配就显示
      if (plan.repeat === 'once') {
        return true;
      }

      // 周期任务：需要今天在 repeat 中
      return repeat.length > 0 && repeat.includes(todayDay);
    });
  } else if (period === 'week') {
    // 本周：显示本周的任务（周一到周日）
    const today = dayjs();
    const jsDay = today.day(); // 0=周日 ... 6=周六
    const mondayOffset = jsDay === 0 ? 6 : jsDay - 1; // 距离周一的天数
    const weekStart = today.subtract(mondayOffset, 'day').startOf('day');
    const weekEnd = weekStart.add(6, 'day').endOf('day');

    // 获取本周的所有周几（0=周日, 1=周一 ... 6=周六）
    const weekDays: number[] = [];
    for (let i = 0; i < 7; i++) {
      const date = weekStart.add(i, 'day');
      const jsDayNum = date.day(); // 0=周日 ... 6=周六
      const dayNum = jsDayNum; // 直接使用，0=周日, 1=周一 ... 6=周六
      weekDays.push(dayNum);
    }

    return allPlans.filter(plan => {
      // 检查日期范围是否与本周有交集
      const hasDateMatch = hasDateRangeOverlap(
        plan.start_date,
        plan.end_date,
        weekStart,
        weekEnd,
      );

      if (!hasDateMatch) {
        return false;
      }

      const repeat = Array.isArray(plan.repeat) ? plan.repeat : [];

      // 一次性任务：只要日期范围有交集就显示
      if (plan.repeat === 'once') {
        return true;
      }

      // 周期任务：需要本周任意一天在 repeat 中
      return repeat.length > 0 && repeat.some(day => weekDays.includes(day));
    });
  } else if (period === 'month') {
    // 本月：显示本月的任务
    const today = dayjs();
    const monthStart = today.startOf('month');
    const monthEnd = today.endOf('month');

    return allPlans.filter(plan => {
      // 检查日期范围是否与本月有交集
      const hasDateMatch = hasDateRangeOverlap(
        plan.start_date,
        plan.end_date,
        monthStart,
        monthEnd,
      );

      if (!hasDateMatch) {
        return false;
      }

      const repeat = Array.isArray(plan.repeat) ? plan.repeat : [];

      // 一次性任务：只要日期范围有交集就显示
      if (plan.repeat === 'once') {
        return true;
      }

      // 周期任务：需要判断本月内是否有匹配的周几
      // 遍历本月的每一天，检查是否有匹配的周几
      if (repeat.length === 0) {
        return false;
      }

      let currentDate = monthStart;
      while (
        currentDate.isBefore(monthEnd) ||
        currentDate.isSame(monthEnd, 'day')
      ) {
        const jsDayNum = currentDate.day(); // 0=周日 ... 6=周六
        const dayNum = jsDayNum; // 直接使用，0=周日, 1=周一 ... 6=周六
        if (repeat.includes(dayNum)) {
          return true;
        }
        currentDate = currentDate.add(1, 'day');
      }

      return false;
    });
  } else {
    // 全部：显示所有任务
    return allPlans;
  }
};

// 重新导出存储实例和相关工具
export { storage } from './storage';

// 导出应用初始化工具
export { initAppData } from './app-init';

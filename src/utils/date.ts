import dayjs from 'dayjs';

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
    const todayDay = jsDay === 0 ? 7 : jsDay; // 转换为 1=周一 ... 7=周日
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

    // 获取本周的所有周几（1=周一 ... 7=周日）
    const weekDays: number[] = [];
    for (let i = 0; i < 7; i++) {
      const date = weekStart.add(i, 'day');
      const jsDayNum = date.day();
      const dayNum = jsDayNum === 0 ? 7 : jsDayNum;
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
        const jsDayNum = currentDate.day();
        const dayNum = jsDayNum === 0 ? 7 : jsDayNum;
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

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

// 获取日期范围和需要检查的周几数组
const getPeriodRange = (
  period: string,
): { start: dayjs.Dayjs; end: dayjs.Dayjs; days: number[] } | null => {
  const today = dayjs();

  if (period === 'today') {
    const start = today.startOf('day');
    const end = today.endOf('day');
    return { start, end, days: [today.day()] };
  }

  if (period === 'week') {
    const jsDay = today.day();
    const mondayOffset = jsDay === 0 ? 6 : jsDay - 1;
    const start = today.subtract(mondayOffset, 'day').startOf('day');
    const end = start.add(6, 'day').endOf('day');
    const days = Array.from({ length: 7 }, (_, i) => start.add(i, 'day').day());
    return { start, end, days };
  }

  if (period === 'month') {
    return {
      start: today.startOf('month'),
      end: today.endOf('month'),
      days: [], // 月份需要遍历所有日期，这里返回空数组
    };
  }

  return null;
};

// 检查周期任务是否在日期范围内有匹配的周几
const hasRepeatMatch = (
  repeat: number[],
  periodStart: dayjs.Dayjs,
  periodEnd: dayjs.Dayjs,
  periodDays: number[],
): boolean => {
  if (repeat.length === 0) {
    return false;
  }

  // 如果提供了周几数组（today/week），直接检查交集
  if (periodDays.length > 0) {
    return repeat.some(day => periodDays.includes(day));
  }

  // 月份需要遍历所有日期
  let currentDate = periodStart;
  while (
    currentDate.isBefore(periodEnd) ||
    currentDate.isSame(periodEnd, 'day')
  ) {
    if (repeat.includes(currentDate.day())) {
      return true;
    }
    currentDate = currentDate.add(1, 'day');
  }

  return false;
};

// 根据筛选类型过滤任务（只筛选周期任务，不考虑一次性任务）
export const getPlansByPeriod = (allPlans: CusPlan[], period: string) => {
  if (period === 'all') {
    // 全部：只返回周期任务
    return allPlans.filter(
      plan => plan.repeat !== 'once' && Array.isArray(plan.repeat),
    );
  }

  const periodRange = getPeriodRange(period);
  if (!periodRange) {
    return allPlans;
  }

  const { start, end, days } = periodRange;

  return allPlans.filter(plan => {
    // 只筛选周期任务，跳过一次性任务
    if (plan.repeat === 'once') {
      return false;
    }

    // 检查日期范围是否有交集
    if (!hasDateRangeOverlap(plan.start_date, plan.end_date, start, end)) {
      return false;
    }

    // 周期任务：检查是否有匹配的周几
    const repeat = Array.isArray(plan.repeat) ? plan.repeat : [];
    return hasRepeatMatch(repeat, start, end, days);
  });
};

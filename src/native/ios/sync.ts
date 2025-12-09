/**
 * iOS 专注状态同步管理器
 * 封装所有与 iOS 专注状态相关的同步逻辑、事件监听和定时器管理
 */

import { usePlanStore, useRecordStore } from '@/stores';
import { AppState, Platform } from 'react-native';
import type { ExtensionLogEvent, FocusStateEvent } from '../type';
import { createExtensionLogListener, createFocusStateListener } from './events';
import { getFocusStatus } from './methods';

// 内部定时器引用
let timerRef: ReturnType<typeof setTimeout> | null = null;

/**
 * 停止定时器
 */
function stopFocusTimer() {
  if (timerRef) {
    console.log('【停止定时器】');
    clearTimeout(timerRef);
    timerRef = null;
  }
}

/**
 * 启动定时器（整分对齐，链式 setTimeout 防漂移）
 * @param elapsedMinutes 已用分钟数
 */
function startElapsedTimer(elapsedMinutes: number) {
  stopFocusTimer(); // 先停止旧定时器

  const rstore = useRecordStore.getState();
  const pstore = usePlanStore.getState();
  let record_id = rstore.record_id;

  console.log('当前屏蔽时长：', elapsedMinutes);

  const schedule = () => {
    // 用获取分钟的方法，计算到下一个整分的秒数
    const now = new Date();
    const remain = 60 - now.getSeconds();
    // console.log('【剩余时间】', remain);
    if (elapsedMinutes > 0) {
      rstore.updateActualMins(record_id, elapsedMinutes);
    }
    timerRef = setTimeout(() => {
      elapsedMinutes += 1;
      pstore.setCurPlanMinute(elapsedMinutes);
      schedule();
    }, remain * 1000);
  };

  schedule();
}

/**
 * 同步 iOS 专注状态
 */
async function syncIOSStatus() {
  if (Platform.OS !== 'ios') return;

  try {
    const status = await getFocusStatus();
    console.log('【当前屏蔽状态】', status);

    const pstore = usePlanStore.getState();
    const rstore = useRecordStore.getState();

    if (status.active) {
      // 同步 record_id（优先使用 iOS 的）
      if (status.record_id !== rstore.record_id) {
        rstore.setRecordId(status.record_id || '');
      }
      pstore.setCurPlanMinute(status.elapsedMinutes || 0);
      startElapsedTimer(status.elapsedMinutes || 0);
      if (!pstore.active_plan) {
        // 确保数据已初始化后再调用 resetPlan
        const cus_plans = pstore.cus_plans;
        const once_plans = pstore.once_plans;
        if (Array.isArray(cus_plans) && Array.isArray(once_plans)) {
          pstore.resetPlan();
        }
      }
      if (pstore.active_plan?.id === status.plan_id) {
        pstore.pauseCurPlan(status.paused || false);
      }
    } else if (pstore.active_plan) {
      console.log('【专注同步错误】');
    } else {
      // 专注已结束，停止定时器
      stopFocusTimer();
      rstore.removeRecordId();
      pstore.setCurPlanMinute(0);
      // 确保数据已初始化后再调用 resetPlan
      const cus_plans = pstore.cus_plans;
      const once_plans = pstore.once_plans;
      if (Array.isArray(cus_plans) && Array.isArray(once_plans)) {
        pstore.resetPlan();
      }
    }
  } catch (error) {
    console.error('【同步iOS状态失败】', error);
  }
}

/**
 * 处理专注状态变化事件
 * @param payload 专注状态事件
 */
function handleFocusStateChange(payload: FocusStateEvent) {
  console.log('【监听状态变化】', payload);

  const pstore = usePlanStore.getState();

  if (payload?.state === 'started') {
    pstore.setCurPlanMinute(0);
    pstore.resetPlan();
  } else if (payload?.state === 'paused') {
    // 暂停时停止定时器
    stopFocusTimer();
    pstore.pauseCurPlan(true);
  } else if (payload?.state === 'resumed') {
    // 恢复时重启定时器
    stopFocusTimer(); // 先停止旧定时器
    pstore.pauseCurPlan(false);
    // 重新同步状态并启动定时器
    syncIOSStatus();
  } else if (payload?.state === 'failed') {
    stopFocusTimer();
    // 清理本地的一次性任务
    if (pstore.active_plan?.repeat === 'once') {
      pstore.rmOncePlan(pstore.active_plan.id);
    } else {
      pstore.addExitPlanIds(pstore.active_plan.id);
    }
    pstore.exitPlan();
    if (payload.reason === 'user_exit') {
      console.log('【手动停止任务】');
    }
  } else if (payload?.state === 'ended') {
    stopFocusTimer();
    // 正常完成
    pstore.complatePlan();
  }
}

/**
 * 初始化 iOS 专注状态同步
 * 设置事件监听器、AppState 监听器，并执行首次状态同步
 * @returns 清理函数，用于移除所有监听器和停止定时器
 */
export function setupIOSFocusSync(): () => void {
  if (Platform.OS !== 'ios') {
    // 非 iOS 平台返回空清理函数
    return () => {};
  }

  // 创建专注状态监听器
  const focusStateSubscription = createFocusStateListener(
    handleFocusStateChange,
  );

  // 创建 Extension 日志监听器
  const extensionLogSubscription = createExtensionLogListener(
    (event: ExtensionLogEvent) => {
      event.logs.forEach(log => {
        const timestamp = new Date(log.timestamp * 1000).toLocaleString();
        const level = log.level.toUpperCase();
        console.log(
          `[IOS扩展 ${level}] [${timestamp}]`,
          log.message,
          log.data || '',
        );
      });
    },
  );

  // 创建 AppState 监听器
  const appStateSubscription = AppState.addEventListener('change', state => {
    if (state === 'active') {
      syncIOSStatus();
    }
  });

  // 首次同步状态（仅 iOS 执行）
  syncIOSStatus();

  // 返回清理函数
  return () => {
    focusStateSubscription.remove();
    extensionLogSubscription.remove();
    appStateSubscription?.remove?.();
    stopFocusTimer();
  };
}

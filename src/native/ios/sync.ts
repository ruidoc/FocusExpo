/**
 * iOS 专注状态同步管理器
 * 封装所有与 iOS 专注状态相关的同步逻辑、事件监听和定时器管理
 */

import {
  useBenefitStore,
  usePlanStore,
  useRecordStore,
  useUserStore,
} from '@/stores';
import { AppState, Platform } from 'react-native';
import type { ExtensionLogEvent, FocusStateEvent } from '../type';
import { createExtensionLogListener, createFocusStateListener } from './events';
import { getFocusStatus } from './methods';

function cleanupLocalFocusState() {
  const pstore = usePlanStore.getState();
  const rstore = useRecordStore.getState();
  const nativeFocus = pstore.native_focus;

  stopFocusTimer();

  if (
    pstore.active_plan?.repeat === 'once' ||
    nativeFocus.focus_type === 'once'
  ) {
    const oncePlanId = pstore.active_plan?.id || nativeFocus.plan_id;
    if (oncePlanId) {
      pstore.rmOncePlan(oncePlanId);
    }
  } else if (pstore.active_plan || nativeFocus.plan_id) {
    const activePlanId = pstore.active_plan?.id || nativeFocus.plan_id;
    if (activePlanId) {
      pstore.addExitPlanIds(activePlanId);
    }
  }

  pstore.clearNativeFocus();
  pstore.pauseCurPlan(false);
  rstore.removeRecordId();
  pstore.setCurPlanMinute(0);
  pstore.resetPlan();
  rstore.getStatis();
}

function refreshBenefitIfLoggedIn() {
  const { uInfo } = useUserStore.getState();
  if (!uInfo) return;
  useBenefitStore.getState().getBenefit();
}

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
 * 仅更新本地 UI 状态，不发网络请求。时长上报由 Native/Extension 层在关键时刻处理。
 * @param elapsedMinutes 已用分钟数
 */
function startElapsedTimer(elapsedMinutes: number) {
  stopFocusTimer();

  const pstore = usePlanStore.getState();

  console.log('当前屏蔽时长：', elapsedMinutes);

  const schedule = () => {
    const now = new Date();
    const remain = 60 - now.getSeconds();
    timerRef = setTimeout(() => {
      elapsedMinutes += 1;
      pstore.setCurPlanMinute(elapsedMinutes);
      schedule();
    }, remain * 1000);
  };

  schedule();
}

let isSyncing = false;

/**
 * 同步 iOS 专注状态（串行化：并发调用时跳过，下次触发时获取最新状态）
 */
async function syncIOSStatus() {
  if (Platform.OS !== 'ios') return;
  if (isSyncing) return;

  isSyncing = true;
  try {
    const status = await getFocusStatus();
    console.log('【当前屏蔽状态】', status);

    const pstore = usePlanStore.getState();
    const rstore = useRecordStore.getState();
    pstore.setNativeFocus(status);

    if (status.active) {
      // 同步 record_id（优先使用 iOS 的）
      if (status.record_id !== rstore.record_id) {
        rstore.setRecordId(status.record_id || '');
      }
      pstore.setCurPlanMinute(status.actual_mins || 0);
      startElapsedTimer(status.actual_mins || 0);
      if (status.plan_id) {
        pstore.syncActivePlanWithNative(status.plan_id);
      }
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
      // 前台兜底：静默同步一次 actual_mins 到后端
      if (status.record_id && status.actual_mins > 0) {
        rstore.updateActualMins(status.record_id, status.actual_mins);
      }
    } else if (status.failed) {
      cleanupLocalFocusState();
    } else if (pstore.active_plan) {
      console.log('【专注同步纠正】iOS 无任务，清理本地状态');
      cleanupLocalFocusState();
    } else {
      // 专注已结束，停止定时器
      stopFocusTimer();
      pstore.clearNativeFocus();
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
  } finally {
    isSyncing = false;
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
    syncIOSStatus();
  } else if (payload?.state === 'paused') {
    // 暂停时停止定时器
    stopFocusTimer();
    syncIOSStatus();
  } else if (payload?.state === 'resumed') {
    // 恢复时重启定时器
    stopFocusTimer(); // 先停止旧定时器
    syncIOSStatus();
  } else if (payload?.state === 'failed') {
    stopFocusTimer();
    pstore.clearNativeFocus();
    pstore.exitPlan();
    if (payload.reason === 'user_exit') {
      console.log('【手动停止任务】');
    }
  } else if (payload?.state === 'ended') {
    stopFocusTimer();
    pstore.clearNativeFocus();
    // 正常完成（complatePlan 内部已调用 getBenefit 同步 today_used）
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
      refreshBenefitIfLoggedIn();
      syncIOSStatus();
    }
  });

  // 首次同步状态（仅 iOS 执行）
  refreshBenefitIfLoggedIn();
  syncIOSStatus();

  // 返回清理函数
  return () => {
    focusStateSubscription.remove();
    extensionLogSubscription.remove();
    appStateSubscription?.remove?.();
    stopFocusTimer();
  };
}

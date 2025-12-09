/**
 * 应用初始化工具
 * 处理应用启动时的数据恢复和初始化逻辑
 */

import { useAppStore, usePlanStore } from '@/stores';
import { storage } from './storage';

/**
 * 初始化应用数据
 * 从本地存储恢复计划数据，并获取 iOS 应用列表
 */
export async function initAppData(): Promise<void> {
  const astore = useAppStore.getState();
  const pstore = usePlanStore.getState();

  // 获取 iOS 应用列表
  await astore.getIosApps();

  // 从存储中恢复计划数据
  const once_plans = storage.getString('once_plans');
  const cus_plans = storage.getString('cus_plans');
  const exit_plan_ids = storage.getString('exit_plan_ids');
  const paused_plan_id = storage.getString('paused_plan_id');

  if (once_plans) {
    pstore.setOncePlans(JSON.parse(once_plans));
  }
  if (cus_plans) {
    pstore.setCusPlans(JSON.parse(cus_plans));
  }
  if (exit_plan_ids) {
    pstore.setExitPlanIds(exit_plan_ids.split(','));
  }
  if (paused_plan_id) {
    pstore.setPaused(paused_plan_id);
  }
}

/**
 * 应用初始化工具
 * 处理应用启动时的数据恢复和初始化逻辑
 */

import {
  useAppStore,
  useDebugStore,
  useHomeStore,
  usePlanStore,
  useUserStore,
} from '@/stores';
import { storage } from './storage';

/**
 * 初始化应用数据
 * 从本地存储恢复计划数据，并获取 iOS 应用列表
 */
export async function initAppData(): Promise<void> {
  console.log('[AppInit] 开始初始化应用数据...');

  const astore = useAppStore.getState();
  const pstore = usePlanStore.getState();
  const ustore = useUserStore.getState();
  const dstore = useDebugStore.getState();

  // 初始化用户状态（恢复本地登录状态 + identify）
  console.log('[AppInit] 初始化用户状态...');
  const isLoggedIn = await ustore.init();

  // 先从本地恢复计划，避免异步远程同步后又被旧缓存覆盖。
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

  // 已登录：同步远程数据（验证 token + 拉取业务数据，不阻塞后续初始化）
  if (isLoggedIn) {
    console.log('[AppInit] 同步远程数据...');
    ustore.syncRemoteData();
  }

  // 获取 iOS 应用列表
  console.log('[AppInit] 获取 iOS 应用列表...');
  astore.initIosSelectedApps();
  await astore.getIosApps();

  // 初始化 debug store
  dstore.init();

  // 初始化主题（从 AsyncStorage 恢复主题偏好 + 监听系统主题变化）
  const hstore = useHomeStore.getState();
  hstore.init();
}

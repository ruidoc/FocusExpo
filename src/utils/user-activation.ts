/**
 * 用户激活状态追踪工具
 * 用于判断用户当前处于激活流程的哪个阶段
 */

import { storage } from './storage';

/**
 * 用户激活状态的Storage Keys
 */
export const USER_ACTIVATION_KEYS = {
  FOCUS_COUNT: 'focus_count', // 完成的专注次数
  HAS_CREATED_PLAN: 'has_created_plan', // 是否创建过周期计划
  ONBOARDING_COMPLETED: 'onboarding_completed', // 是否完成引导流程
  FIRST_FOCUS_DATE: 'first_focus_date', // 首次专注日期
  SHOW_CELEBRATION: 'show_celebration', // 是否显示过首次完成庆祝
};

/**
 * 用户激活状态类型
 */
export type UserActivationState = {
  isNewUser: boolean; // 全新用户（未完成onboarding）
  isFirstTimeUser: boolean; // 引导完成用户（完成onboarding但0次专注）
  isTrialUser: boolean; // 体验用户（1-2次专注，无计划）
  isActiveUser: boolean; // 活跃用户（有周期计划）
  focusCount: number; // 专注次数
  hasCreatedPlan: boolean; // 是否创建过计划
  onboardingCompleted: boolean; // 是否完成引导
};

/**
 * 获取用户激活状态
 */
export const getUserActivationState = (): UserActivationState => {
  const focusCount = storage.getNumber(USER_ACTIVATION_KEYS.FOCUS_COUNT) || 0;
  const hasCreatedPlan =
    storage.getBoolean(USER_ACTIVATION_KEYS.HAS_CREATED_PLAN) || false;
  const onboardingCompleted =
    storage.getBoolean(USER_ACTIVATION_KEYS.ONBOARDING_COMPLETED) || false;

  // 判断用户类型
  const isNewUser = !onboardingCompleted;
  const isFirstTimeUser = onboardingCompleted && focusCount === 0;
  const isTrialUser =
    onboardingCompleted &&
    focusCount >= 1 &&
    focusCount <= 2 &&
    !hasCreatedPlan;
  const isActiveUser = hasCreatedPlan;

  return {
    isNewUser,
    isFirstTimeUser,
    isTrialUser,
    isActiveUser,
    focusCount,
    hasCreatedPlan,
    onboardingCompleted,
  };
};

/**
 * 标记Onboarding完成
 */
export const markOnboardingCompleted = () => {
  storage.set(USER_ACTIVATION_KEYS.ONBOARDING_COMPLETED, true);
  console.log('[UserActivation] Onboarding completed');
};

/**
 * 增加专注次数
 */
export const incrementFocusCount = () => {
  const count = storage.getNumber(USER_ACTIVATION_KEYS.FOCUS_COUNT) || 0;
  const newCount = count + 1;
  storage.set(USER_ACTIVATION_KEYS.FOCUS_COUNT, newCount);

  // 记录首次专注日期
  if (count === 0) {
    storage.set(
      USER_ACTIVATION_KEYS.FIRST_FOCUS_DATE,
      new Date().toISOString(),
    );
  }

  console.log(`[UserActivation] Focus count: ${count} → ${newCount}`);
  return newCount;
};

/**
 * 标记已创建计划
 */
export const markPlanCreated = () => {
  storage.set(USER_ACTIVATION_KEYS.HAS_CREATED_PLAN, true);
  console.log('[UserActivation] Plan created');
};

/**
 * 检查是否应该显示首次完成庆祝弹窗
 */
export const shouldShowCelebration = (): boolean => {
  const focusCount = storage.getNumber(USER_ACTIVATION_KEYS.FOCUS_COUNT) || 0;
  const hasShown =
    storage.getBoolean(USER_ACTIVATION_KEYS.SHOW_CELEBRATION) || false;

  // 只在首次完成专注时显示，且之前未显示过
  return focusCount === 1 && !hasShown;
};

/**
 * 标记已显示庆祝弹窗
 */
export const markCelebrationShown = () => {
  storage.set(USER_ACTIVATION_KEYS.SHOW_CELEBRATION, true);
  console.log('[UserActivation] Celebration modal shown');
};

/**
 * 获取用户激活天数（从首次专注开始）
 */
export const getActivationDays = (): number => {
  const firstFocusDate = storage.getString(
    USER_ACTIVATION_KEYS.FIRST_FOCUS_DATE,
  );
  if (!firstFocusDate) return 0;

  const now = new Date();
  const first = new Date(firstFocusDate);
  const diffTime = Math.abs(now.getTime() - first.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

/**
 * 重置用户激活状态（仅用于测试）
 */
export const resetUserActivation = () => {
  storage.delete(USER_ACTIVATION_KEYS.FOCUS_COUNT);
  storage.delete(USER_ACTIVATION_KEYS.HAS_CREATED_PLAN);
  storage.delete(USER_ACTIVATION_KEYS.ONBOARDING_COMPLETED);
  storage.delete(USER_ACTIVATION_KEYS.FIRST_FOCUS_DATE);
  storage.delete(USER_ACTIVATION_KEYS.SHOW_CELEBRATION);
  console.log('[UserActivation] State reset');
};

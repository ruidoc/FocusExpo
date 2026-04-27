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
  QUICK_START_HINT_DISMISSED: 'quick_start_hint_dismissed', // 是否关闭过快速专注提示
};

type OnboardingProblem = 'video' | 'game' | 'study' | 'other';

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
 * 仅在第一次真正完成专注（非 onboarding）且未显示过时返回 true
 */
export const shouldShowCelebration = (): boolean => {
  const hasShown =
    storage.getBoolean(USER_ACTIVATION_KEYS.SHOW_CELEBRATION) || false;
  const focusCount =
    storage.getNumber(USER_ACTIVATION_KEYS.FOCUS_COUNT) || 0;

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
 * 关闭快速专注引导提示
 */
export const dismissQuickStartHint = () => {
  storage.set(USER_ACTIVATION_KEYS.QUICK_START_HINT_DISMISSED, true);
};

/**
 * 是否已关闭快速专注引导提示
 */
export const isQuickStartHintDismissed = (): boolean => {
  return (
    storage.getBoolean(USER_ACTIVATION_KEYS.QUICK_START_HINT_DISMISSED) || false
  );
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
  storage.delete(USER_ACTIVATION_KEYS.QUICK_START_HINT_DISMISSED);
  clearOnboardingTargetPendingState();
  clearOnboardingOptionalTargetState();
  console.log('[UserActivation] State reset');
};

/**
 * 登录后但尚未创建首个自动契约时，用于冷启动回到 target 引导。
 */
const ONBOARDING_TARGET_PENDING_KEY = 'onboarding_target_pending_state';
const ONBOARDING_OPTIONAL_TARGET_KEY = 'onboarding_optional_target_state';
const MAX_TARGET_PENDING_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 天

export type OnboardingTargetPendingState = {
  problem: OnboardingProblem;
  updated_at: number;
};

export type OnboardingOptionalTargetState = {
  problem: OnboardingProblem;
  completed_tasks: string;
  updated_at: number;
};

function isValidOnboardingTargetPendingState(
  data: OnboardingTargetPendingState | undefined,
): data is OnboardingTargetPendingState {
  if (!data) return false;
  if (
    data.problem !== 'video' &&
    data.problem !== 'game' &&
    data.problem !== 'study' &&
    data.problem !== 'other'
  ) {
    return false;
  }
  if (typeof data.updated_at !== 'number') return false;
  if (Date.now() - data.updated_at > MAX_TARGET_PENDING_AGE_MS) return false;
  return true;
}

export const setOnboardingTargetPendingState = (problem: OnboardingProblem) => {
  storage.setObject(ONBOARDING_TARGET_PENDING_KEY, {
    problem,
    updated_at: Date.now(),
  });
};

export const getOnboardingTargetPendingState = ():
  | OnboardingTargetPendingState
  | undefined => {
  const data = storage.getObject<OnboardingTargetPendingState>(
    ONBOARDING_TARGET_PENDING_KEY,
  );
  if (!isValidOnboardingTargetPendingState(data)) {
    clearOnboardingTargetPendingState();
    return undefined;
  }
  return data;
};

export const clearOnboardingTargetPendingState = () => {
  storage.delete(ONBOARDING_TARGET_PENDING_KEY);
};

function isValidOnboardingOptionalTargetState(
  data: OnboardingOptionalTargetState | undefined,
): data is OnboardingOptionalTargetState {
  if (!data) return false;
  if (
    data.problem !== 'video' &&
    data.problem !== 'game' &&
    data.problem !== 'study' &&
    data.problem !== 'other'
  ) {
    return false;
  }
  if (!data.completed_tasks) return false;
  if (typeof data.updated_at !== 'number') return false;
  if (Date.now() - data.updated_at > MAX_TARGET_PENDING_AGE_MS) return false;
  return true;
}

export const setOnboardingOptionalTargetState = (input: {
  problem: OnboardingProblem;
  completedTasks: string;
}) => {
  storage.setObject(ONBOARDING_OPTIONAL_TARGET_KEY, {
    problem: input.problem,
    completed_tasks: input.completedTasks,
    updated_at: Date.now(),
  });
};

export const getOnboardingOptionalTargetState = ():
  | OnboardingOptionalTargetState
  | undefined => {
  const data = storage.getObject<OnboardingOptionalTargetState>(
    ONBOARDING_OPTIONAL_TARGET_KEY,
  );
  if (!isValidOnboardingOptionalTargetState(data)) {
    clearOnboardingOptionalTargetState();
    return undefined;
  }
  return data;
};

export const clearOnboardingOptionalTargetState = () => {
  storage.delete(ONBOARDING_OPTIONAL_TARGET_KEY);
};

/**
 * Onboarding 第3步恢复状态（用于杀进程后恢复到 QuickExperience）
 */
const ONBOARDING_RECOVERY_KEY = 'onboarding_recovery_state';
const MAX_RECOVERY_AGE_MS = 12 * 60 * 60 * 1000; // 12 小时

export type OnboardingRecoveryState = {
  step: 3;
  phase: 'active';
  once_plan_id: string;
  end_at: number;
  started_at: number;
  updated_at: number;
};

function isValidOnboardingRecoveryState(
  data: OnboardingRecoveryState | undefined,
): data is OnboardingRecoveryState {
  if (!data) return false;
  if (data.step !== 3 || data.phase !== 'active') return false;
  if (!data.once_plan_id) return false;
  if (typeof data.end_at !== 'number' || typeof data.started_at !== 'number') {
    return false;
  }
  if (typeof data.updated_at !== 'number') return false;
  if (Date.now() - data.updated_at > MAX_RECOVERY_AGE_MS) return false;
  return true;
}

export const setOnboardingQuickExperienceRecovery = (input: {
  oncePlanId: string;
  endAt: number;
  startedAt: number;
}) => {
  const payload: OnboardingRecoveryState = {
    step: 3,
    phase: 'active',
    once_plan_id: input.oncePlanId,
    end_at: input.endAt,
    started_at: input.startedAt,
    updated_at: Date.now(),
  };
  storage.setObject(ONBOARDING_RECOVERY_KEY, payload);
};

export const getOnboardingRecoveryState = (): OnboardingRecoveryState | undefined => {
  const data = storage.getObject<OnboardingRecoveryState>(ONBOARDING_RECOVERY_KEY);
  if (!isValidOnboardingRecoveryState(data)) {
    clearOnboardingRecoveryState();
    return undefined;
  }
  return data;
};

export const clearOnboardingRecoveryState = () => {
  storage.delete(ONBOARDING_RECOVERY_KEY);
};

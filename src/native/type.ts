// NativeModule 类型定义
// 基于 ios/NativeModuleBridge.m 和 ios/NativeModule.swift

import { NativeEventEmitter } from 'react-native';

/**
 * 屏幕时间权限状态
 */
export type ScreenTimePermissionStatus =
  | 'approved'
  | 'denied'
  | 'notDetermined'
  | 'unknown';

/**
 * 应用详情
 */
export interface AppDetail {
  id: string;
  name: string;
  type: 'application' | 'webDomain' | 'category';
  tokenData: string; // Base64编码的原生token数据
  stableId: string; // 兼容旧字段
}

/**
 * 应用选择结果
 */
export interface AppSelectionResult {
  success: boolean;
  apps?: AppDetail[];
  selectionToken?: string; // Base64编码的 FamilyActivitySelection 数据
}

/**
 * 专注状态信息
 */
export interface FocusStatus {
  active: boolean;
  failed?: boolean;
  paused?: boolean;
  plan_id?: string | null;
  record_id?: string | null;
  startAt?: number;
  endAt?: number;
  totalMinutes?: number;
  elapsedMinutes?: number;
  focusType?: 'once' | 'periodic' | null;
  pausedUntil?: number | null; // 暂停结束时间戳（仅用于 JS 端倒计时显示）
}

/**
 * 计划配置（用于 updatePlan）
 */
export interface PlanConfig {
  id: string;
  name?: string | null;
  start: number; // 分钟数
  end: number; // 分钟数
  days: number[]; // 0=周日, 1=周一, ..., 6=周六
  apps: string[]; // 应用 ID 数组
}

/**
 * 专注状态事件
 */
export interface FocusStateEvent {
  state: 'started' | 'paused' | 'resumed' | 'ended' | 'failed';
  reason?: string; // 失败原因，如 'user_exit'
  [key: string]: any;
}

/**
 * Extension 日志条目
 */
export interface ExtensionLogEntry {
  level: 'log' | 'warn' | 'error';
  message: string;
  timestamp: number;
  data?: Record<string, any>;
}

/**
 * Extension 日志事件
 */
export interface ExtensionLogEvent {
  logs: ExtensionLogEntry[];
}

/**
 * NativeModule 接口定义
 */
export interface NativeModuleInterface {
  // 请求屏幕使用时间权限
  requestScreenTimePermission(): Promise<boolean>;

  // 检查屏幕使用时间权限状态
  checkScreenTimePermission(): Promise<ScreenTimePermissionStatus>;

  // 选择APP并返回列表
  selectAppsToLimit(
    maxCount: number,
    apps: string | null,
  ): Promise<AppSelectionResult>;

  // 开始应用限制（仅一次性任务屏蔽）
  startAppLimits(
    durationMinutes: number,
    planId: string | null,
  ): Promise<boolean>;

  // 停止应用限制（通用）
  stopAppLimits(): Promise<boolean>;

  // 暂停应用限制（通用）
  pauseAppLimits(durationMinutes?: number | null): Promise<boolean>;

  // 恢复应用限制（通用）
  resumeAppLimits(): Promise<boolean>;

  // 获取专注状态，返回当前屏蔽信息
  getFocusStatus(): Promise<FocusStatus>;

  // 增量更新单个计划
  updatePlan(planJSON: string): Promise<boolean>;

  // 删除单个计划
  deletePlan(planId: string): Promise<boolean>;

  // 事件发射器
  addListener(eventType: string): void;
  removeListeners(count: number): void;
}

/**
 * 扩展 NativeModules 类型
 */
declare module 'react-native' {
  interface NativeModulesStatic {
    NativeModule: NativeModuleInterface;
  }
}

/**
 * NativeModule 事件发射器
 * 继承自 RCTEventEmitter，支持以下事件：
 * - 'focus-state': 专注状态变化事件
 * - 'extension-log': Extension 日志事件
 */
export interface NativeModuleEventEmitter extends NativeEventEmitter {
  addListener(
    eventType: 'focus-state',
    listener: (event: FocusStateEvent) => void,
  ): any;
  addListener(
    eventType: 'extension-log',
    listener: (event: ExtensionLogEvent) => void,
  ): any;
  removeListener(
    eventType: 'focus-state',
    listener: (event: FocusStateEvent) => void,
  ): void;
  removeListener(
    eventType: 'extension-log',
    listener: (event: ExtensionLogEvent) => void,
  ): void;
  removeAllListeners(eventType?: 'focus-state' | 'extension-log'): void;
}

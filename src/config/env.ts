/**
 * 环境变量配置
 *
 * 统一管理 API 基础 URL，根据构建环境自动切换：
 * - development: https://focus.ruidoc.cn/dev-api
 * - preview:     https://focus.ruidoc.cn/dev-api
 * - production:  https://focus.ruidoc.cn/api
 *
 * 配置方式：在 eas.json 的 env 中设置 EXPO_PUBLIC_API_BASE_URL
 */

/**
 * API 基础 URL
 * 用于业务接口请求
 */

const DEV_BASE_URL = 'https://focus.ruidoc.cn/dev-api';
// const DEV_BASE_URL = 'http://192.168.109.92:8849';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || DEV_BASE_URL;

/**
 * PostHog 代理 URL
 * 基于 API_BASE_URL 拼接 /i 路径
 */
export const POSTHOG_HOST = `${API_BASE_URL}/i`;

/**
 * 当前环境标识
 * development | preview | production
 */
export const APP_VARIANT = process.env.APP_VARIANT || 'development';

/**
 * 是否为生产环境
 */
export const IS_PRODUCTION = APP_VARIANT === 'production';

/**
 * 是否为开发环境
 */
export const IS_DEVELOPMENT = APP_VARIANT === 'development';

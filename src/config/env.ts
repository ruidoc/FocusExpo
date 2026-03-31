export type AppEnv = 'development' | 'preview' | 'production';

/**
 * 当前环境标识，由 eas.json 中 EXPO_PUBLIC_APP_ENV 控制。
 * 本地 expo start 时环境变量不存在，回退为 development。
 */
export const APP_ENV: AppEnv =
  (process.env.EXPO_PUBLIC_APP_ENV as AppEnv) || 'development';

/**
 * API 基础 URL，由 eas.json 中 EXPO_PUBLIC_API_BASE_URL 控制。
 * 本地 expo start 时回退为 dev-api。
 */
const PROD_BASE_URL = 'https://focus.freeshore.cn/api';

const DEV_BASE_URL = 'https://focus.freeshore.cn/dev-api';
// const DEV_BASE_URL = 'http://172.20.10.9:8849';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  (APP_ENV === 'production' ? PROD_BASE_URL : DEV_BASE_URL);

/** PostHog 代理 URL，基于 API_BASE_URL 拼接 */
export const POSTHOG_HOST = `${API_BASE_URL}/i`;

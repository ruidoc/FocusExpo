import { Toast } from '@/components/ui';
import { API_BASE_URL } from '@/config/env';
import { useUserStore } from '@/stores';
import { storage } from '@/utils';
import axios, { AxiosInstance } from 'axios';
import axiosRetry, { exponentialDelay } from 'axios-retry';

const DEFAULT_TIMEOUT = 12000;
const MUTATION_TIMEOUT = 20000;
const DEFAULT_RETRIES = 1; // 只对幂等请求重试 1 次，避免 POST 重复创建
const RETRYABLE_METHODS = new Set(['get', 'head', 'options']);
const MUTATION_METHODS = new Set(['post', 'put', 'patch', 'delete']);
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

const getDuration = (config?: any) => {
  const startedAt = config?.metadata?.startedAt;
  return startedAt ? Date.now() - startedAt : undefined;
};

const instance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    os: 'ios',
  },
});

// 配置 axios-retry 重试机制（默认配置，可在请求时覆盖）
axiosRetry(instance, {
  retries: DEFAULT_RETRIES, // 最大重试次数：0 = 不重试，1 = 重试1次，2 = 重试2次...
  retryDelay: exponentialDelay, // 指数退避延迟策略
  shouldResetTimeout: true, // 每次重试重新计算 12s 超时，避免只剩随机的残余时间
  retryCondition: error => {
    const method = error.config?.method?.toLowerCase();
    if (!method || !RETRYABLE_METHODS.has(method)) return false;

    const status = error.response?.status;
    if (status) return RETRYABLE_STATUS_CODES.has(status);

    return (
      error.code === 'ECONNABORTED' ||
      error.message?.includes('timeout') ||
      error.message === 'Network Error'
    );
  },
  onRetry: (retryCount, error, requestConfig) => {
    const errorMsg = error.message || '网络错误';
    // 获取当前请求配置的重试次数，如果没有则使用默认值
    const retries =
      (requestConfig as any)?.['axios-retry']?.retries ?? DEFAULT_RETRIES;
    console.log(
      `[重试] ${requestConfig?.method?.toUpperCase()} ${requestConfig?.url} 第${retryCount}/${retries}次，错误: ${errorMsg}`,
    );
  },
});

// axios-retry 支持在请求配置中使用 'axios-retry' 选项来覆盖全局配置
// 类型定义已由 axios-retry 提供，无需手动扩展

// 请求拦截器
instance.interceptors.request.use(async request => {
  const method = request.method?.toLowerCase();
  if (
    method &&
    MUTATION_METHODS.has(method) &&
    request.timeout === DEFAULT_TIMEOUT
  ) {
    request.timeout = MUTATION_TIMEOUT;
  }
  (request as any).metadata = { startedAt: Date.now() };

  if (request.data instanceof FormData) {
    request.headers['Content-Type'] = 'multipart/form-data';
  }
  storage.setGroup('http_base_url', API_BASE_URL);
  // console.log('【网络请求】', request.method, request.url);
  request.headers.Authorization = `Bearer ${
    storage.getString('access_token') || ''
  }`;
  // 添加 project-tag header
  request.headers['project-tag'] = 'focusone';
  return request;
});

// 响应拦截器，全局错误处理
// 请求配置中传 silent: true 可静默错误（不弹 Toast），用于后台自动请求
instance.interceptors.response.use(
  response => {
    const duration = getDuration(response.config);
    if (duration && duration > 5000) {
      console.log(
        `【慢请求】 ${response.config.method?.toUpperCase()} ${response.config.url} ${duration}ms`,
      );
    }
    return response.data;
  },
  error => {
    const silent = (error.config as any)?.silent === true;
    const duration = getDuration(error.config);
    const method = error.config?.method?.toUpperCase();
    const url = error.config?.url;
    if (error.response) {
      let response = error.response;
      console.log('【请求错误】', {
        method,
        url,
        duration,
        status: response.status,
        data: response.data,
      });
      if (response.status === 401) {
        // 只有当失败请求携带的 token 与当前存储一致时才清除，
        // 防止登录后旧请求的 401 误删新 token
        const reqToken = error.config?.headers?.Authorization;
        const curToken = storage.getString('access_token');
        if (!curToken || `Bearer ${curToken}` === reqToken) {
          storage.delete('access_token');
          storage.delete('user_info');
          useUserStore.setState({ uInfo: null });
        }
      } else if (!silent) {
        Toast(response.data.message);
      }
    } else {
      console.log('【网络错误】', {
        method,
        url,
        duration,
        code: error.code,
        message: error.message,
      });
      if (!silent) {
        Toast('网络连接失败');
      }
    }
    return Promise.reject(error);
  },
);

export default instance;

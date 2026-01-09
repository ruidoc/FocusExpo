import { Toast } from '@/components/ui';
import { useUserStore } from '@/stores';
import { storage } from '@/utils';
import axios, { AxiosInstance } from 'axios';
import axiosRetry, { exponentialDelay } from 'axios-retry';

const baseURL = 'https://focus.ruidoc.cn/dev-api';
// const baseURL = 'http://192.168.0.4:8849';

const instance: AxiosInstance = axios.create({
  baseURL,
  timeout: 6000,
  headers: {
    'Content-Type': 'application/json',
    os: 'ios',
  },
});

// 配置 axios-retry 重试机制（默认配置，可在请求时覆盖）
const DEFAULT_RETRIES = 0; // 默认最大重试次数（不包括首次请求，所以总共会尝试 1 次）

axiosRetry(instance, {
  retries: DEFAULT_RETRIES, // 最大重试次数：0 = 不重试，1 = 重试1次，2 = 重试2次...
  retryDelay: exponentialDelay, // 指数退避延迟策略
  retryCondition: error => {
    // 重试条件
    if (!error.response || error.response.status !== 200) {
      return true;
    }
    return false;
  },
  onRetry: (retryCount, error, requestConfig) => {
    const errorMsg = error.message || '网络错误';
    // 获取当前请求配置的重试次数，如果没有则使用默认值
    const retries =
      (requestConfig as any)?.['axios-retry']?.retries ?? DEFAULT_RETRIES;
    console.log(`[重试] 第${retryCount}/${retries}次重试，错误: ${errorMsg}`);
  },
});

// axios-retry 支持在请求配置中使用 'axios-retry' 选项来覆盖全局配置
// 类型定义已由 axios-retry 提供，无需手动扩展

// 请求拦截器
instance.interceptors.request.use(async request => {
  if (request.data instanceof FormData) {
    request.headers['Content-Type'] = 'multipart/form-data';
  }
  storage.setGroup('http_base_url', baseURL);
  // console.log('【网络请求】', request.method, request.url);
  request.headers.Authorization = `Bearer ${
    storage.getString('access_token') || ''
  }`;
  // 添加 project-tag header
  request.headers['project-tag'] = 'focusone';
  return request;
});

// 响应拦截器，全局错误处理
instance.interceptors.response.use(
  response => {
    // console.log('【响应结果】', response.data);
    return response.data;
  },
  error => {
    if (error.response) {
      let response = error.response;
      console.log('【请求错误】', response.status, response.data);
      if (response.status === 401) {
        Toast({ position: 'bottom', message: '登录已过期，请重新登录' });
        storage.delete('access_token');
        storage.delete('user_info');
        useUserStore.setState({ uInfo: null });
      } else {
        // console.log('错误信息：', response.data);
        Toast(response.data.message);
      }
    } else {
      Toast(error.message);
    }
    return Promise.reject(error);
  },
);

export default instance;

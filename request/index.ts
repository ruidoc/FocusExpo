import { UserStore } from '@/stores';
import { Toast } from '@fruits-chain/react-native-xiaoshu';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance } from 'axios';

const instance: AxiosInstance = axios.create({
  // baseURL: 'https://focusone.ruidoc.cn/dev-api',
  baseURL: 'http://192.168.0.6:8849',
  // baseURL: 'http://192.168.0.5:8849',
  timeout: 6000,
  headers: {
    'Content-Type': 'application/json',
    os: 'android',
  },
});

// 请求拦截器
instance.interceptors.request.use(async request => {
  if (request.data instanceof FormData) {
    request.headers['Content-Type'] = 'multipart/form-data';
  }
  console.log('【网络请求】', request.method, request.url);
  request.headers.Authorization = `Bearer ${
    (await AsyncStorage.getItem('access_token')) || ''
  }`;
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
        AsyncStorage.removeItem('access_token');
        AsyncStorage.removeItem('user_info');
        UserStore.setUinfo(null);
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

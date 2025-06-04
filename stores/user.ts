import http from '@/request';
import { Toast } from '@fruits-chain/react-native-xiaoshu';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeAutoObservable } from 'mobx';

import HomeStore from './home';
import AppStore from './osapp';
import PlanStore from './plan';

class UserStore {
  constructor() {
    makeAutoObservable(this);
  }

  uInfo: UserInfo = null;
  wxInfo: any = null;

  setUinfo = (info: UserInfo) => {
    this.uInfo = info;
  };
  setWxInfo = (info: any) => {
    this.wxInfo = info;
  };

  login = async (
    form: Record<string, string>,
    fun?: (data?: HttpRes) => void,
  ) => {
    try {
      let res: any;
      if (form.token) {
        res = form;
      } else {
        res = await http.post('/user/login', form);
      }
      if (res.statusCode === 200) {
        await AsyncStorage.setItem('access_token', res.token);
        HomeStore.loadApps();
        AppStore.getCurapp();
        PlanStore.getPlans();
        this.getInfo();
        // setTimeout(() => {
        //   HomeStore.startVpn();
        // }, 1000);
        fun(res);
      } else {
        Toast(res.message);
        fun();
      }
      // console.log('结果：', res);
    } catch (error) {
      console.log(error);
      fun();
    }
  };

  register = async (
    form: Record<string, string>,
    fun?: (data?: HttpRes) => void,
  ) => {
    try {
      let res: HttpRes = await http.post('/user/register', form);
      if (res.statusCode === 200) {
        let { phone, password } = form;
        this.login({ phone, password }, fun);
      } else {
        Toast(res.message);
        fun();
      }
      console.log('注册结果：', res);
    } catch (error) {
      console.log(error);
      fun();
    }
  };

  getInfo = async () => {
    try {
      let res: HttpRes = await http.get('/user/info/self');
      if (res.statusCode === 200) {
        this.setUinfo(res.data as UserInfo);
        AsyncStorage.setItem('user_info', JSON.stringify(res.data));
      }
    } catch (error) {
      console.log(error);
    }
  };

  logout = () => {
    AsyncStorage.removeItem('user_info');
    AsyncStorage.removeItem('access_token');
    AppStore.setFocusApps([]);
    AppStore.setShieldApps([]);
    PlanStore.clearPlans();
    HomeStore.stopVpn();
    this.setUinfo(null);
  };
}

const store = new UserStore();

export default store;

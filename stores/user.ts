import { storage } from '@/utils';
import http from '@/utils/request';
import { Toast } from '@fruits-chain/react-native-xiaoshu';
import { makeAutoObservable } from 'mobx';
import { AppStore, BenefitStore, HomeStore, PlanStore, RecordStore } from '.';

class UserStore {
  constructor() {
    makeAutoObservable(this);
    // 在构造函数中初始化，恢复登录状态
    this.init();
  }

  uInfo: UserInfo = null;
  wxInfo: any = null;

  setUinfo = (info: UserInfo) => {
    this.uInfo = info;
  };
  setWxInfo = (info: any) => {
    this.wxInfo = info;
  };

  // 初始化方法：从AsyncStorage恢复登录状态
  init = async () => {
    try {
      const token = storage.getString('access_token');
      const userInfoStr = storage.getString('user_info');

      if (token && userInfoStr) {
        // 如果有token和用户信息，尝试恢复状态
        const userInfo = JSON.parse(userInfoStr);
        this.setUinfo(userInfo);
        // 验证token是否仍然有效
        try {
          await this.getInfo();
          PlanStore.getPlans();
          BenefitStore.getBenefit();
          RecordStore.getStatis();
        } catch (error) {
          // 如果获取用户信息失败，说明token已过期，清除本地数据
          console.log('Token验证失败，重新登录', error);
          this.logout();
        }
      }
    } catch (error) {
      console.log('初始化用户状态失败:', error);
    }
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
        storage.set('access_token', res.token);
        storage.setGroup('access_token', res.token);
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
        storage.set('user_info', JSON.stringify(res.data));
      }
    } catch (error) {
      console.log(error);
    }
  };

  logout = () => {
    storage.delete('user_info');
    storage.delete('access_token');
    AppStore.setFocusApps([]);
    AppStore.setShieldApps([]);
    PlanStore.clearPlans();
    HomeStore.stopVpn();
    this.setUinfo(null);
  };
}

const store = new UserStore();

export default store;

import { makeAutoObservable } from 'mobx';
import http from '@/request';
import { Toast } from '@fruits-chain/react-native-xiaoshu';
import { NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HomeStore } from './index';

const { NativeClass } = NativeModules;

class AppStore {
  constructor() {
    makeAutoObservable(this);
  }

  focus_apps: string[] = []; // 专注APP包名
  shield_apps: string[] = []; // 屏蔽APP包名

  setFocusApps = (apps: string[]) => {
    this.focus_apps = apps;
    NativeClass.updateFocusApps(JSON.stringify(apps));
    AsyncStorage.setItem('focus_apps', JSON.stringify(apps));
  };

  setShieldApps = (apps: string[]) => {
    this.shield_apps = apps;
    NativeClass.updateShieldApps(JSON.stringify(apps));
    AsyncStorage.setItem('shield_apps', JSON.stringify(apps));
  };

  addApps = async (form: Record<string, any>) => {
    try {
      let res: HttpRes = await http.post('/osapp/add', form);
      if (res.statusCode !== 200) {
        Toast(res.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  getCurapp = async () => {
    try {
      let res: HttpRes = await http.get('/osapp/info');
      if (res.statusCode === 200) {
        if (res.data) {
          let { focus_apps, shield_apps } = res.data;
          this.setFocusApps(focus_apps.map((r: string) => r.split(':')[0]));
          this.setShieldApps(shield_apps.map((r: string) => r.split(':')[0]));
        } else {
          console.log('暂无app数据');
          this.addApps({ focus_apps: [], shield_apps: [] });
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  updateApps = async (
    body: Record<string, any>,
    fun?: (data?: HttpRes) => void,
  ) => {
    try {
      let form = { ...body };
      if (form.focus_apps) {
        form.focus_apps = this.getAppInfo(form.focus_apps);
      } else {
        form.shield_apps = this.getAppInfo(form.shield_apps);
      }
      let res: HttpRes = await http.post('/osapp/update/', form);
      if (res.statusCode === 200) {
        if (body.focus_apps) {
          this.setFocusApps(body.focus_apps);
        }
        if (body.shield_apps) {
          this.setShieldApps(body.shield_apps);
        }
        if (fun) fun(res);
      }
    } catch (error) {
      console.log(error);
    }
  };

  getAppInfo = (apps: string[]) =>
    HomeStore.all_apps
      .filter(r => apps.includes(r.packageName))
      .map(app => `${app.packageName}:${app.appName}`);
}

const store = new AppStore();

export default store;

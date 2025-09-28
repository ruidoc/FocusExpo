import http from '@/utils/request';
import { Toast } from '@fruits-chain/react-native-xiaoshu';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeAutoObservable } from 'mobx';
import HomeStore from './home';

class AppStore {
  constructor() {
    makeAutoObservable(this);
  }

  focus_apps: string[] = []; // 专注APP包名
  shield_apps: string[] = []; // 屏蔽APP包名

  // iOS选中的应用apps列表
  ios_selected_apps: any[] = [];
  // iOS所有应用列表
  ios_all_apps: any[] = []; // 所有应用（iOS）

  get ios_stableids() {
    return this.ios_all_apps.map(r => r.stableId);
  }

  setFocusApps = (apps: string[]) => {
    this.focus_apps = apps;
    // NativeClass.updateFocusApps(JSON.stringify(apps));
    AsyncStorage.setItem('focus_apps', JSON.stringify(apps));
  };

  setShieldApps = (apps: string[]) => {
    this.shield_apps = apps;
    // NativeClass.updateShieldApps(JSON.stringify(apps));
    AsyncStorage.setItem('shield_apps', JSON.stringify(apps));
  };

  // 设置iOS选择的应用
  setIosSelectedApps = (apps: any[]) => {
    this.ios_selected_apps = apps;
    console.log('选中的：', apps);
  };

  // 设置iOS选择的应用
  setIosAllApps = (apps: any[]) => {
    this.ios_all_apps = apps;
  };

  addApps = async (form: Record<string, any>) => {
    try {
      let res: HttpRes = await http.post('/osapp/add', form);
      if (res.statusCode == 200) {
      }
    } catch (error) {
      console.log(error);
    }
  };

  // 添加iOS应用
  addIosApps = async (apps: Record<string, any>[]) => {
    try {
      let final_apps = apps.filter(
        r => !this.ios_stableids.includes(r.stableId),
      );
      this.setIosSelectedApps(apps);
      if (final_apps.length === 0) return;
      let res: HttpRes = await http.post('/iosapp/add', final_apps);
      if (res.statusCode == 200) {
        this.setIosAllApps([...this.ios_all_apps, ...res.data]);
      } else {
        Toast(res.message);
      }
      console.log('添加结果：', res);
    } catch (error) {
      console.log(error);
    }
  };

  // 获取iOS应用
  getIosApps = async () => {
    try {
      let res: HttpRes = await http.get('/iosapp/list');
      if (res.statusCode === 200) {
        this.setIosAllApps(res.data);
      }
      console.log('获取iOS应用：', res.data);
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

import IndexScreen from '@/app/index';
import PunchCardScreen from '@/app/others/punch-card';
import WebScreen from '@/app/others/webview';
import UserEditScreen from '@/app/user/edit';
import VipScreen from '@/app/user/vip';
import AppsScreen from '@/pages/apps';
import AddAppScreen from '@/pages/apps/add';
import GuideScreen from '@/pages/guides';
import LoginScreen from '@/pages/login/index';
import RegisterScreen from '@/pages/login/register';
import StartScreen from '@/pages/login/start';
import WXLoginScreen from '@/pages/login/wx';
import AddPlanScreen from '@/pages/plans/add';
import PlanScreen from '@/pages/plans/index';
import QuickScreen from '@/pages/quick-start';
import SettingScreen from '@/pages/setting';
import AboutScreen from '@/pages/setting/about';
import FeedbackScreen from '@/pages/setting/feedback';
import LogoffScreen from '@/pages/setting/logoff';
import PermissionScreen from '@/pages/setting/permission';
import { UserStore } from '@/stores';
import { ScreenOptions } from '@/utils/config';
import { useTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { observer, useLocalObservable } from 'mobx-react';
import React from 'react';

const Stack = createNativeStackNavigator();

const App = observer(() => {
  const { dark } = useTheme();
  // 设置状态栏文字颜色
  ScreenOptions.statusBarStyle = dark ? 'light' : 'dark';
  const store = useLocalObservable(() => UserStore);
  // 判断引导是否完成
  const initialRoute = store.uInfo ? 'Index' : 'Start';
  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={ScreenOptions}>
      <Stack.Screen
        name="Index"
        component={IndexScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddPlan"
        component={AddPlanScreen}
        options={{ title: '添加任务' }}
      />
      <Stack.Screen
        name="Plans"
        component={PlanScreen}
        options={{ title: '任务面板' }}
      />
      <Stack.Screen
        name="Apps"
        component={AppsScreen}
        options={{ title: 'APP管理' }}
      />
      <Stack.Screen
        name="AddApp"
        component={AddAppScreen}
        options={{ title: '选择APP' }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          title: '登录',
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: '注册', headerTransparent: true }}
      />
      <Stack.Screen
        name="Guide"
        component={GuideScreen}
        options={{
          headerShown: false,
          animation: 'fade_from_bottom',
        }}
      />
      <Stack.Screen
        name="Setting"
        component={SettingScreen}
        options={{ title: '设置' }}
      />
      <Stack.Screen
        name="UserEdit"
        component={UserEditScreen}
        options={{ title: '个人信息' }}
      />
      <Stack.Screen
        name="QuickSt"
        component={QuickScreen}
        options={{
          title: '快速开始',
          animation: 'fade_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="Permission"
        component={PermissionScreen}
        options={{ title: '权限管理' }}
      />
      <Stack.Screen
        name="PunchCard"
        component={PunchCardScreen}
        options={{ title: '打卡' }}
      />
      <Stack.Screen
        name="WebView"
        component={WebScreen}
        options={{ title: 'Loading...' }}
      />
      <Stack.Screen
        name="WXLogin"
        component={WXLoginScreen}
        options={{ title: '', headerTransparent: true }}
      />
      <Stack.Screen
        name="Start"
        component={StartScreen}
        options={{ title: '', headerTransparent: true }}
      />
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{ title: '关于我们' }}
      />
      <Stack.Screen
        name="Logoff"
        component={LogoffScreen}
        options={{ title: '注销账号' }}
      />
      <Stack.Screen
        name="Feedback"
        component={FeedbackScreen}
        options={{ title: '意见反馈' }}
      />
      <Stack.Screen
        name="Vip"
        component={VipScreen}
        options={{ title: 'VIP充值' }}
      />
    </Stack.Navigator>
  );
});

export default App;

import { Page } from '@/components/business';
import {
  ActionSheet,
  FieldGroup,
  FieldItem,
  Switch,
  Toast,
} from '@/components/ui';
import { useHomeStore, usePlanStore, useUserStore } from '@/stores';
import { stopAppLimits } from '@/utils/permission';
import { useNavigation } from '@react-navigation/native';
import * as StoreReview from 'expo-store-review';
import React from 'react';
import { Appearance, Linking, Platform, View } from 'react-native';

const APP_STORE_APP_ID = '6751099977';
const APP_STORE_DETAIL_URLS = [
  `itms-apps://itunes.apple.com/app/id${APP_STORE_APP_ID}`,
  `https://apps.apple.com/cn/app/id${APP_STORE_APP_ID}`,
];
const APP_STORE_SEARCH_URLS = [
  'itms-apps://apps.apple.com/cn/search?term=%E4%B8%93%E6%B3%A8%E5%A5%91%E7%BA%A6',
  'https://apps.apple.com/cn/search?term=%E4%B8%93%E6%B3%A8%E5%A5%91%E7%BA%A6',
];

const App = () => {
  const store = useUserStore();
  const homeStore = useHomeStore();
  const navigation = useNavigation();

  const openAppStoreDetail = async () => {
    for (const url of APP_STORE_DETAIL_URLS) {
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
          return true;
        }
      } catch {}
    }
    return false;
  };

  const openAppStoreSearch = async () => {
    for (const url of APP_STORE_SEARCH_URLS) {
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
          return true;
        }
      } catch {}
    }
    Toast('无法打开 App Store');
    return false;
  };

  const onCheckUpdate = async () => {
    const opened = await openAppStoreDetail();
    if (!opened) {
      await openAppStoreSearch();
    }
  };

  const onEvaluate = async () => {
    try {
      const available = await StoreReview.isAvailableAsync();
      if (available) {
        await StoreReview.requestReview();
        return;
      }
    } catch {}

    await openAppStoreSearch();
  };

  const onClick = (tag: string) => {
    switch (tag) {
      case 'check':
        return onCheckUpdate();
      case 'privicy':
        return navigation.navigate('others/webview' as never);
      case 'evaluate':
        return onEvaluate();
      case 'logoff':
        return navigation.navigate('setting/logoff' as never);
      case 'clear':
        return Toast('已清理');
    }
  };

  const toLogout = () => {
    const pstore = usePlanStore.getState();
    const hasFocus = pstore.has_active_task();

    ActionSheet({
      actions: ['确认'],
      cancelText: '取消',
      description: hasFocus
        ? '退出登录将会结束当前专注，是否继续？'
        : '确认退出登录吗？',
    })
      .then(async () => {
        if (hasFocus && Platform.OS === 'ios') {
          await stopAppLimits();
          await pstore.exitPlan();
        }
        store.logout();
        navigation.goBack();
      })
      .catch(() => {});
  };

  return (
    <Page>
      <View className="flex-col gap-y-2.5 pb-10">
        <FieldGroup>
          <FieldItem
            title="跟随系统主题"
            rightElement={
              <Switch
                value={homeStore.followSystem}
                size={18}
                onChange={v => {
                  if (v) {
                    // 如果开启跟随系统，使用当前系统主题
                    const sys = Appearance.getColorScheme() || 'light';
                    homeStore.setThem(sys === 'dark' ? 'dark' : 'light', true);
                  } else {
                    // 如果关闭跟随系统，保持当前主题
                    homeStore.setThem(homeStore.them, false);
                  }
                }}
              />
            }
            showArrow={false}
          />
          <FieldItem
            title="暗色模式"
            rightElement={
              <Switch
                value={homeStore.them === 'dark'}
                size={18}
                disabled={homeStore.followSystem}
                onChange={v => homeStore.setThem(v ? 'dark' : 'light', false)}
              />
            }
            showArrow={false}
          />
          <FieldItem title="检查更新" onPress={() => onClick('check')} />
          <FieldItem title="隐私" onPress={() => onClick('privicy')} />
          <FieldItem title="去评价" onPress={() => onClick('evaluate')} />
          {/* {store.uInfo && (
            <FieldItem title="注销账号" onPress={() => onClick('logoff')} />
          )} */}
          {/* <FieldItem title="清理缓存" onPress={() => onClick('clear')} /> */}
        </FieldGroup>
        {store.uInfo && (
          <FieldGroup>
            <FieldItem
              title="退出登录"
              onPress={toLogout}
              className="justify-center"
              titleClassName="text-center"
              showArrow={false}
            />
          </FieldGroup>
        )}
      </View>
    </Page>
  );
};

export default App;

import { Page } from '@/components/business';
import { ActionSheet, FieldGroup, FieldItem, Switch } from '@/components/ui';
import { useHomeStore, UserStore } from '@/stores';
import { toast } from '@/utils';
import { useNavigation } from '@react-navigation/native';
import { observer, useLocalObservable } from 'mobx-react';
import React, { useEffect } from 'react';
import { Appearance, Linking, Platform, View } from 'react-native';

const App = observer(() => {
  const store = useLocalObservable(() => UserStore);
  const homeStore = useHomeStore();
  const navigation = useNavigation();

  const onClick = (tag: string) => {
    switch (tag) {
      case 'check':
        return toast('已是最新版本');
      case 'privicy':
        return navigation.navigate('others/webview' as never);
      case 'evaluate':
        return openStore();
      case 'logoff':
        return navigation.navigate('setting/logoff' as never);
      case 'clear':
        return toast('已清理');
    }
  };

  const openStore = () => {
    let storeUrl = Platform.select({
      ios: 'itms-apps://itunes.apple.com/app/com.focusone.app',
      android: 'market://details?id=com.focusone',
    });
    Linking.canOpenURL(storeUrl!)
      .then(supported => {
        if (supported) {
          return Linking.openURL(storeUrl!);
        } else {
          toast('无法打开应用市场');
        }
      })
      .catch(() => toast('打开应用市场失败'));
  };

  const toLogout = () => {
    ActionSheet({
      actions: ['确认'],
      cancelText: '取消',
      description: '确认退出登录吗？',
    })
      .then(() => {
        store.logout();
        navigation.goBack();
      })
      .catch(e => {});
  };

  useEffect(() => {}, []);

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
          {store.uInfo && (
            <FieldItem title="注销账号" onPress={() => onClick('logoff')} />
          )}
          <FieldItem title="清理缓存" onPress={() => onClick('clear')} />
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
});

export default App;

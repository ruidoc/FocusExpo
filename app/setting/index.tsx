import { CusPage } from '@/components';
import CustomDivider from '@/components/cus-divider';
import { HomeStore, UserStore } from '@/stores';
import { toast } from '@/utils';
import Icon from '@expo/vector-icons/Ionicons';
import { ActionSheet, Switch } from '@fruits-chain/react-native-xiaoshu';
import { useNavigation, useTheme } from '@react-navigation/native';
import { observer, useLocalObservable } from 'mobx-react';
import React, { useEffect } from 'react';
import {
  Appearance,
  Linking,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const App = observer(() => {
  const store = useLocalObservable(() => UserStore);
  const homeStore = useLocalObservable(() => HomeStore);
  const { colors, dark } = useTheme();
  const navigation = useNavigation();

  const ItemDom = (label: string, opts: any) => (
    <TouchableOpacity onPress={() => onClick(opts.tag)} activeOpacity={0.7}>
      <View className="flex-row justify-between items-center px-4 py-[15px]">
        <Text className="text-base" style={{ color: colors.text }}>
          {label}
        </Text>
        {/* @ts-ignore */}
        <Icon name="chevron-forward" size={17} color={colors.text} as any />
      </View>
      {!opts.noborder && <CustomDivider />}
    </TouchableOpacity>
  );

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
    <CusPage>
      <CustomDivider />
      <View className="flex-col gap-y-2.5 pb-10">
        <View
          className="mb-5 overflow-hidden"
          style={{ backgroundColor: colors.card }}>
          <View className="flex-row justify-between items-center px-4 py-[15px]">
            <Text className="text-base" style={{ color: colors.text }}>
              跟随系统主题
            </Text>
            <Switch
              value={homeStore.followSystem}
              size={22}
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
          </View>
          <CustomDivider />
          <View className="flex-row justify-between items-center px-4 py-[15px]">
            <Text className="text-base" style={{ color: colors.text }}>
              暗色模式
            </Text>
            <Switch
              value={homeStore.them === 'dark'}
              size={22}
              disabled={homeStore.followSystem}
              onChange={v => homeStore.setThem(v ? 'dark' : 'light', false)}
            />
          </View>
          <CustomDivider />
          {ItemDom('检查更新', { tag: 'check' })}
          {ItemDom('隐私', { tag: 'privicy' })}
          {ItemDom('去评价', { tag: 'evaluate' })}
          {store.uInfo && ItemDom('注销账号', { tag: 'logoff' })}
          {ItemDom('清理缓存', { tag: 'clear', noborder: true })}
        </View>
        {store.uInfo && (
          <TouchableOpacity
            className="mb-5 overflow-hidden"
            style={{ backgroundColor: colors.card }}
            onPress={toLogout}
            activeOpacity={0.7}>
            <View className="flex-row justify-center items-center px-4 py-[15px]">
              <Text className="text-base" style={{ color: colors.text }}>
                退出登录
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </CusPage>
  );
});

export default App;

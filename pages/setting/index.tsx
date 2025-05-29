import { CusPage } from '@/components';
import CustomDivider from '@/components/cus-divider';
import { HomeStore, UserStore } from '@/stores';
import { toast } from '@/utils';
import Icon from '@expo/vector-icons/Ionicons';
import {
  ActionSheet,
  Flex,
  Space,
  Switch,
} from '@fruits-chain/react-native-xiaoshu';
import { useNavigation, useTheme } from '@react-navigation/native';
import { observer, useLocalObservable } from 'mobx-react';
import React, { useEffect } from 'react';
import {
  Appearance,
  Linking,
  Platform,
  StyleSheet,
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
      <Flex justify="between" align="center" style={styles.itemBox}>
        <Text style={styles.itemText}>{label}</Text>
        {/* @ts-ignore */}
        <Icon name="chevron-forward" size={17} color={colors.text} as any />
      </Flex>
      {!opts.noborder && <CustomDivider />}
    </TouchableOpacity>
  );

  const onClick = (tag: string) => {
    switch (tag) {
      case 'check':
        return toast('已是最新版本');
      case 'privicy':
        return navigation.navigate('WebView' as never);
      case 'evaluate':
        return openStore();
      case 'logoff':
        return navigation.navigate('Logoff' as never);
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

  const styles = StyleSheet.create({
    userBox: {
      paddingHorizontal: 30,
      paddingBottom: 30,
      paddingTop: 75,
      // borderBottomColor: colors.border,
      // borderBottomWidth: 0.5,
      marginBottom: 10,
      // backgroundColor: colors.card,
    },
    userTitle: {
      fontSize: 25,
      marginBottom: 5,
      fontWeight: '500',
      color: colors.text,
    },
    userDesc: {
      fontSize: 14,
      color: '#666',
    },
    itemBoxWrap: {
      marginBottom: 20,
      overflow: 'hidden',
      backgroundColor: colors.card,
    },
    itemBox: {
      paddingHorizontal: 16,
      paddingVertical: 15,
    },
    itemText: {
      fontSize: 16,
      color: colors.text,
    },
    avator: {
      width: 60,
      height: 60,
      borderRadius: 21,
      marginRight: 14,
    },
  });

  return (
    <CusPage>
      {/* <View
        style={{ backgroundColor: '#232323', height: 0.5, margin: 0 }}></View> */}
      <CustomDivider />
      <Space gapVertical={10} tail={40}>
        <View style={styles.itemBoxWrap}>
          <Flex justify="between" align="center" style={styles.itemBox}>
            <Text style={styles.itemText}>跟随系统主题</Text>
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
          </Flex>
          <CustomDivider />
          <Flex justify="between" align="center" style={styles.itemBox}>
            <Text style={styles.itemText}>暗色模式</Text>
            <Switch
              value={homeStore.them === 'dark'}
              size={22}
              disabled={homeStore.followSystem}
              onChange={v => homeStore.setThem(v ? 'dark' : 'light', false)}
            />
          </Flex>
          <CustomDivider />
          {ItemDom('检查更新', { tag: 'check' })}
          {ItemDom('隐私', { tag: 'privicy' })}
          {ItemDom('去评价', { tag: 'evaluate' })}
          {store.uInfo && ItemDom('注销账号', { tag: 'logoff' })}
          {ItemDom('清理缓存', { tag: 'clear', noborder: true })}
        </View>
        {store.uInfo && (
          <TouchableOpacity
            style={styles.itemBoxWrap}
            onPress={toLogout}
            activeOpacity={0.7}>
            <Flex justify="center" align="center" style={styles.itemBox}>
              <Text style={styles.itemText}>退出登录</Text>
            </Flex>
          </TouchableOpacity>
        )}
      </Space>
    </CusPage>
  );
});

export default App;

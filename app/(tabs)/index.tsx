import FocusButton from '@/components/home/focus-button';
import FocusNotice from '@/components/home/focus-notice';
import ManageEntry from '@/components/home/manage-entry';
import {
  AppStore,
  HomeStore,
  PermisStore,
  PlanStore,
  RecordStore,
  UserStore,
} from '@/stores';
import { toast } from '@/utils';
import { buttonRipple } from '@/utils/config';
import { getScreenTimePermission } from '@/utils/permission';
import Icon from '@expo/vector-icons/Ionicons';
import {
  Button,
  Card,
  Flex,
  NoticeBar,
  Space,
  Theme,
} from '@fruits-chain/react-native-xiaoshu';
import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import { observer, useLocalObservable } from 'mobx-react';
import React, { useEffect, useState } from 'react';
import {
  AppState,
  Image,
  NativeModules,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

const { NativeClass } = NativeModules;
const statusBarHeight = StatusBar.currentHeight;

// 屏幕时间权限获取页面组件
const ScreenTimePermissionPage = ({
  colors,
  xcolor,
}: {
  colors: any;
  xcolor: any;
}) => {
  const handleRequestPermission = async () => {
    const granted = await getScreenTimePermission();
    if (granted) {
      // 成功获取权限，更新状态
      HomeStore.setIOSScreenTimePermission(true);
    } else {
      HomeStore.setIOSScreenTimePermission(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
      backgroundColor: colors.background,
    },
    icon: {
      fontSize: 80,
      color: xcolor.brand_6,
      marginBottom: 30,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    description: {
      fontSize: 16,
      color: xcolor.gray_8,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 40,
    },
    button: {
      backgroundColor: xcolor.brand_6,
      paddingHorizontal: 40,
      borderRadius: 25,
    },
    buttonText: {
      color: 'white',
      fontSize: 18,
      fontWeight: '600',
    },
  });

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Icon name="shield-checkmark" style={styles.icon} />
        <Text style={styles.title}>需要屏幕时间权限</Text>
        <Text style={styles.description}>
          为了帮助您专注工作和学习，我们需要获取屏幕时间权限来管理应用使用。
          {'\n\n'}
          请在设置中授予权限，然后返回应用继续使用。
        </Text>
        <Button
          style={styles.button}
          onPress={handleRequestPermission}
          textStyle={styles.buttonText}>
          获取权限
        </Button>
      </View>
    </SafeAreaView>
  );
};

const App = observer(() => {
  const store = useLocalObservable(() => HomeStore);
  const ustore = useLocalObservable(() => UserStore);
  const pstore = useLocalObservable(() => PlanStore);
  const astore = useLocalObservable(() => AppStore);
  const rstore = useLocalObservable(() => RecordStore);
  const pmstore = useLocalObservable(() => PermisStore);
  const { colors, dark } = useTheme();
  const xcolor = Theme.useThemeTokens();

  const [refreshing, setRefreshing] = useState(false);

  const apps = pstore.is_focus_mode ? astore.focus_apps : astore.shield_apps;

  // 如果没有屏幕时间权限，显示权限获取页面
  const shouldShowPermissionPage =
    Platform.OS === 'ios' && !store.ios_screen_time_permission;

  const getColor = (state: string) => {
    let grey = '#70809990';
    switch (state) {
      case 'close':
        return ustore.uInfo ? xcolor.brand_6 : grey;
      case 'start':
        return xcolor.yellow_4;
      case 'refuse':
        return xcolor.brand_6;
      case 'notask':
        return grey;
      default:
        return grey;
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    rstore.getStatis().finally(() => {
      setRefreshing(false);
    });
  };

  const descColor = dark ? '#aaa' : '#888';
  const cardTileBg = dark ? '#303133' : '#EBEEF5';
  const btnBoxBg = dark ? '#121212' : '#F5F5F5';

  const cardBg = colors.card;

  const styles = StyleSheet.create({
    // 通知栏样式
    banner: {
      backgroundColor: '#FA541C40',
      borderTopColor: colors.border,
      // borderTopWidth: 0.3,
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: 18,
      marginTop: 5,
      marginBottom: 13,
      color: '#FA541C',
    },
    // 页面样式
    pageStyle: {
      flex: 1,
      paddingTop: statusBarHeight - 15,
      paddingHorizontal: 20,
    },
    titleFont: {
      fontSize: 16,
      color: colors.text,
    },
    tagFont: {
      fontSize: 13,
      color: xcolor.gray_7,
    },
    descFont: {
      fontSize: 16,
      color: xcolor.gray_8,
    },
    lightFont: {
      fontWeight: '600',
    },
    btnFont: {
      fontSize: 18,
      color: 'white',
    },
    // 主要圆块按钮
    mainBtn: {
      backgroundColor: getColor(store.vpn_state),
      width: 150,
      height: 150,
      borderRadius: 100,
    },
    // 底部权限按钮
    bottomBox: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
    },
    // 首页按钮
    btnboxWrap: {
      flex: 1,
      height: 60,
      borderRadius: 10,
      marginBottom: 14,
      backgroundColor: btnBoxBg,
    },
    // 快速开始按钮
    startBtn: {
      borderRadius: 30,
      marginTop: 30,
      marginHorizontal: 20,
      borderWidth: 2,
    },
    titleStyle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#222',
      marginBottom: 0,
      marginTop: 10,
    },
    appIconWrap: {
      width: 36,
      height: 36,
      // borderRadius: 18,
      overflow: 'hidden',
      // backgroundColor: '#fff',
      marginBottom: 10,
      marginRight: 10,
    },
    cardHead: {
      padding: 14,
      paddingBottom: 0,
      // borderBottomColor: '#232323',
      // borderBottomWidth: 1,
      // opacity: 0.8,
    },
    cardTile: {
      backgroundColor: cardTileBg,
      borderRadius: 30,
      padding: 4,
      paddingHorizontal: 12,
      marginRight: 10,
    },
  });

  const startVpn = () => {
    if (!ustore.uInfo) {
      return toast('请先登录');
    }
    if (store.vpn_state === 'start') {
      return toast('正在专注');
    }
    if (astore.focus_apps.length === 0) {
      return toast('请添加专注目标APP');
    }
    if (astore.shield_apps.length === 0) {
      return toast('请添加屏蔽目标APP');
    }
    if (pstore.all_plans.length === 0) {
      return toast('请添加专注任务');
    }
    store.startVpn();
  };

  const toRoute = (path: string) => {
    if (!ustore.uInfo) {
      return router.push('/login');
    }
    router.push(path as never);
  };

  const timeLong = (minutes: number) => {
    let hour = Math.floor(minutes / 60);
    let mint = minutes % 60;
    if (hour) {
      return [
        <Text key={1} style={styles.lightFont}>
          {hour}
        </Text>,
        <Text key={2}> 小时 </Text>,
        <Text key={3} style={styles.lightFont}>
          {mint || 1}
        </Text>,
        <Text key={4}> 分钟</Text>,
      ];
    } else {
      return [
        <Text key={1} style={styles.lightFont}>
          {mint || 1}
        </Text>,
        <Text key={2}> 分钟</Text>,
      ];
    }
  };

  const RotDom = (path: string, title: string) => (
    <TouchableOpacity onPress={() => toRoute(path)} activeOpacity={0.7}>
      <Card bodyPadding={20}>
        <Flex justify="between">
          <Text style={styles.titleFont}>{title}</Text>
          <Icon name="chevron-forward" size={20} color={colors.text} />
        </Flex>
      </Card>
    </TouchableOpacity>
  );

  const toOpenApp = async (pname: string) => {
    NativeClass.openAppByPackageName(pname);
  };

  const toGuide = () => {
    router.push('/plans');
  };

  const quickStart = () => {
    if (!ustore.uInfo) {
      return router.push('/login/wx');
    }
    router.push('/quick-start');
  };

  const initapp = () => {
    pmstore.checkBattery();
    pmstore.checkNotify();
    if (!ustore.uInfo) return;
    if (pstore.all_plans[0]) {
      setTimeout(() => {
        startVpn();
      }, 1500);
    }
  };

  useEffect(() => {
    // 当用户状态恢复后，执行初始化
    if (ustore.uInfo) {
      initapp();
    }
  }, [ustore.uInfo]);

  // 应用回到前台时，立刻检查 iOS 屏幕时间权限
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const sub = AppState.addEventListener('change', async state => {
      if (state === 'active') {
        try {
          const { checkScreenTimePermission } = await import(
            '@/utils/permission'
          );
          const status = await checkScreenTimePermission();
          const isApproved = status === 'approved';
          if (isApproved !== store.ios_screen_time_permission) {
            store.setIOSScreenTimePermission(isApproved);
          }
        } catch (error) {
          console.log('前台检查屏幕时间权限失败:', error);
        }
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (store.app_state === 'active') {
      pmstore.checkBattery();
      pmstore.checkNotify();
    }
  }, [store.app_state]);

  // 如果需要显示权限页面，在这里返回
  if (shouldShowPermissionPage) {
    return <ScreenTimePermissionPage colors={colors} xcolor={xcolor} />;
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        style={styles.pageStyle}
        bounces={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <Flex justify="between" align="center" style={{ marginBottom: 10 }}>
          <Text style={{ fontSize: 21, color: colors.text, fontWeight: '600' }}>
            专注一点
          </Text>
          <Flex align="center">
            <Pressable android_ripple={buttonRipple} onPress={toGuide}>
              <Icon name="time-outline" size={24} color={descColor} />
            </Pressable>
          </Flex>
        </Flex>

        {ustore.uInfo && <FocusNotice />}
        {!pstore.cur_plan && <ManageEntry />}

        <Space gapVertical={10}>
          <Card bodyPadding={0} style={{ backgroundColor: cardBg }}>
            {pstore.cur_plan && (
              <Flex justify="start" align="center" style={styles.cardHead}>
                <Flex align="center" style={styles.cardTile}>
                  <Icon
                    name={
                      pstore.is_focus_mode ? 'checkmark-circle' : 'close-circle'
                    }
                    color={pstore.is_focus_mode ? '#34b545' : '#fa541c'}
                    size={15}
                  />
                  <Text style={styles.tagFont}>
                    &nbsp;
                    {pstore.is_focus_mode ? '专注模式' : '屏蔽模式'}
                  </Text>
                </Flex>
                <Flex align="center" style={styles.cardTile}>
                  <Icon name="time-sharp" size={15} color={colors.text} />
                  <Text style={styles.tagFont}>
                    &nbsp;
                    {pstore.cur_plan.start} ~ {pstore.cur_plan.end}
                  </Text>
                </Flex>
              </Flex>
            )}
            <FocusButton timeLong={timeLong} />
          </Card>
          {/* <View style={{ marginTop: 18, marginBottom: 8 }}>
            <Text
              style={[styles.titleStyle, { color: dark ? '#fff' : '#222' }]}>
              设置时长
            </Text>
          </View> */}
          {pstore.cur_plan && (
            <Card
              style={{
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderColor: cardTileBg,
                marginTop: 30,
                borderRadius: 14,
              }}>
              <Flex align="center" justify="center" style={{ marginTop: 4 }}>
                <Text style={{ color: descColor }}>
                  {pstore.is_focus_mode
                    ? `仅允许${apps.length}个APP使用`
                    : `${apps.length}个APP已被屏蔽`}
                </Text>
                {/* <Tag color={btnBoxBg} textColor={descColor}>
                  点击图标打开应用
                </Tag> */}
              </Flex>
              <Flex
                wrap="wrap"
                justify="center"
                style={{ marginTop: 6, marginBottom: 4 }}>
                {store.all_apps
                  .filter(r => apps.includes(r.packageName))
                  .map(app => (
                    <Flex
                      key={app.packageName}
                      style={styles.appIconWrap}
                      direction="column"
                      onPress={() => toOpenApp(app.packageName)}
                      align="center">
                      <Image
                        source={{
                          uri: 'data:image/jpeg;base64,' + app.icon,
                          width: 36,
                          height: 36,
                        }}
                        style={{
                          opacity: pstore.is_focus_mode ? 1 : 0.6,
                        }}
                      />
                    </Flex>
                  ))}
              </Flex>
            </Card>
          )}
        </Space>
        {ustore.uInfo && !pstore.cur_plan && (
          <Button
            style={styles.startBtn}
            type="ghost"
            textStyle={{ fontWeight: '600' }}
            onPress={quickStart}>
            快速开始
          </Button>
        )}
        {!ustore.uInfo && (
          <Button
            style={styles.startBtn}
            type="ghost"
            textStyle={{ fontWeight: '600' }}
            onPress={quickStart}>
            去登录
          </Button>
        )}
      </ScrollView>
      {/* 底部通知区域 */}
      <View style={styles.bottomBox}>
        {!pmstore.pm_notify && (
          <NoticeBar
            message="请打开通知权限"
            mode="link"
            status="primary"
            onPress={() => pmstore.openNotify(true)}
          />
        )}
        {/* {!pmstore.pm_battery && (
          <NoticeBar
            message="检查电池优化权限"
            mode="link"
            status="primary"
            onPress={() => pmstore.checkBattery(true)}
          />
        )} */}
      </View>
    </SafeAreaView>
  );
});

export default App;

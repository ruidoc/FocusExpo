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
import Icon from '@expo/vector-icons/Ionicons';
import {
  Button,
  Card,
  Flex,
  NoticeBar,
  Space,
  Theme,
} from '@fruits-chain/react-native-xiaoshu';
import { useNavigation, useTheme } from '@react-navigation/native';
import { observer, useLocalObservable } from 'mobx-react';
import React, { useEffect, useState } from 'react';
import {
  Image,
  NativeModules,
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
import FocusButton from './focus-button';
import FocusNotice from './focus-notice';
import ManageEntry from './manage-entry';

const { NativeClass } = NativeModules;
const statusBarHeight = StatusBar.currentHeight;

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

  const navigation = useNavigation();

  const apps = pstore.is_focus_mode ? astore.focus_apps : astore.shield_apps;

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
      return navigation.navigate('Login' as never);
    }
    navigation.navigate(path as never);
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
    navigation.navigate('Plans' as never);
  };

  const quickStart = () => {
    if (!ustore.uInfo) {
      return navigation.navigate('WXLogin' as never);
    }
    navigation.navigate('QuickSt' as never);
  };

  const initapp = () => {
    pmstore.checkBattery();
    pmstore.checkNotify();
    if (!ustore.uInfo) return;
    if (!pstore.all_plans[0]) {
      setTimeout(() => {
        (navigation as any).navigate('Guide', { type: 'start' });
      }, 2000);
    } else {
      setTimeout(() => {
        startVpn();
      }, 1500);
    }
  };

  useEffect(() => {
    initapp();
  }, []);

  useEffect(() => {
    if (store.app_state === 'active') {
      pmstore.checkBattery();
      pmstore.checkNotify();
    }
  }, [store.app_state]);

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
        {!pmstore.pm_battery && (
          <NoticeBar
            message="检查电池优化权限"
            mode="link"
            status="primary"
            onPress={() => pmstore.checkBattery(true)}
          />
        )}
      </View>
    </SafeAreaView>
  );
});

export default App;

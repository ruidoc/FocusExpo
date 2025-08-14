import AnimatedCascade from '@/components/cascade';
import CusButton from '@/components/cus-button';
import TokenLabel from '@/components/native/TokenLabel';
import Typewriter from '@/components/type-writer';
import { GuideStore, HomeStore, PlanStore } from '@/stores';
import { startAppLimits } from '@/utils/permission';
import { Flex } from '@fruits-chain/react-native-xiaoshu';
import { useTheme } from '@react-navigation/native';
import dayjs from 'dayjs';
import { router } from 'expo-router';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { useEffect, useRef, useState } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';

const GuideStep3 = observer(() => {
  const store = useLocalObservable(() => HomeStore);
  const gstore = useLocalObservable(() => GuideStore);
  const pstore = useLocalObservable(() => PlanStore);
  const { colors, dark } = useTheme();

  const descColor = dark ? '#aaa' : '#666';
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.card,
      padding: 20,
    },
    content: {
      flex: 1,
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
    },
    description: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 24,
      textAlign: 'left',
    },
    appsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginBottom: 30,
    },
    appItem: {
      width: 80,
      marginBottom: 20,
    },
    appName: {
      fontSize: 14,
      color: descColor,
      marginTop: 8,
      textAlign: 'center',
    },
    blockButton: {
      backgroundColor: dark ? '#007AFF' : '#3478F6',
      paddingVertical: 16,
      borderRadius: 24,
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 32,
      width: '88%',
      alignSelf: 'center',
      shadowColor: '#3478F6',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
    blockButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
  });

  const [typewriter1Done, setTypewriter1Done] = useState(false);
  const [appsVisible, setAppsVisible] = useState(false);
  const [appsAllShown, setAppsAllShown] = useState(false);
  const [typewriter2Visible, setTypewriter2Visible] = useState(false);
  const [typewriter2Done, setTypewriter2Done] = useState(false);
  const [buttonVisible, setButtonVisible] = useState(false);
  const buttonOpacity = useRef(
    new (require('react-native').Animated.Value)(0),
  ).current;

  // 1. 第一行打字机完成后显示app动画
  useEffect(() => {
    if (typewriter1Done) {
      setTimeout(() => setAppsVisible(true), 200);
    }
  }, [typewriter1Done]);

  // 2. app动画全部完成后显示第二行打字机
  useEffect(() => {
    if (appsAllShown) {
      setTypewriter2Visible(true);
    }
  }, [appsAllShown]);

  // 3. 第二行打字机完成后显示按钮
  useEffect(() => {
    if (typewriter2Done && !buttonVisible) {
      setButtonVisible(true);
      require('react-native')
        .Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        })
        .start();
    }
    if (!typewriter2Done && buttonVisible) {
      setButtonVisible(false);
      buttonOpacity.setValue(0);
    }
  }, [typewriter2Done]);

  const handleBlock = () => {
    // 创建一个5分钟的屏蔽计划
    let now = dayjs();
    let cur_minute = now.hour() * 60 + now.minute();
    let cur_secend = cur_minute * 60 + now.second();
    pstore.addOncePlan({
      id: `once_${Math.floor(Math.random() * 99999999)}`,
      start: now.format('HH:mm'),
      start_min: cur_minute,
      start_sec: cur_secend,
      end: now.add(5, 'minute').format('HH:mm'),
      end_min: cur_minute + 5,
      end_sec: cur_secend + 5 * 60,
      repeat: 'once',
      mode: gstore.mode,
    });

    if (Platform.OS === 'ios') {
      startAppLimits();
    } else {
      // 启动 VPN
      store.startVpn();

      // 获取选中的应用名称
      const selectedApp =
        store.all_apps
          .filter(app => gstore.selected_apps.includes(app.packageName))
          .map(app => app.appName)[0] || '';

      // 存储选中的应用名称到全局状态
      gstore.setSelectedAppName(selectedApp);
    }
    // 跳转到成功页面，并传递选中的应用名称
    router.push({
      pathname: '/(guides)/step4',
      params: { selectedAppName: '' },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* 1. 打字机第一行 */}
        <Typewriter
          lines={[`你已经选择了一款${gstore.getProblemLable()}APP`]}
          speed={22}
          lineDelay={600}
          lineStyle={styles.description}
          onFinish={() => setTypewriter1Done(true)}
        />
        {/* 2. app 动画 */}
        {appsVisible && (
          <AnimatedCascade
            interval={120}
            duration={300}
            distance={32}
            direction="bottom"
            style={{ marginTop: 30, marginBottom: 10 }}
            onFinish={() => setAppsAllShown(true)}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 3 }}>
              {store.selected_app_icons.map(item => (
                <TokenLabel
                  key={item.id}
                  tokenBase64={item.tokenData}
                  tokenType={item.type}
                  size={40}
                  style={{ width: 40, height: 40 }}
                />
              ))}
            </View>
            {store.all_apps
              .filter(app => gstore.selected_apps.includes(app.packageName))
              .map(app => (
                <Flex
                  key={app.packageName}
                  style={styles.appItem}
                  direction="column"
                  align="center">
                  <Image
                    source={{
                      uri: 'data:image/jpeg;base64,' + app.icon,
                      width: 50,
                      height: 50,
                    }}
                  />
                  <Text style={styles.appName}>{app.appName}</Text>
                </Flex>
              ))}
          </AnimatedCascade>
        )}
        {/* 3. 打字机第二行 */}
        {typewriter2Visible && (
          <Typewriter
            lines={[
              `接下来，${
                gstore.mode === 'shield'
                  ? '屏蔽该APP的网络'
                  : '只允许该APP访问网络'
              }`,
              `您将彻底隔绝任何打扰，专注学习`,
              '时长：5分钟，现在开始吧～',
            ]}
            speed={22}
            lineDelay={600}
            lineStyle={styles.description}
            onFinish={() => setTypewriter2Done(true)}
          />
        )}
      </View>
      {/* 4. 按钮动画 */}
      {buttonVisible && (
        <CusButton
          text={gstore.mode === 'shield' ? '立刻屏蔽' : '开始专注学习'}
          onPress={handleBlock}
        />
      )}
    </View>
  );
});

export default GuideStep3;

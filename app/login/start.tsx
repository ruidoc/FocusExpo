import { Button, Dialog, Flex } from '@/components/ui';
import { useHomeStore, UserStore } from '@/stores';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useFocusEffect,
  useNavigation,
  useTheme,
} from '@react-navigation/native';
// import * as Sentry from '@sentry/react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { observer, useLocalObservable } from 'mobx-react';
import React, { useCallback, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

const PRIVACY_KEY = 'privacy_readed';

const App = observer(() => {
  const store = useLocalObservable(() => UserStore);
  const hstore = useHomeStore();
  const { colors, dark } = useTheme();
  const [agree, setAgree] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const navigation = useNavigation<any>();

  // 页面聚焦时检查是否需要弹窗
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(PRIVACY_KEY).then(val => {
        if (val !== '1') {
          setAgree(false);
          setPrivacyVisible(true);
        } else {
          setAgree(true);
          setPrivacyVisible(false);
        }
      });
    }, []),
  );

  const toRoute = (route: string) => {
    if (!agree) {
      return setPrivacyVisible(true);
    }
    navigation.navigate(route);
  };

  const toRegister = (data: any) => {
    store.setWxInfo(data);
    navigation.replace('Login', { type: 'bind' });
  };

  const loginResult = (result: any) => {
    if (result.statusCode === 20003) {
      return toRegister(result.data);
    }
    store.login(result as Record<string, any>, val => {
      if (val) {
        router.replace('/(tabs)');
      }
    });
  };

  const styles = StyleSheet.create({
    linearBox: {
      flex: 1,
    },
    sectionBox: {
      marginHorizontal: 30,
      flex: 1,
    },
    button: {
      height: 52,
      marginBottom: 15,
    },
    avator: {
      width: 100,
      height: 100,
      borderRadius: 20,
      marginBottom: 14,
    },
    logoBox: {
      flex: 2,
    },
  });

  // 处理隐私弹窗确认
  const handlePrivacyAgree = async (yes = true) => {
    if (yes) {
      await AsyncStorage.setItem(PRIVACY_KEY, '1');
      // Sentry.init({
      //   dsn: 'https://cc6b3e31087a119340690e60212ce4fe@o4507773251223552.ingest.us.sentry.io/4507773257449472',
      //   // uncomment the line below to enable Spotlight (https://spotlightjs.com)
      //   autoInitializeNativeSdk: true,
      // });
      hstore.loadApps();
      setPrivacyVisible(false);
    }
    setAgree(yes);
  };

  // 处理隐私弹窗取消
  const handlePrivacyCancel = () => {
    setPrivacyVisible(false);
  };

  // 跳转隐私政策页面
  const handlePrivacyLink = () => {
    setPrivacyVisible(false);
    navigation.navigate('others/webview');
  };

  return (
    <LinearGradient
      colors={
        dark ? ['#394143', '#39414360'] : ['#E3E8FF', '#F0F4FF', '#FFF7F0']
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.linearBox}>
      <Flex className="flex-col items-stretch flex-1" style={styles.sectionBox}>
        <Flex
          className="flex-col justify-center flex-[2]"
          style={styles.logoBox}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.avator}
          />
          <Text
            style={{
              fontSize: 24,
              color: colors.text,
              letterSpacing: 5,
            }}>
            专注一点
          </Text>
        </Flex>
        <View style={{ flex: 1 }}>
          <Button style={styles.button} onPress={() => toRoute('Guide')}>
            开始使用
          </Button>
          <Button
            type="ghost"
            style={styles.button}
            onPress={() => toRoute('Login')}>
            已有账号，登录
          </Button>
          {/* <Wechat
            type="ghost"
            disabled={!agree}
            label="已有账号，登录"
            onSuccess={loginResult}
          /> */}
        </View>
      </Flex>
      {/* <Privicy agree={agree} onChange={handlePrivacyAgree} /> */}
      {/* 隐私政策弹窗（组件调用方式） */}
      <Dialog
        visible={privacyVisible}
        title="隐私政策"
        showCancelButton
        onPressConfirm={handlePrivacyAgree}
        confirmButtonText="同意并继续"
        cancelButtonText="不同意"
        onPressCancel={handlePrivacyCancel}>
        <View style={{ paddingHorizontal: 20, paddingVertical: 10 }}>
          <Text>
            欢迎使用专注一点！我们非常重视您的隐私和个人信息保护。请您务必仔细阅读
            <Text
              style={{ color: colors.primary, textDecorationLine: 'underline' }}
              onPress={handlePrivacyLink}>
              《隐私政策》
            </Text>
            ，同意后方可继续使用。
          </Text>
        </View>
      </Dialog>
    </LinearGradient>
  );
});

export default App;

import { Privicy, Wechat } from '@/components/business';
import { UserStore } from '@/stores';
import { Button, Flex } from '@fruits-chain/react-native-xiaoshu';
import { useNavigation, useTheme } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { observer, useLocalObservable } from 'mobx-react';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

const App = observer(() => {
  const store = useLocalObservable(() => UserStore);
  const { colors, dark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [agree, setAgree] = useState(false);

  const navigation = useNavigation<any>();

  const toRoute = () => {
    navigation.replace('login/index');
  };

  const toRegister = (data: any) => {
    store.setWxInfo(data);
    navigation.replace('login/index', { type: 'bind' });
  };

  const loginResult = (result: any) => {
    if (result.statusCode === 20003) {
      return toRegister(result.data);
    } else {
      store.loginSuccess(result.data);
      setLoading(false);
      router.replace('/(tabs)');
    }
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

  return (
    <LinearGradient
      // 设置渐变的颜色
      colors={
        dark ? ['#394143', '#39414360'] : ['#E3E8FF', '#F0F4FF', '#FFF7F0']
      }
      // 设置开始和结束点
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.linearBox}>
      <Flex direction="column" align="stretch" style={styles.sectionBox}>
        <Flex
          direction="column"
          justify="center"
          align="center"
          style={styles.logoBox}>
          <Image source={require('@/assets/images/logo.png')} style={styles.avator} />
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
          <Wechat disabled={!agree} onSuccess={loginResult} />
          <Button type="ghost" style={styles.button} onPress={toRoute}>
            手机号登录
          </Button>
        </View>
      </Flex>
      <Privicy onChange={setAgree} />
    </LinearGradient>
  );
});

export default App;

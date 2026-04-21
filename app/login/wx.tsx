import { Apple, Privicy } from '@/components/business';
import { Flex } from '@/components/ui';
import { useUserStore } from '@/stores';
import { useNavigation, useTheme } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const App = () => {
  const store = useUserStore();
  const { colors, dark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [agree, setAgree] = useState(false);
  const insets = useSafeAreaInsets();

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
      router.dismiss();
    }
  };

  const appleLoginResult = (credential: any) => {
    setLoading(true);
    store.appleLogin(credential, res => {
      setLoading(false);
      if (res?.statusCode === 200) {
        router.dismiss();
      }
    });
  };

  return (
    <LinearGradient
      colors={
        dark
          ? ['#1B1E2F', '#252A3A', '#1B1E2F']
          : ['#E0E7FF', '#EDE9FE', '#FCE7F3']
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 0.3, y: 1 }}
      style={{ flex: 1 }}>
      <Flex
        className="flex-col items-stretch flex-1 mx-[30px]"
        style={{ paddingBottom: insets.bottom + 12 }}>
        <Flex className="flex-col justify-center flex-[2]">
          <Image
            source={require('@/assets/images/logo.png')}
            className="w-[100px] h-[100px] rounded-[20px] mb-3.5"
          />
          <Text
            className="text-2xl"
            style={{ color: colors.text, letterSpacing: 6 }}>
            专注契约
          </Text>
        </Flex>
        <View className="flex-1">
          {/* <Wechat disabled={!agree} onSuccess={loginResult} /> */}
          <Apple disabled={!agree} onSuccess={appleLoginResult} />
          {/* <Button
            type="ghost"
            text="手机号登录"
            onPress={toRoute}
            className="mt-2"
          /> */}
        </View>
        <Privicy agree={agree} onChange={setAgree} />
      </Flex>
    </LinearGradient>
  );
};

export default App;

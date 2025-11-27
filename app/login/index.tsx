import { Privicy, Wechat } from '@/components/business';
import { Keyboard } from '@/components/system';
import { TextInput } from '@/components/ui';
import { UserStore } from '@/stores';
import { toast } from '@/utils';
import { Button, Toast } from '@fruits-chain/react-native-xiaoshu';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, useTheme } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { observer, useLocalObservable } from 'mobx-react';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

const App = observer(() => {
  const store = useLocalObservable(() => UserStore);
  const { colors, dark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [agree, setAgree] = useState(false);
  const [isbind, setIsbind] = useState(false);
  const route = useRoute();

  const navigation = useNavigation<any>();

  const [form, setForm] = useState({
    phone: '',
    password: '',
    confirm_password: '',
  });

  const setInfo = (val: any, key: string) => {
    setForm({
      ...form,
      [key]: val,
    });
  };

  const toBind = () => {
    if (form.password.length < 6) {
      return Toast('密码至少6位');
    }
    if (form.password !== form.confirm_password) {
      return Toast('两次密码输入不符，请重新输入');
    }
    setLoading(true);
    let { openid, unionid, headimgurl, nickname, sex } = store.wxInfo;
    let submitForm = {
      ...form,
      openid,
      unionid,
      avatar: headimgurl,
      username: nickname,
      sex,
    };
    console.log(submitForm);
    store.register(submitForm as Record<string, any>, val => {
      setLoading(false);
      if (val) {
        router.replace('/(tabs)');
      }
    });
  };

  const toRegister = (data: any) => {
    store.setWxInfo(data);
    navigation.replace('Login', { type: 'bind' });
  };

  const loginResult = (result: any) => {
    console.log('微信登录结果', result);
    if (result.statusCode === 20003) {
      return toRegister(result.data);
    }
    store.login(result as Record<string, any>, val => {
      if (val) {
        router.replace('/(tabs)');
      }
    });
  };

  const toLogin = () => {
    if (!agree) {
      return toast('请阅读并勾选下方隐私政策');
    }
    setLoading(true);
    delete form.confirm_password;
    console.log(form);
    store.login(form as Record<string, any>, val => {
      setLoading(false);
      if (val) {
        router.replace('/(tabs)');
      }
    });
  };

  const initState = async () => {
    const privacy_readed = await AsyncStorage.getItem('privacy_readed');
    if (privacy_readed) {
      setAgree(true);
    }
  };

  useEffect(() => {
    let type = (route.params as any)?.type;
    if (type && type === 'bind') {
      setIsbind(true);
      navigation.setOptions({
        title: '绑定手机号',
      });
    }
    initState();
  }, []);

  const styles = StyleSheet.create({
    linearBox: {
      flex: 1,
    },
    inputWrap: {
      backgroundColor: dark ? '#12121250' : '#F5F6FA',
      borderRadius: 9,
      marginBottom: 14,
      paddingVertical: 15,
      paddingHorizontal: 20,
    },
    inputBox: {
      textAlign: 'left',
      fontSize: 18,
      color: dark ? '#fff' : '#222',
    },
    sectionBox: {
      marginHorizontal: 30,
      marginTop: 140,
    },
    button: {
      height: 52,
      marginTop: 20,
      marginBottom: 14,
      fontSize: 17,
    },
    footer: {
      position: 'absolute',
      bottom: 30,
      left: 0,
      right: 0,
      paddingHorizontal: 30,
    },
  });

  return (
    <Keyboard>
      <LinearGradient
        // 设置渐变的颜色
        colors={
          dark ? ['#443937', '#44393760'] : ['#E3E8FF', '#F0F4FF', '#FFF7F0']
        }
        // 设置开始和结束点
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.linearBox}>
        <View style={styles.sectionBox}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.inputBox}
              placeholder="请输入手机号"
              placeholderTextColor={dark ? '#FFFFFF50' : '#888'}
              value={form.phone}
              clearable
              keyboardType="number-pad"
              onChange={v => setInfo(v, 'phone')}
            />
          </View>
          <View style={styles.inputWrap}>
            <TextInput
              secureTextEntry
              style={styles.inputBox}
              placeholder="请输入密码"
              placeholderTextColor={dark ? '#FFFFFF50' : '#888'}
              value={form.password}
              clearable
              onChange={v => setInfo(v, 'password')}
            />
          </View>
          {isbind && (
            <View style={styles.inputWrap}>
              <TextInput
                secureTextEntry
                style={styles.inputBox}
                placeholder="再次输入密码"
                placeholderTextColor={dark ? '#FFFFFF50' : '#888'}
                value={form.confirm_password}
                clearable
                onChange={v => setInfo(v, 'confirm_password')}
              />
            </View>
          )}
          <Button
            disabled={!form.password || !form.phone}
            style={styles.button}
            loading={loading}
            size="xl"
            onPress={isbind ? toBind : toLogin}>
            {(!isbind && '登录') || '绑定'}
          </Button>
          {!isbind && (
            <Wechat
              type="ghost"
              disabled={!agree}
              color="#07C160"
              onSuccess={loginResult}
            />
          )}
          {/* <Flex justify="end">
            <TouchableOpacity activeOpacity={0.7} onPress={toRoute}>
              <Text style={{ color: colors.primary }}>没有账号？去注册</Text>
            </TouchableOpacity>
          </Flex> */}
        </View>
        {!isbind && <Privicy agree={agree} onChange={setAgree} />}
      </LinearGradient>
    </Keyboard>
  );
});

export default App;

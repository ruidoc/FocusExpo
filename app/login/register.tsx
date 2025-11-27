import { Privicy } from '@/components/business';
import { Keyboard } from '@/components/system';
import { TextInput } from '@/components/ui';
import { UserStore } from '@/stores';
import { toast } from '@/utils';
import {
  Button,
  Flex,
  Toast,
} from '@fruits-chain/react-native-xiaoshu';
import { useNavigation, useTheme } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { observer, useLocalObservable } from 'mobx-react';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const App = observer(() => {
  const store = useLocalObservable(() => UserStore);
  const { colors, dark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [agree, setAgree] = useState(false);

  const navigation = useNavigation<any>();

  const [form, setForm] = useState({
    phone: '',
    username: '',
    password: '',
    sex: 1,
    confirm_password: '',
  });

  const toRoute = () => {
    navigation.replace('/login' as never);
  };

  const setInfo = (val: any, key: string) => {
    setForm({
      ...form,
      [key]: val,
    });
  };

  const onFinish = (values: Record<string, any>) => {
    console.log(values);
  };

  const toSubmit = () => {
    if (!agree) {
      return toast('请阅读并勾选下方隐私政策');
    }
    setLoading(true);
    console.log(form);
    if (form.password.length < 6) {
      return Toast('密码至少6位');
    }
    if (form.password !== form.confirm_password) {
      return Toast('两次密码输入不符，请重新输入');
    }
    store.register(form as Record<string, any>, val => {
      setLoading(false);
      if (val) {
        navigation.popToTop();
      }
    });
  };

  useEffect(() => { }, []);

  const styles = StyleSheet.create({
    linearBox: {
      flex: 1,
    },
    inputWrap: {
      backgroundColor: '#12121250',
      borderRadius: 9,
      marginBottom: 14,
      paddingVertical: 15,
      paddingHorizontal: 20,
    },
    inputBox: {
      textAlign: 'left',
      fontSize: 18,
    },
    sectionBox: {
      marginHorizontal: 30,
      marginTop: 140,
      marginBottom: 60,
    },
    title: {
      fontSize: 27,
      fontWeight: '600',
      color: colors.text,
      marginTop: 15,
      marginBottom: 35,
    },
    button: {
      height: 50,
      marginTop: 20,
      marginBottom: 10,
      fontSize: 17,
    },
  });

  return (
    <Keyboard>
      <LinearGradient
        // 设置渐变的颜色
        colors={['#443937', '#44393760']}
        // 设置开始和结束点
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.linearBox}>
        <View style={styles.sectionBox}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.inputBox}
              placeholder="请输入手机号"
              placeholderTextColor="#FFFFFF50"
              value={form.phone}
              clearable
              keyboardType="number-pad"
              onChange={v => setInfo(v, 'phone')}
            />
          </View>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.inputBox}
              placeholder="请输入用户名"
              placeholderTextColor="#FFFFFF50"
              value={form.username}
              clearable
              onChange={v => setInfo(v, 'username')}
            />
          </View>
          <View style={styles.inputWrap}>
            <TextInput
              secureTextEntry
              style={styles.inputBox}
              placeholder="请输入密码"
              placeholderTextColor="#FFFFFF50"
              value={form.password}
              clearable
              onChange={v => setInfo(v, 'password')}
            />
          </View>
          <View style={styles.inputWrap}>
            <TextInput
              secureTextEntry
              style={styles.inputBox}
              placeholder="再次输入密码"
              placeholderTextColor="#FFFFFF50"
              value={form.confirm_password}
              clearable
              onChange={v => setInfo(v, 'confirm_password')}
            />
          </View>
          <Button
            disabled={!form.password || !form.phone}
            style={styles.button}
            loading={loading}
            size="xl"
            onPress={toSubmit}>
            注册
          </Button>
          <Flex className="justify-end">
            <TouchableOpacity activeOpacity={0.7} onPress={toRoute}>
              <Text style={{ color: colors.primary }}>已有账号？去登录</Text>
            </TouchableOpacity>
          </Flex>
        </View>
        <Privicy onChange={setAgree} />
      </LinearGradient>
    </Keyboard>
  );
});

export default App;

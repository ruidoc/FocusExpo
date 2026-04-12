import { Apple, Privicy, Wechat } from '@/components/business';
import { Keyboard } from '@/components/system';
import { Button, TextInput, Toast } from '@/components/ui';
import { useCustomTheme } from '@/config/theme';
import { useUserStore } from '@/stores';
import Icon from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const CODE_COOLDOWN = 60;

const App = () => {
  const store = useUserStore();
  const { colors } = useCustomTheme();
  const [loading, setLoading] = useState(false);
  const [agree, setAgree] = useState(false);
  const [isbind, setIsbind] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const route = useRoute();
  const navigation = useNavigation<any>();

  const [form, setForm] = useState({
    phone: '',
    code: '',
  });

  const setInfo = (val: string, key: 'phone' | 'code') => {
    setForm(prev => ({ ...prev, [key]: val }));
  };

  const canSendCode = /^1\d{10}$/.test(form.phone) && countdown === 0;

  const sendCode = async () => {
    if (!canSendCode) return;
    const ok = await store.sendCode(form.phone);
    if (ok) {
      Toast('验证码已发送');
      setCountdown(CODE_COOLDOWN);
      timerRef.current = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
  };

  const toBind = async () => {
    if (!form.phone || !form.code) return;
    if (form.code.length < 4) {
      return Toast('请输入完整验证码');
    }
    setLoading(true);
    const wxInfo = store.wxInfo;
    if (wxInfo) {
      store.bindByCode(form, wxInfo, () => {
        setLoading(false);
        router.replace('/(tabs)');
      });
    } else {
      // 已登录用户绑定手机号
      store.bindPhoneByCode(form, () => {
        setLoading(false);
        router.back();
      });
    }
  };

  const toLogin = async () => {
    if (!agree) {
      return Toast('请阅读并勾选下方隐私政策');
    }
    if (!form.phone || !form.code) return;
    if (form.code.length < 4) {
      return Toast('请输入完整验证码');
    }
    setLoading(true);
    store.loginByCode(form, () => {
      setLoading(false);
      router.replace('/(tabs)');
    });
  };

  const loginResult = (result: any) => {
    if (result?.statusCode === 20003) {
      store.setWxInfo(result.data);
      router.replace({ pathname: '/login', params: { type: 'bind' } });
      return;
    }
    if (result?.statusCode === 200 && result?.data?.token) {
      store.loginSuccess(result.data, 'wechat');
      router.replace('/(tabs)');
    }
  };

  const appleLoginResult = (credential: any) => {
    setLoading(true);
    store.appleLogin(credential, res => {
      setLoading(false);
      if (res?.statusCode === 200) {
        router.replace('/(tabs)');
      }
    });
  };

  const initState = async () => {
    const privacy_readed = await AsyncStorage.getItem('privacy_readed');
    if (privacy_readed) setAgree(true);
  };

  useEffect(() => {
    const type = (route.params as any)?.type;
    if (type === 'bind') {
      setIsbind(true);
      navigation.setOptions({
        title: '',
        headerTransparent: true,
        headerShown: true,
      });
    }
    initState();
  }, [navigation, route.params]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const bg = colors.background;

  return (
    <Keyboard>
      <View className="flex-1" style={{ backgroundColor: bg }}>
        <View className="flex-1 px-6 pt-12 mt-[100px]">
          {/* 标题 */}
          <View className="mb-10">
            <Text
              className="text-2xl font-bold tracking-tight"
              style={{ color: colors.text }}>
              {isbind ? '绑定手机号' : '手机号登录'}
            </Text>
            <Text className="text-base mt-2" style={{ color: colors.text2 }}>
              {isbind
                ? '根据国家相关法律规定，请绑定手机号'
                : '未注册的手机号将自动创建账号'}
            </Text>
          </View>

          {/* 手机号 */}
          <View
            className="rounded-2xl mb-4 px-4 py-4"
            style={{
              backgroundColor: colors.card2,
            }}>
            <View className="flex-row items-center">
              <Icon
                name="call-outline"
                size={18}
                color={colors.text3}
                style={{ marginRight: 12 }}
              />
              <TextInput
                className="flex-1 text-base"
                placeholder="请输入手机号"
                placeholderTextColor={colors.text3}
                value={form.phone}
                clearable
                keyboardType="number-pad"
                maxLength={11}
                onChange={v => setInfo(v, 'phone')}
                style={{
                  color: colors.text,
                  paddingVertical: 4,
                  backgroundColor: 'transparent',
                  borderWidth: 0,
                  paddingHorizontal: 0,
                }}
              />
            </View>
          </View>

          {/* 验证码 */}
          <View
            className="rounded-2xl mb-6 px-4 py-4 flex-row items-center"
            style={{
              backgroundColor: colors.card2,
            }}>
            <View className="flex-1 min-w-0">
              <TextInput
                className="text-base"
                placeholder="请输入验证码"
                placeholderTextColor={colors.text3}
                value={form.code}
                clearable
                keyboardType="number-pad"
                maxLength={6}
                onChange={v => setInfo(v, 'code')}
                style={{
                  color: colors.text,
                  paddingVertical: 3,
                  backgroundColor: 'transparent',
                  borderWidth: 0,
                  paddingHorizontal: 0,
                }}
              />
            </View>
            <TouchableOpacity
              onPress={sendCode}
              disabled={!canSendCode}
              activeOpacity={0.7}
              style={{
                marginLeft: 16,
                paddingVertical: 4,
                paddingHorizontal: 8,
                flexShrink: 0,
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              {countdown > 0 ? (
                <Text
                  className="text-sm font-medium"
                  style={{ color: colors.text3 }}>
                  {countdown}s 后重发
                </Text>
              ) : (
                <Text
                  className="text-[15px] font-medium"
                  style={{
                    color: canSendCode
                      ? colors.primary || '#7A5AF8'
                      : colors.text3,
                  }}>
                  获取验证码
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* 主按钮 */}
          <Button
            disabled={!form.phone || !form.code || form.code.length < 4}
            loading={loading}
            loadingText={isbind ? '绑定中...' : '登录中...'}
            onPress={isbind ? toBind : toLogin}
            text={isbind ? '绑定' : '登录'}
            className="w-full rounded-2xl h-14"
            textClassName="text-lg"
          />

          {/* 第三方登录 - 仅非绑定模式 */}
          {!isbind && (
            <View className="mt-8">
              <View className="flex-row items-center mb-6">
                <View
                  className="flex-1 h-px"
                  style={{ backgroundColor: colors.border }}
                />
                <Text
                  className="mx-4 text-sm"
                  style={{ color: colors.text3 }}>
                  其他登录方式
                </Text>
                <View
                  className="flex-1 h-px"
                  style={{ backgroundColor: colors.border }}
                />
              </View>
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Wechat
                    type="ghost"
                    disabled={!agree}
                    onSuccess={loginResult}
                  />
                </View>
                <View className="flex-1">
                  <Apple
                    type="ghost"
                    disabled={!agree}
                    onSuccess={appleLoginResult}
                  />
                </View>
              </View>
            </View>
          )}
        </View>

        {!isbind && (
          <View className="px-6 pb-8">
            <Privicy onChange={setAgree} />
          </View>
        )}
      </View>
    </Keyboard>
  );
};

export default App;

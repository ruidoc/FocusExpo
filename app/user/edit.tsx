import { Page } from '@/components/business';
import {
  ActionSheet,
  Dialog,
  FieldGroup,
  FieldItem,
  TextInput,
  Toast,
} from '@/components/ui';
import { useCustomTheme } from '@/config/theme';
import { useUserStore } from '@/stores';
import Icon from '@expo/vector-icons/Ionicons';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as ImagePicker from 'expo-image-picker';
import { registerApp, sendAuthRequest } from 'expo-native-wechat';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

const SEX_LABELS: Record<number, string> = {
  0: '未知',
  1: '男',
  2: '女',
};

const App = () => {
  const store = useUserStore();
  const { colors } = useCustomTheme();
  const [loading, setLoading] = useState(false);
  const [mergeDialogVisible, setMergeDialogVisible] = useState(false);
  const [pendingCredential, setPendingCredential] = useState<any>(null);
  const [usernameDialogVisible, setUsernameDialogVisible] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');

  const isAppleBound = (store.uInfo as any)?.apple_id || false;

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Toast('需要相册权限才能更换头像');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setLoading(true);
      const ok = await store.uploadAvatar(result.assets[0].uri);
      setLoading(false);
      if (ok) Toast('头像已更新');
    }
  };

  const onUsernamePress = () => {
    setUsernameInput(store.uInfo?.username || '');
    setUsernameDialogVisible(true);
  };

  const onUsernameConfirm = async () => {
    const name = usernameInput.trim();
    if (!name) return Toast('请输入用户名');
    setUsernameDialogVisible(false);
    setLoading(true);
    const ok = await store.updateUser({ username: name });
    setLoading(false);
    if (ok) Toast('用户名已更新');
  };

  const onSexPress = () => {
    ActionSheet({
      actions: ['男', '女', '未知'],
      cancelText: '取消',
    }).then(index => {
      if (index === undefined) return;
      const sex = [1, 2, 0][index];
      setLoading(true);
      store.updateUser({ sex }).then(ok => {
        setLoading(false);
        if (ok) Toast('性别已更新');
      });
    });
  };

  const onWechatPress = async () => {
    if (store.uInfo?.openid) {
      Toast('微信已绑定');
      return;
    }
    try {
      registerApp({
        appid: 'wxdc022c6a39cb32b7',
        universalLink: 'https://focusone.ruidoc.cn/iosapp/',
      });
      const authResult = await sendAuthRequest();
      const code = authResult?.data?.code;
      if (!code) return;
      setLoading(true);
      await store.wechatBind(code);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const handleAppleBind = async () => {
    if (Platform.OS !== 'ios') {
      Toast('Apple 登录仅支持 iOS 设备');
      return;
    }
    try {
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        Toast('当前设备不支持 Apple 登录');
        return;
      }
      setLoading(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      await store.appleBind(
        { identityToken: credential.identityToken },
        false,
        async result => {
          setLoading(false);
          if (result?.statusCode === 200) {
            if (result.data?.merged) {
              setPendingCredential({ identityToken: credential.identityToken });
              setMergeDialogVisible(true);
            } else {
              Toast('Apple 账号绑定成功');
              await store.getInfo();
            }
          }
        },
      );
    } catch (error: any) {
      setLoading(false);
      if (error.code === 'ERR_REQUEST_CANCELED') return;
      let errorMessage = 'Apple 绑定失败，请重试';
      if (error.code === 'ERR_REQUEST_UNKNOWN') {
        errorMessage = 'Apple 绑定失败，请检查设备设置';
      } else if (error.code === 'ERR_REQUEST_FAILED') {
        errorMessage = error.message || errorMessage;
      }
      Toast(errorMessage);
    }
  };

  const handleMergeConfirm = async () => {
    setMergeDialogVisible(false);
    if (!pendingCredential) return;
    setLoading(true);
    try {
      await store.appleBind(pendingCredential, true, async result => {
        setLoading(false);
        if (result?.statusCode === 200) {
          Toast('账户合并成功');
          await store.getInfo();
        }
      });
    } catch {
      setLoading(false);
    }
    setPendingCredential(null);
  };

  useEffect(() => {
    registerApp({
      appid: 'wxdc022c6a39cb32b7',
      universalLink: 'https://focusone.ruidoc.cn/iosapp/',
    });
  }, []);

  if (!store.uInfo) return null;

  const avatarUri = store.uInfo.avatar;

  return (
    <Page>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* 头像区域 */}
        <View className="items-center py-8">
          <Pressable
            onPress={pickAvatar}
            disabled={loading}
            className="items-center justify-center overflow-hidden rounded-full"
            style={{
              width: 96,
              height: 96,
              backgroundColor: colors.card,
            }}>
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <Icon name="person" size={48} color={colors.text2 || '#999'} />
            )}
          </Pressable>
          <Text className="mt-2 text-sm" style={{ color: colors.text2 }}>
            点击更换头像
          </Text>
        </View>

        <View className="flex-col gap-y-2.5 px-4 pb-10">
          <FieldGroup className="rounded-[10px]">
            <FieldItem
              title="用户名"
              rightText={store.uInfo.username}
              onPress={onUsernamePress}
            />
            <FieldItem
              title="手机号"
              rightText={store.uInfo.phone || '点击绑定'}
              onPress={() => {
                if (store.uInfo?.phone) {
                  Toast('手机号已绑定');
                } else {
                  router.push({ pathname: '/login', params: { type: 'bind' } });
                }
              }}
            />
            <FieldItem
              title="性别"
              rightText={SEX_LABELS[store.uInfo.sex ?? 0] ?? '未知'}
              onPress={onSexPress}
            />
          </FieldGroup>
          <FieldGroup className="rounded-[10px]">
            <FieldItem
              title="微信"
              rightText={store.uInfo.openid ? '已绑定' : '未绑定'}
              onPress={onWechatPress}
            />
            <FieldItem
              title="Apple"
              rightText={isAppleBound ? '已绑定' : '未绑定'}
              onPress={() => {
                if (isAppleBound) Toast('Apple ID 已绑定');
                else handleAppleBind();
              }}
            />
          </FieldGroup>
        </View>
      </ScrollView>

      {/* 用户名编辑对话框 */}
      <Dialog
        visible={usernameDialogVisible}
        title="修改用户名"
        showCancelButton
        confirmButtonText="保存"
        cancelButtonText="取消"
        onPressConfirm={onUsernameConfirm}
        onPressCancel={() => setUsernameDialogVisible(false)}>
        <View className="py-2">
          <Text className="text-sm mb-2" style={{ color: colors.text2 }}>
            请输入新用户名
          </Text>
          <TextInput
            value={usernameInput}
            onChange={setUsernameInput}
            placeholder="用户名"
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              color: colors.text,
              fontSize: 16,
            }}
          />
        </View>
      </Dialog>

      {/* 账户合并确认对话框 */}
      <Dialog
        visible={mergeDialogVisible}
        title="账户合并"
        showCancelButton
        onPressConfirm={handleMergeConfirm}
        confirmButtonText="确认合并"
        cancelButtonText="取消"
        onPressCancel={() => {
          setMergeDialogVisible(false);
          setPendingCredential(null);
        }}>
        <View className="py-3 px-1">
          <Text className="text-base leading-6" style={{ color: colors.text }}>
            检测到该 Apple ID
            已绑定其他账户。合并后，将保留当前账户，删除另一个账户。是否确认合并？
          </Text>
        </View>
      </Dialog>
    </Page>
  );
};

export default App;

import { Page } from '@/components/business';
import { ActionSheet, Dialog, FieldGroup, FieldItem, Toast } from '@/components/ui';
import { useUserStore } from '@/stores';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

const App = () => {
  const store = useUserStore();
  const [loading, setLoading] = useState(false);
  const [mergeDialogVisible, setMergeDialogVisible] = useState(false);
  const [pendingCredential, setPendingCredential] = useState<any>(null);

  // 检查是否已绑定 Apple ID（假设后端返回的用户信息中有 appleId 字段）
  const isAppleBound = (store.uInfo as any)?.appleId || false;

  const onClick = (tag: string) => {
    switch (tag) {
      case 'check':
        // 用户名点击处理
        break;
      case 'privicy':
        // 手机号/性别点击处理
        break;
      case 'evaluate':
        // 微信点击处理
        break;
      case 'apple':
        // Apple 账号绑定处理
        if (Platform.OS !== 'ios') {
          Toast('Apple 登录仅支持 iOS 设备');
          return;
        }
        handleAppleBind();
        break;
      case 'clear':
        // 修改密码点击处理
        break;
    }
  };

  const handleAppleBind = async () => {
    if (Platform.OS !== 'ios') {
      Toast('Apple 登录仅支持 iOS 设备');
      return;
    }

    try {
      setLoading(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // 先尝试直接绑定（merge=false）
      await store.appleBind({ identityToken: credential.identityToken }, false, async result => {
        setLoading(false);
        if (result?.statusCode === 200) {
          if (result.data?.merged) {
            // 如果需要合并账户，显示确认对话框
            setPendingCredential({ identityToken: credential.identityToken });
            setMergeDialogVisible(true);
          } else {
            // 直接绑定成功
            Toast('Apple 账号绑定成功');
            // 刷新用户信息
            await store.getInfo();
          }
        }
      });
    } catch (error: any) {
      setLoading(false);
      // 用户取消登录不显示错误
      if (error.code === 'ERR_CANCELED') {
        return;
      }
      console.log('Apple 绑定失败', error);
      Toast('Apple 绑定失败，请重试');
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
          // 刷新用户信息
          await store.getInfo();
        }
      });
    } catch (error) {
      setLoading(false);
      console.log('账户合并失败', error);
    }
    setPendingCredential(null);
  };

  const handleMergeCancel = () => {
    setMergeDialogVisible(false);
    setPendingCredential(null);
  };

  const toLogout = () => {
    ActionSheet({
      actions: ['确认'],
      cancelText: '取消',
      description: '确认退出登录吗？',
    })
      .then(() => {
        store.logout();
        router.back();
      })
      .catch(e => {});
  };

  useEffect(() => {}, []);

  return (
    <Page>
      <View className="flex-col gap-y-2.5 pb-10">
        {store.uInfo && (
          <FieldGroup>
            <FieldItem
              title="用户名"
              rightText={store.uInfo.username}
              onPress={() => onClick('check')}
            />
            <FieldItem
              title="手机号"
              rightText={store.uInfo.phone}
              onPress={() => onClick('privicy')}
            />
            <FieldItem
              title="性别"
              rightText={String(store.uInfo.sex)}
              onPress={() => onClick('privicy')}
            />
            <FieldItem
              title="微信"
              rightText={store.uInfo.openid ? '已绑定' : '未绑定'}
              onPress={() => onClick('evaluate')}
            />
            {Platform.OS === 'ios' && (
              <FieldItem
                title="Apple ID"
                rightText={isAppleBound ? '已绑定' : '未绑定'}
                onPress={() => {
                  if (isAppleBound) {
                    Toast('Apple ID 已绑定');
                  } else {
                    onClick('apple');
                  }
                }}
              />
            )}
            <FieldItem title="修改密码" onPress={() => onClick('clear')} />
          </FieldGroup>
        )}
      </View>
      {/* 账户合并确认对话框 */}
      <Dialog
        visible={mergeDialogVisible}
        title="账户合并"
        showCancelButton
        onPressConfirm={handleMergeConfirm}
        confirmButtonText="确认合并"
        cancelButtonText="取消"
        onPressCancel={handleMergeCancel}>
        <View style={{ paddingHorizontal: 20, paddingVertical: 10 }}>
          <Text>
            检测到该 Apple ID 已绑定其他账户。合并后，将保留当前账户，删除另一个账户。是否确认合并？
          </Text>
        </View>
      </Dialog>
    </Page>
  );
};

export default App;

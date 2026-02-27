import { Page } from '@/components/business';
import { ActionSheet, Dialog, FieldGroup, FieldItem, Toast } from '@/components/ui';
import {
  usePlanStore,
  useRecordStore,
  useUserStore,
} from '@/stores';
import { stopAppLimits } from '@/utils/permission';
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
      // 检查 Apple 登录是否可用
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
      if (error.code === 'ERR_REQUEST_CANCELED') {
        return;
      }
      console.log('Apple 绑定失败', error);
      // 根据文档的错误代码提供更详细的错误信息
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
    const pstore = usePlanStore.getState();
    const rstore = useRecordStore.getState();
    const hasFocus =
      !!rstore.record_id || (!!pstore.active_plan && pstore.is_focus_mode());

    ActionSheet({
      actions: ['确认'],
      cancelText: '取消',
      description: hasFocus
        ? '退出登录将会结束当前专注，是否继续？'
        : '确认退出登录吗？',
    })
      .then(async () => {
        if (hasFocus && Platform.OS === 'ios') {
          await stopAppLimits();
          await pstore.exitPlan();
        }
        store.logout();
        router.back();
      })
      .catch(() => {});
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
              rightText={store.uInfo.phone || '点击绑定'}
              onPress={() => {
                if (store.uInfo?.phone) {
                  onClick('privicy');
                } else {
                  router.push({ pathname: '/login', params: { type: 'bind' } });
                }
              }}
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

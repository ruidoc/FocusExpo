import { Page } from '@/components/business';
import { ActionSheet, FieldGroup, FieldItem } from '@/components/ui';
import { useUserStore } from '@/stores';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { View } from 'react-native';

const App = () => {
  const store = useUserStore();

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
      case 'clear':
        // 修改密码点击处理
        break;
    }
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
            <FieldItem title="修改密码" onPress={() => onClick('clear')} />
          </FieldGroup>
        )}
      </View>
    </Page>
  );
};

export default App;

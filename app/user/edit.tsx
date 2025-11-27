import { Page } from '@/components/business';
import { ActionSheet, Divider, Flex } from '@/components/ui';
import { UserStore } from '@/stores';
import Icon from '@expo/vector-icons/Ionicons';
import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import { observer, useLocalObservable } from 'mobx-react';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const App = observer(() => {
  const store = useLocalObservable(() => UserStore);
  const { colors, dark } = useTheme();

  const ItemDom = (label: string, opts: any) => (
    <TouchableOpacity onPress={() => onClick(opts.tag)} activeOpacity={0.7}>
      <Flex className="justify-between" style={styles.itemBox}>
        <Text style={styles.itemText}>{label}</Text>
        <Flex>
          <Text style={styles.labelText}>{opts.label}</Text>
          <Icon
            name="chevron-forward"
            style={styles.labelText}
            size={17}
            color={colors.text}
          />
        </Flex>
      </Flex>
      {!opts.noborder && <Divider />}
    </TouchableOpacity>
  );

  const onClick = (tag: string) => {
    switch (tag) {
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

  const styles = StyleSheet.create({
    userBox: {
      paddingHorizontal: 30,
      paddingBottom: 30,
      paddingTop: 75,
      // borderBottomColor: colors.border,
      // borderBottomWidth: 0.5,
      marginBottom: 10,
      // backgroundColor: colors.card,
    },
    userTitle: {
      fontSize: 25,
      marginBottom: 5,
      fontWeight: '500',
      color: colors.text,
    },
    userDesc: {
      fontSize: 14,
      color: '#666',
    },
    itemBoxWrap: {
      marginBottom: 20,
      overflow: 'hidden',
      backgroundColor: colors.card,
    },
    itemBox: {
      paddingHorizontal: 16,
      paddingVertical: 15,
    },
    itemText: {
      fontSize: 16,
      color: colors.text,
    },
    labelText: {
      fontSize: 16,
      color: colors.text,
      opacity: 0.5,
    },
    avator: {
      width: 60,
      height: 60,
      borderRadius: 21,
      marginRight: 14,
    },
  });

  return (
    <Page>
      {/* <View
        style={{ backgroundColor: '#232323', height: 0.5, margin: 0 }}></View> */}
      <Divider />
      <Flex className="flex-col" style={{ gap: 10, paddingBottom: 40 }}>
        {store.uInfo && (
          <View style={styles.itemBoxWrap}>
            {ItemDom('用户名', { tag: 'check', label: store.uInfo.username })}
            {ItemDom('手机号', { tag: 'privicy', label: store.uInfo.phone })}
            {ItemDom('性别', { tag: 'privicy', label: store.uInfo.sex })}
            {ItemDom('微信', {
              tag: 'evaluate',
              label: store.uInfo.openid ? '已绑定' : '未绑定',
            })}
            {ItemDom('修改密码', { tag: 'clear', noborder: true })}
          </View>
        )}
      </Flex>
    </Page>
  );
});

export default App;

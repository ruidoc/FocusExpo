import { CusCard, CusPage } from '@/components';
import { AppStore, HomeStore } from '@/stores';
import Icon from '@expo/vector-icons/Ionicons';
import { Flex, NoticeBar, Space } from '@fruits-chain/react-native-xiaoshu';
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { observer, useLocalObservable } from 'mobx-react';
import React, { useEffect, useState } from 'react';

import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const App = observer(() => {
  const store = useLocalObservable(() => HomeStore);
  const astore = useLocalObservable(() => AppStore);
  const [refreshing, setRefreshing] = useState(false);
  const { colors, dark } = useTheme();

  const router = useRouter();

  const styles = StyleSheet.create({
    cardTitle: {
      padding: 14,
      borderBottomColor: '#f5f5f5',
      borderBottomWidth: 0.5,
    },
    title: {
      color: colors.text,
      fontSize: 16,
      fontWeight: 'bold',
    },
    desc: {
      color: '#888',
      fontSize: 12,
      marginTop: 2,
    },
    appWrap: {
      width: '25%',
      marginBottom: 16,
    },
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 18,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderWidth: 0.5,
      borderColor: dark ? '#333' : '#E0E3E8',
    },
    addIcon: {
      color: colors.primary,
      marginLeft: 2,
      fontSize: 14,
    },
  });

  const onRefresh = () => {
    setRefreshing(true);
    astore.getCurapp().finally(() => {
      setRefreshing(false);
    });
  };

  const initapp = () => {
    astore.getCurapp();
  };

  const toAddApp = (mode: string) => {
    router.push({
      pathname: '/apps/add',
      params: {
        mode,
      },
    });
  };

  useEffect(() => {
    initapp();
  }, []);

  const AppItem = (app: any) => (
    <Flex
      key={app.packageName}
      style={styles.appWrap}
      direction="column"
      align="center">
      <Image
        source={{
          uri: 'data:image/jpeg;base64,' + app.icon,
          width: 50,
          height: 50,
        }}
      />
      <Text style={styles.desc}>{app.appName}</Text>
    </Flex>
  );

  return (
    <CusPage>
      <NoticeBar
        wrapable
        message="开始专注时，会对下方选择的APP生效"
        status="primary"
      />
      <ScrollView
        style={{ padding: 15 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <Space gap={20}>
          <CusCard
            title="专注的APP"
            desc="推荐添加学习相关的应用"
            action={
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.addBtn}
                onPress={() => toAddApp('focus')}>
                <Icon name="add" size={20} color={colors.primary} />
                <Text style={styles.addIcon}>添加</Text>
              </TouchableOpacity>
            }>
            {store.all_apps.filter(r =>
              astore.focus_apps.includes(r.packageName),
            ).length === 0 ? (
              <View style={{ alignItems: 'center', padding: 24 }}>
                <Icon name="ban-outline" size={30} color="#ccc" />
                <Text style={{ color: '#aaa', marginTop: 8, fontSize: 14 }}>
                  还没有添加APP哦
                </Text>
              </View>
            ) : (
              <Flex wrap="wrap" justify="start">
                {store.all_apps
                  .filter(r => astore.focus_apps.includes(r.packageName))
                  .map(app => AppItem(app))}
              </Flex>
            )}
          </CusCard>
          <CusCard
            title="屏蔽的APP"
            desc="推荐添加游戏、短视频、社交类应用"
            action={
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.addBtn}
                onPress={() => toAddApp('shield')}>
                <Icon name="add" size={20} color={colors.primary} />
                <Text style={styles.addIcon}>添加</Text>
              </TouchableOpacity>
            }>
            {store.all_apps.filter(r =>
              astore.shield_apps.includes(r.packageName),
            ).length === 0 ? (
              <View style={{ alignItems: 'center', padding: 24 }}>
                <Icon name="ban-outline" size={30} color="#ccc" />
                <Text style={{ color: '#aaa', marginTop: 8, fontSize: 14 }}>
                  还没有添加APP哦
                </Text>
              </View>
            ) : (
              <Flex wrap="wrap" justify="start">
                {store.all_apps
                  .filter(r => astore.shield_apps.includes(r.packageName))
                  .map(app => AppItem(app))}
              </Flex>
            )}
          </CusCard>
        </Space>
      </ScrollView>
    </CusPage>
  );
});

export default App;

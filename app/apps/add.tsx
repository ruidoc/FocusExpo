import { Page } from '@/components/business';
import { Flex } from '@/components/ui';
import { AppStore, GuideStore, HomeStore, UserStore } from '@/stores';
import Icon from '@expo/vector-icons/Ionicons';
import { Space } from '@fruits-chain/react-native-xiaoshu';
import { useNavigation, useRoute, useTheme } from '@react-navigation/native';
import { observer, useLocalObservable } from 'mobx-react';
import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const App = observer(() => {
  const store = useLocalObservable(() => HomeStore);
  const astore = useLocalObservable(() => AppStore);
  const ustore = useLocalObservable(() => UserStore);
  const gstore = useLocalObservable(() => GuideStore);
  const { colors, dark } = useTheme();

  const navigation = useNavigation();
  const route = useRoute();

  let [selApps, setSelApps] = useState([]);
  const [isedit, setIsedit] = useState(true);
  const mode = useRef('');
  const sel_apps = useRef<string[]>([]);

  const styles = StyleSheet.create({
    cardTitle: {
      borderTopColor: colors.border,
      borderTopWidth: 0.5,
      backgroundColor: colors.card,
    },
    cardBody: {
      flex: 1,
      borderTopColor: colors.border,
      borderTopWidth: 0.5,
      backgroundColor: colors.card,
      // marginTop: 14,
    },
    title: {
      color: colors.primary,
      fontSize: 13,
      paddingHorizontal: 20,
      paddingTop: 10,
      fontWeight: '500',
    },
    title2: {
      color: colors.primary,
      fontSize: 13,
      paddingHorizontal: 20,
      paddingVertical: 10,
      fontWeight: '500',
      borderBottomColor: colors.border,
      borderBottomWidth: 0.5,
      // borderBottomColor: '#eee',
      // borderBottomWidth: 0.5,
    },
    desc: {
      color: '#888',
      fontSize: 12,
    },
    appWrap: {
      width: '20%',
      marginBottom: 16,
    },
    itemWrap: {
      width: '88%',
      borderRadius: 8,
    },
    removeIcon: {
      position: 'absolute',
      backgroundColor: 'white',
      borderRadius: 15,
      top: -45,
      right: -23,
    },
  });

  const initapp = () => {
    mode.current = (route.params as any).mode;
    if (mode.current === 'focus') {
      navigation.setOptions({ title: '添加专注的APP' });
      setSelApps([...astore.focus_apps]);
      sel_apps.current = [...astore.focus_apps];
    } else {
      navigation.setOptions({ title: '添加屏蔽的APP' });
      setSelApps([...astore.shield_apps]);
      sel_apps.current = [...astore.shield_apps];
    }
  };

  const toSave = async () => {
    if (!isedit) {
      setIsedit(true);
    } else {
      if (!ustore.uInfo) {
        // 未登录，保存到GuideStore
        gstore.setSelectedApps(sel_apps.current);
        navigation.goBack();
        return;
      }
      if (mode.current === 'focus') {
        await astore.updateApps({
          focus_apps: sel_apps.current,
        });
      } else {
        await astore.updateApps({
          shield_apps: sel_apps.current,
        });
      }
      navigation.goBack();
    }
  };

  const appChange = (pname: string) => {
    if (!isedit) return;
    setSelApps(apps => {
      let index = apps.findIndex(r => r === pname);
      if (index > -1) {
        apps.splice(index, 1);
      } else {
        apps.push(pname);
      }
      sel_apps.current = apps;
      return [...apps];
    });
  };

  useEffect(() => {
    initapp();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={toSave} activeOpacity={0.6}>
          <Text style={{ color: colors.primary, fontSize: 17 }}>
            {isedit ? '保存' : '编辑'}
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [isedit]);

  const AppItem = (app: any, row = false) => (
    <Flex
      key={app.packageName}
      style={row ? { width: 63 } : styles.appWrap}
      onPress={() => (row ? null : appChange(app.packageName))}
      className="justify-center">
      <Space align="center" style={styles.itemWrap} gap={0}>
        <Image
          source={{
            uri: 'data:image/jpeg;base64,' + app.icon,
            width: 44,
            height: 44,
          }}
        />
        {row && isedit && (
          <Icon
            name="remove-circle"
            color="red"
            size={19}
            onPress={() => appChange(app.packageName)}
            style={styles.removeIcon}
          />
        )}
        <Text style={styles.desc} numberOfLines={1}>
          {app.appName}
        </Text>
      </Space>
    </Flex>
  );
  return (
    <Page>
      <View style={styles.cardTitle}>
        {selApps[0] && (
          <Text style={styles.title}>已添加 {selApps.length} 个 APP</Text>
        )}
        {selApps[0] && (
          <ScrollView horizontal style={{ maxHeight: 80 }}>
            <Flex style={{ padding: 14 }}>
              {store.all_apps
                .filter(r => selApps.includes(r.packageName))
                .map(app => AppItem(app, true))}
            </Flex>
          </ScrollView>
        )}
        {!selApps[0] && (
          <Flex className="justify-center py-6">
            <Text style={{ color: '#999', textAlign: 'center' }}>
              暂未添加APP
            </Text>
          </Flex>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.title2}>
          可添加 {store.all_apps.length - selApps.length} 个 APP ，点击图标添加
        </Text>
        {/* <NoticeBar message="点击下方APP选择" status="primary" /> */}
        <ScrollView style={{ flex: 1 }}>
          <Flex className="flex-wrap px-3.5">
            {store.all_apps
              .filter(r => !selApps.includes(r.packageName))
              .map(app => AppItem(app))}
          </Flex>
        </ScrollView>
      </View>
    </Page>
  );
});

export default App;

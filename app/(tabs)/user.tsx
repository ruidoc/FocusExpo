import { Divider, Flex } from '@/components/ui';
import { UserStore } from '@/stores';
import { toast } from '@/utils';
import Icon from '@expo/vector-icons/Ionicons';
import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import { observer, useLocalObservable } from 'mobx-react';
import React, { useEffect } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const App = observer(() => {
  const store = useLocalObservable(() => UserStore);
  const { colors, dark } = useTheme();

  const toLogin = () => {
    if (!store.uInfo) {
      router.push('/login/wx');
    } else {
      router.push('/user/edit');
    }
  };

  const toNavigate = (route: any) => {
    if (route === 'Vip') {
      return toast('VIP功能暂未开放');
    }
    if (route) {
      router.push(route);
    }
  };

  const ItemDom = (color: string, label: string, icon: any, opts: any = {}) => (
    <TouchableOpacity
      onPress={() => toNavigate(opts.route || '')}
      activeOpacity={0.7}>
      <Flex className="justify-between" style={{ ...styles.itemBox }}>
        <Flex>
          <View
            style={{
              backgroundColor: color,
              padding: 5,
              borderRadius: 9,
            }}>
            <Icon name={icon} size={opts.size || 17} color="#ffffff99" />
          </View>
          <Text style={styles.itemText}>{label}</Text>
        </Flex>
        <Icon name="chevron-forward" size={17} color={colors.text} />
      </Flex>
      {opts.border && <Divider />}
    </TouchableOpacity>
  );

  useEffect(() => {}, []);

  const styles = StyleSheet.create({
    userBox: {
      paddingHorizontal: 30,
      paddingBottom: 30,
      paddingTop: 75,
      marginBottom: 10,
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
      marginHorizontal: 20,
      borderRadius: 10,
      overflow: 'hidden',
    },
    itemBox: {
      backgroundColor: colors.card,
      paddingHorizontal: 16,
      paddingVertical: 15,
    },
    itemText: {
      fontSize: 17,
      color: colors.text,
      marginLeft: 14,
    },
    avator: {
      width: 60,
      height: 60,
      borderRadius: 20,
      marginRight: 14,
    },
  });

  return (
    <ScrollView style={{ flex: 1 }}>
      <Flex className="justify-between" style={styles.userBox}>
        <Flex onPress={toLogin}>
          {store.uInfo?.avatar && (
            <Image source={{ uri: store.uInfo.avatar }} style={styles.avator} />
          )}
          {!store.uInfo?.avatar && (
            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.avator}
            />
          )}
          <View>
            {store.uInfo && (
              <>
                <Text style={styles.userTitle}>{store.uInfo.username}</Text>
                <Text style={styles.userDesc}>{store.uInfo.phone}</Text>
              </>
            )}
            {!store.uInfo && <Text style={styles.userTitle}>请登录</Text>}
          </View>
        </Flex>
        {store.uInfo && (
          <TouchableOpacity
            onPress={() => toNavigate('user/vip')}
            activeOpacity={0.7}>
            <Flex
              className="justify-center"
              style={{
                backgroundColor: dark ? '#232323' : '#ffffff',
                padding: 8,
                paddingHorizontal: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'transparent',
              }}>
              <Icon name="diamond-outline" size={18} color="#FFC107" />
              <Text style={{ color: '#FFC107', fontSize: 14, marginLeft: 5 }}>
                VIP
              </Text>
            </Flex>
          </TouchableOpacity>
        )}
      </Flex>
      <Flex className="flex-col items-stretch gap-2">
        {store.uInfo && (
          <View style={styles.itemBoxWrap}>
            {ItemDom('#FFA238', '打卡', 'brush-sharp', {
              size: 15,
              route: 'punchCard',
            })}
          </View>
        )}
        <View style={styles.itemBoxWrap}>
          {ItemDom('#34B545', '权限管理', 'cube-sharp', {
            border: true,
            route: 'setting/permission',
          })}
          {ItemDom('#1BA2FC', '意见反馈', 'mail-open', {
            border: true,
            route: 'setting/feedback',
          })}
          {ItemDom('#0065FE', '关于我们', 'people-sharp', {
            route: 'setting/about',
          })}
        </View>
        <View style={styles.itemBoxWrap}>
          {ItemDom('#7D45E6', '设置', 'settings-sharp', { route: 'setting' })}
        </View>
        {/* {store.uInfo && (
          <TouchableOpacity onPress={toLogout} activeOpacity={0.7}>
            <Flex className="justify-center" style={styles.itemBox}>
              <Text style={styles.itemText}>退出</Text>
            </Flex>
          </TouchableOpacity>
        )} */}
      </Flex>
    </ScrollView>
  );
});

export default App;

import { FieldGroup, FieldItem, Flex } from '@/components/ui';
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

  // 创建带背景色的图标组件
  const ColoredIcon = ({
    color,
    icon,
    size = 17,
  }: {
    color: string;
    icon: keyof typeof Icon.glyphMap;
    size?: number;
  }) => (
    <View
      style={{
        backgroundColor: color,
        padding: 5,
        borderRadius: 9,
      }}>
      <Icon name={icon} size={size} color="#ffffff99" />
    </View>
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
          <FieldGroup className="rounded-[10px] mx-5">
            <FieldItem
              icon={<ColoredIcon color="#FFA238" icon="brush-sharp" />}
              title="打卡"
              onPress={() => toNavigate('punchCard')}
              titleStyle={{ fontSize: 17, marginLeft: 10 }}
            />
          </FieldGroup>
        )}
        <FieldGroup className="rounded-[10px] mx-5">
          <FieldItem
            icon={<ColoredIcon color="#34B545" icon="cube-sharp" />}
            title="权限管理"
            onPress={() => toNavigate('setting/permission')}
            titleStyle={{ fontSize: 17, marginLeft: 10 }}
          />
          <FieldItem
            icon={<ColoredIcon color="#1BA2FC" icon="mail-open" />}
            title="意见反馈"
            onPress={() => toNavigate('setting/feedback')}
            titleStyle={{ fontSize: 17, marginLeft: 10 }}
          />
          <FieldItem
            icon={<ColoredIcon color="#0065FE" icon="people-sharp" />}
            title="关于我们"
            onPress={() => toNavigate('setting/about')}
            titleStyle={{ fontSize: 17, marginLeft: 10 }}
          />
        </FieldGroup>
        <FieldGroup className="rounded-[10px] mx-5">
          <FieldItem
            icon={<ColoredIcon color="#7D45E6" icon="settings-sharp" />}
            title="设置"
            onPress={() => toNavigate('setting')}
            titleStyle={{ fontSize: 17, marginLeft: 10 }}
          />
        </FieldGroup>
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

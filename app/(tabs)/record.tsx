import { UserStore } from '@/stores';
import { toast } from '@/utils';
import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import { observer, useLocalObservable } from 'mobx-react';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

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
      <Text>统计</Text>
    </ScrollView>
  );
});

export default App;

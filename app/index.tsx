import { HomeStore, PermisStore, UserStore } from '@/stores';
import {
  checkScreenTimePermission,
  getSelectIosApps,
} from '@/utils/permission';
import { Redirect } from 'expo-router';
import { observer, useLocalObservable } from 'mobx-react';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';

const Index = observer(() => {
  const store = useLocalObservable(() => UserStore);
  const hstore = useLocalObservable(() => HomeStore);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // 等待UserStore初始化完成
    const checkInitialization = async () => {
      // 给一个小的延迟确保AsyncStorage操作完成
      setTimeout(async () => {
        initAction();
        setIsInitialized(true);
      }, 100);
    };

    checkInitialization();
  }, []);

  const initAction = async () => {
    // 确保iOS全局初始化完成
    if (Platform.OS === 'ios') {
      try {
        // 获取选中的iOS应用
        const selectedApps = await getSelectIosApps();
        hstore.setSelectedAppIcons(selectedApps);
        // 检查屏幕时间权限
        const screenTimeStatus = await checkScreenTimePermission();
        const isApproved = screenTimeStatus === 'approved';
        hstore.setIOSScreenTimePermission(isApproved);
        // 检查通知权限
        await PermisStore.checkNotify();
      } catch (error) {
        console.log('Index组件：iOS全局初始化失败:', error);
      }
    }
  };

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const initialRoute = store.uInfo ? '/(tabs)' : '/(guides)/step1';
  // const initialRoute = '/(tabs)';

  return <Redirect href={initialRoute} />;
});

export default Index;

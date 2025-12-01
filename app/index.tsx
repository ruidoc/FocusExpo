import { useHomeStore, usePermisStore } from '@/stores';
import { checkScreenTimePermission } from '@/utils/permission';
import { Redirect } from 'expo-router';
import { observer } from 'mobx-react';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';

const Index = observer(() => {
  const hstore = useHomeStore();
  const pmstore = usePermisStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initAction = async () => {
      if (Platform.OS === 'ios') {
        try {
          const screenTimeStatus = await checkScreenTimePermission();
          const isApproved = screenTimeStatus === 'approved';
          hstore.setIOSScreenTimePermission(isApproved);
          await pmstore.checkNotify();
        } catch (error) {
          console.log('Index组件：iOS全局初始化失败:', error);
        }
      }
    };
    // 异步初始化
    setTimeout(async () => {
      await initAction();
      setIsInitialized(true);
    }, 100);
  }, []);

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // const initialRoute = store.uInfo ? '/(tabs)' : '/(guides)/step1';
  const initialRoute = '/(tabs)';

  return <Redirect href={initialRoute} />;
});

export default Index;

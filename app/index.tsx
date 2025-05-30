import { UserStore } from '@/stores';
import { Redirect } from 'expo-router';
import { observer, useLocalObservable } from 'mobx-react';

const Index = observer(() => {
  const store = useLocalObservable(() => UserStore);
  const initialRoute = store.uInfo ? '/(tabs)' : '/(guides)/step1';

  return <Redirect href={initialRoute} />;
});

export default Index;

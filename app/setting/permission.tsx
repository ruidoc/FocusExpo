import { CusPage } from '@/components';
import CustomDivider from '@/components/cus-divider';
import { PermisStore } from '@/stores';
import { Switch } from '@fruits-chain/react-native-xiaoshu';
import { useTheme } from '@react-navigation/native';
import { observer, useLocalObservable } from 'mobx-react';
import React, { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const App = observer(() => {
  const store = useLocalObservable(() => PermisStore);
  const { colors } = useTheme();

  const ItemDom = (label: string, opts: any) => (
    <TouchableOpacity activeOpacity={0.7}>
      <View className="flex-row justify-between items-center px-4 py-[15px]">
        <Text className="text-base" style={{ color: colors.text }}>
          {label}
        </Text>
        <Switch
          value={opts.open}
          disabled={opts.open}
          size={22}
          onChange={() => onClick(opts.tag)}
        />
      </View>
      {!opts.noborder && <CustomDivider />}
    </TouchableOpacity>
  );

  const onClick = (tag: string) => {
    switch (tag) {
      case 'notify':
        return store.openNotify(true);
      case 'battery':
        return store.checkBattery(true);
    }
  };

  useEffect(() => {
    store.checkBattery();
    store.checkNotify();
  }, []);

  return (
    <CusPage>
      <CustomDivider />
      <View className="flex-col gap-y-2.5 pb-10">
        <View
          className="mb-5 overflow-hidden"
          style={{ backgroundColor: colors.card }}>
          {ItemDom('允许通知', { tag: 'notify', open: store.pm_notify })}
          {ItemDom('关闭电池优化', {
            tag: 'battery',
            open: store.pm_battery,
            noborder: true,
          })}
        </View>
      </View>
    </CusPage>
  );
});

export default App;

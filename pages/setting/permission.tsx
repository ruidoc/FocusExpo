import React, { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { CusPage } from '@/components';
import { StyleSheet } from 'react-native';
import { Flex, Space, Switch } from '@fruits-chain/react-native-xiaoshu';
import { useNavigation, useTheme } from '@react-navigation/native';
import { observer, useLocalObservable } from 'mobx-react';
import { PermisStore } from '@/stores';
import { toast } from '@/utils';
import CustomDivider from '@/components/cus-divider';

const App = observer(() => {
  const store = useLocalObservable(() => PermisStore);
  const { colors, dark } = useTheme();
  const navigation = useNavigation();

  const ItemDom = (label: string, opts: any) => (
    <TouchableOpacity activeOpacity={0.7}>
      <Flex justify="between" align="center" style={styles.itemBox}>
        <Text style={styles.itemText}>{label}</Text>
        <Switch
          value={opts.open}
          disabled={opts.open}
          size={22}
          onChange={() => onClick(opts.tag)}
        />
      </Flex>
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

  const styles = StyleSheet.create({
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
  });

  return (
    <CusPage>
      <CustomDivider />
      <Space gapVertical={10} tail={40}>
        <View style={styles.itemBoxWrap}>
          {ItemDom('允许通知', { tag: 'notify', open: store.pm_notify })}
          {ItemDom('关闭电池优化', {
            tag: 'battery',
            open: store.pm_battery,
            noborder: true,
          })}
        </View>
      </Space>
    </CusPage>
  );
});

export default App;

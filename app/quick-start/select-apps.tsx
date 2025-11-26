import { AppToken } from '@/components';
import { AppStore, HomeStore } from '@/stores';
import { Flex } from '@fruits-chain/react-native-xiaoshu';
import { observer, useLocalObservable } from 'mobx-react-lite';
import React, { useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';

const TimeSlider = () => {
  const store = useLocalObservable(() => HomeStore);
  const astore = useLocalObservable(() => AppStore);

  useEffect(() => { }, []);

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 2 }}>
        <Flex direction="row" align="center" className="gap-0">
          {astore.ios_selected_apps.map(item => (
            <AppToken key={item.stableId} app={item} size={23} />
          ))}
        </Flex>
      </ScrollView>
      {astore.ios_selected_apps.length === 0 && (
        <Flex
          direction="row"
          align="center"
          justify="center"
          className="p-4">
          <Text className="text-[#999] text-base">
            请添加APP
          </Text>
        </Flex>
      )}
    </View>
  );
};

export default observer(TimeSlider);

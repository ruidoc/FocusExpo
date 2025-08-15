import TokenLabel from '@/components/native/TokenLabel';
import { HomeStore } from '@/stores';
import { selectAppsToLimit } from '@/utils/permission';
import Icon from '@expo/vector-icons/Ionicons';
import { Flex } from '@fruits-chain/react-native-xiaoshu';
import { useTheme } from '@react-navigation/native';
import { observer, useLocalObservable } from 'mobx-react-lite';
import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const TimeSlider = () => {
  const store = useLocalObservable(() => HomeStore);
  const { dark, colors } = useTheme();

  const selectApps = () => {
    selectAppsToLimit().then(data => {
      store.setSelectedAppIcons(data.apps);
    });
  };

  useEffect(() => {}, []);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: dark ? '#222' : '#fff',
          shadowColor: dark ? 'transparent' : '#000',
        },
      ]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 2 }}>
        <Flex
          direction="row"
          align="center"
          style={{ gap: 6 }}
          onPress={selectApps}>
          {store.selected_app_icons.map(item => (
            <TokenLabel
              key={item.id}
              tokenBase64={item.tokenData}
              tokenType={item.type}
              size={40}
              style={{ width: 40, height: 40 }}
            />
          ))}
        </Flex>
      </ScrollView>
      {store.selected_app_icons.length === 0 && (
        <Flex
          direction="row"
          align="center"
          justify="center"
          onPress={selectApps}>
          <Icon name="add" size={20} color="#fff" style={{ marginRight: 6 }} />
          <Text
            style={{
              color: '#fff',
              fontSize: 15,
            }}>
            添加APP
          </Text>
        </Flex>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    borderRadius: 16,
    paddingHorizontal: 5,
    paddingVertical: 20,
  },
});

export default observer(TimeSlider);

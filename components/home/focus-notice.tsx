import { RecordStore } from '@/stores';
import Icon from '@expo/vector-icons/Ionicons';
import { Space } from '@fruits-chain/react-native-xiaoshu';
import { useTheme } from '@react-navigation/native';
import { observer, useLocalObservable } from 'mobx-react';
import React from 'react';
import { Text } from 'react-native';

const FocusNotice: React.FC = () => {
  const rstore = useLocalObservable(() => RecordStore);
  const { colors, dark } = useTheme();

  const bannerStyle = {
    backgroundColor: dark ? '#162312' : '#49AA1910',
    borderTopColor: colors.border,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 18,
    marginTop: 5,
    marginBottom: 13,
  };

  return (
    <Space
      direction="horizontal"
      align="center"
      gap={5}
      head={12}
      style={bannerStyle}>
      <Icon name="notifications" size={16} color="#49AA19" />
      <Text style={{ fontSize: 13, color: '#49AA19' }}>
        今日累计专注{rstore.formatMinute}
        {rstore.exit_count > 0 && <Text>，中途退出{rstore.exit_count}次</Text>}
      </Text>
    </Space>
  );
};

export default observer(FocusNotice);

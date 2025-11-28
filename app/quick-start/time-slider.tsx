import { Flex, Slider } from '@/components/ui';
import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

interface Props {
  minute: number;
  setMinute: (m: number) => void;
}

function formatTime(minute: number) {
  if (minute < 60) return `${minute}分钟`;
  const h = Math.floor(minute / 60);
  const m = minute % 60;
  return m === 0 ? `${h}小时` : `${h}小时${m}分钟`;
}

const TimeSlider: React.FC<Props> = ({ minute, setMinute }) => {
  const [localMinute, setLocalMinute] = useState(minute);
  const { dark, colors } = useTheme();

  useEffect(() => {
    setLocalMinute(minute);
  }, [minute]);

  return (
    <View className="mb-2">
      <Text className={`text-base font-bold mb-0 text-center ${dark ? 'text-white' : 'text-[#222]'}`}>
        <Text
          className={`text-lg font-bold`}
          style={{ color: dark ? colors.primary : '#0065FE' }}>
          {formatTime(localMinute)}
        </Text>
      </Text>
      <Slider
        minimumValue={5}
        maximumValue={180}
        step={5}
        value={localMinute}
        onValueChange={setLocalMinute}
        onSlidingComplete={setMinute}
        minimumTrackTintColor={dark ? colors.primary : '#0065FE'}
        maximumTrackTintColor={dark ? '#444' : '#ccc'}
        thumbTintColor={dark ? colors.primary : '#0065FE'}
        useThemeColors={false}
        style={{ marginTop: 24 }}
      />
      <Flex className="justify-between px-0.5">
        <Text className={`text-[13px] ${dark ? 'text-[#aaa]' : 'text-[#888]'}`}>
          5分钟
        </Text>
        <Text className={`text-[13px] ${dark ? 'text-[#aaa]' : 'text-[#888]'}`}>
          3小时
        </Text>
      </Flex>
    </View>
  );
};

export default TimeSlider;

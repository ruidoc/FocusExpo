import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { Flex } from '@fruits-chain/react-native-xiaoshu';
import { useTheme } from '@react-navigation/native';

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
    <View
      style={[
        styles.container,
        {
          backgroundColor: dark ? '#222' : '#fff',
          shadowColor: dark ? 'transparent' : '#000',
        },
      ]}>
      <Text style={[styles.label, { color: dark ? '#fff' : '#222' }]}>
        <Text
          style={[styles.time, { color: dark ? colors.primary : '#0065FE' }]}>
          {formatTime(localMinute)}
        </Text>
      </Text>
      {/* @ts-ignore */}
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
        style={{ marginTop: 24 }}
      />
      <Flex justify="between" align="center" style={styles.rangeLabelRow}>
        <Text style={[styles.rangeLabel, { color: dark ? '#aaa' : '#888' }]}>
          5分钟
        </Text>
        <Text style={[styles.rangeLabel, { color: dark ? '#aaa' : '#888' }]}>
          3小时
        </Text>
      </Flex>
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
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  time: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  rangeLabelRow: {
    marginTop: 4,
    paddingHorizontal: 14,
  },
  rangeLabel: {
    fontSize: 13,
  },
});

export default TimeSlider;

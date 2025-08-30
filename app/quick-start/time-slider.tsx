import { Flex } from '@fruits-chain/react-native-xiaoshu';
import Slider from '@react-native-community/slider';
import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

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
    <View style={[styles.container]}>
      <Text style={[styles.label, { color: dark ? '#fff' : '#222' }]}>
        <Text
          style={[styles.time, { color: dark ? colors.primary : '#0065FE' }]}>
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
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 0,
    textAlign: 'center',
  },
  time: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  rangeLabelRow: {
    paddingHorizontal: 2,
  },
  rangeLabel: {
    fontSize: 13,
  },
});

export default TimeSlider;

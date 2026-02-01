import { Flex } from '@/components/ui';
import Icon from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';

interface Props {
  mode: 'focus' | 'shield';
  setMode: (mode: 'focus' | 'shield') => void;
  desc: string;
  focusApps: string[];
  shieldApps: string[];
  allApps: any[];
}

const MODE_COLORS = {
  focus: '#27ae60', // 绿色
  shield: '#e74c3c', // 红色
};

const ModeSwitcher: React.FC<Props> = ({
  mode,
  setMode,
  desc,
  focusApps,
  shieldApps,
  allApps,
}) => {
  const anim = useRef(new Animated.Value(mode === 'focus' ? 0 : 1)).current;

  const addApp = (m: 'focus' | 'shield') => {
    router.push({
      pathname: '/apps/add',
      params: {
        mode: m,
      },
    });
  };

  useEffect(() => {
    Animated.timing(anim, {
      toValue: mode === 'focus' ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [mode]);

  const bgColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [MODE_COLORS.focus, MODE_COLORS.shield],
  });

  return (
    <Animated.View
      className="rounded-2xl px-5 py-6 mx-5 mb-0"
      style={{ backgroundColor: bgColor }}>
      <View className="flex-row bg-white/30 self-center rounded-[10px] p-0 mb-3 w-[230px]">
        <Pressable
          className={`flex-1 bg-transparent rounded-[10px] min-w-[60px] m-0 py-2 items-center justify-center h-[38px] border-0 ${mode === 'focus' ? 'bg-white' : ''}`}
          style={mode === 'focus' ? {
            shadowColor: '#ddd',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.12,
            shadowRadius: 8,
          } : undefined}
          onPress={() => setMode('focus')}>
          <Text
            style={[
              { color: '#fff', fontWeight: 'bold', fontSize: 15, opacity: 0.8 },
              mode === 'focus' && { color: MODE_COLORS.focus, opacity: 1 },
            ]}>
            专注模式
          </Text>
        </Pressable>
        <Pressable
          className={`flex-1 bg-transparent rounded-[10px] min-w-[60px] m-0 py-2 items-center justify-center h-[38px] border-0 ${mode === 'shield' ? 'bg-white' : ''}`}
          style={mode === 'shield' ? {
            shadowColor: '#ddd',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.12,
            shadowRadius: 8,
          } : undefined}
          onPress={() => setMode('shield')}>
          <Text
            style={[
              { color: '#fff', fontWeight: 'bold', fontSize: 15, opacity: 0.8 },
              mode === 'shield' && { color: MODE_COLORS.shield, opacity: 1 },
            ]}>
            限制模式
          </Text>
        </Pressable>
      </View>
      <Text className="text-white text-[15px] mt-2 min-h-[22px] text-center">{desc}</Text>
      <Flex className="justify-center min-h-9 mt-3 mb-1.5 h-9">
        {(() => {
          const apps = mode === 'focus' ? focusApps : shieldApps;
          const showApps = allApps
            .filter(app => apps.includes(app.packageName))
            .slice(0, 4);
          if (apps.length === 0) {
            return (
              <Flex
                className="justify-center border border-white/70 rounded-[18px] px-3.5 py-1.5 bg-transparent min-w-[90px] min-h-9"
                onPress={() => addApp(mode)}>
                <Icon
                  name="add"
                  size={18}
                  color="#fff"
                  className="mr-1.5"
                />
                <Text className="text-white text-[15px] font-medium opacity-85">
                  添加APP
                </Text>
              </Flex>
            );
          }
          return (
            <Flex
              className="justify-center h-9 gap-2"
              onPress={() => addApp(mode)}>
              {showApps.map(app => (
                <View
                  key={app.packageName}
                  className="w-9 h-9 rounded-[18px] overflow-hidden bg-white mx-0"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.08,
                    shadowRadius: 2,
                    elevation: 1,
                  }}>
                  <Animated.Image
                    source={{ uri: 'data:image/jpeg;base64,' + app.icon }}
                    className="w-9 h-9 rounded-[18px]"
                    resizeMode="cover"
                  />
                </View>
              ))}
              {apps.length > 4 && (
                <View
                  className="w-9 h-9 rounded-[18px] justify-center items-center bg-[#eee]">
                  <Text className="text-xs text-[#888]">
                    +{apps.length - 4}
                  </Text>
                </View>
              )}
            </Flex>
          );
        })()}
      </Flex>
    </Animated.View>
  );
};

export default ModeSwitcher;

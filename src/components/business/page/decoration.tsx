import React from 'react';
import { ImageBackground, View } from 'react-native';

const BackgroundDecoration = () => {
  return (
    <View className="absolute inset-0 -z-[1]">
      {/* 主背景色 */}
      <View className="absolute inset-0 bg-[#0D0D12]" />

      {/* 背景渐变图片 */}
      <ImageBackground
        source={require('@/assets/images/background-gradient.png')}
        className="absolute -top-[200px] -left-[120px] w-[150%] h-[120%] opacity-40"
        resizeMode="cover"
      />

      {/* 顶部装饰点 */}
      <View className="absolute inset-0">
        {Array.from({ length: 30 }).map((_, index) => (
          <View
            key={index}
            className="absolute w-0.5 h-0.5 rounded-[1px] bg-white"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.4 + 0.1,
              transform: [{ scale: Math.random() * 0.8 + 0.5 }],
            }}
          />
        ))}
      </View>
    </View>
  );
};

export default BackgroundDecoration;

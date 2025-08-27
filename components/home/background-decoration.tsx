import React from 'react';
import {
  ImageBackground,
  StyleSheet,
  View,
} from 'react-native';

interface BackgroundDecorationProps {
  // 可以传入自定义样式
}

const BackgroundDecoration: React.FC<BackgroundDecorationProps> = () => {
  return (
    <View style={styles.container}>
      {/* 主背景色 */}
      <View style={styles.mainBackground} />
      
      {/* 背景渐变图片 */}
      <ImageBackground
        source={require('@/assets/images/background-gradient.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      {/* 顶部装饰点 */}
      <View style={styles.decorativeDots}>
        {Array.from({ length: 30 }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.4 + 0.1,
                transform: [{ scale: Math.random() * 0.8 + 0.5 }],
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  mainBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0D0D12',
  },
  backgroundImage: {
    position: 'absolute',
    top: -200,
    left: -120,
    width: '150%',
    height: '120%',
    opacity: 0.4,
  },
  decorativeDots: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dot: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#FFFFFF',
  },
});

export default BackgroundDecoration;

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import LottieView from 'lottie-react-native';

const CatAnimationScreen = () => {
  return (
    <View style={styles.container}>
      {/* 请将 cat.json 替换为你的小猫动画 Lottie 文件路径 */}
      <LottieView
        source={require('../assets/lottie/cat.json')}
        autoPlay
        loop
        style={styles.lottie}
      />
    </View>
  );
};

// 样式类型定义
interface Styles {
  container: ViewStyle;
  lottie: ViewStyle;
}

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottie: {
    width: 300,
    height: 300,
  },
});

export default CatAnimationScreen;

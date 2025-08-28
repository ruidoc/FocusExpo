import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
// import LottieView from 'lottie-react-native';

const CatAnimationScreen = () => {
  return (
    <View style={styles.container}>
      {/* <LottieView
        source={require('../assets/lottie/cat.json')}
        autoPlay
        loop
        style={styles.lottie}
      /> */}
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

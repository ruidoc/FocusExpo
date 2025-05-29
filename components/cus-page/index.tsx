import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { PageProps } from './type';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@react-navigation/native';

const App = (props: PageProps) => {
  const { dark } = useTheme();
  const AreaStyle: StyleProp<ViewStyle> = {
    // backgroundColor: dark ? Colors.darker : Colors.lighter,
    flex: 1,
    position: 'relative',
    // paddingTop: StatusBar.currentHeight,
  };
  if (props.bgcolor) {
    AreaStyle.backgroundColor = props.bgcolor;
  }

  const Wapper = props.safe ? SafeAreaView : View;

  return (
    <Wapper style={AreaStyle}>
      {/* <StatusBar
        translucent={true}
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} // 状态栏文字颜色
        backgroundColor={AreaStyle.backgroundColor} // 状态栏背景色
      /> */}
      {props.children}
    </Wapper>
  );
};

export default App;

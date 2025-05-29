import React, { Checkbox, Flex } from '@fruits-chain/react-native-xiaoshu';
import { Link, useTheme } from '@react-navigation/native';
import { ReactNode, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

interface Props {
  children: ReactNode;
}

const App = (props: Props) => {
  const { colors } = useTheme();
  const [agree, setAgree] = useState(false);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        // keyboardDismissMode="interactive" // 键盘消失模式
        keyboardShouldPersistTaps="handled" // 键盘消失后，点击事件是否继续生效
      >
        {props.children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default App;

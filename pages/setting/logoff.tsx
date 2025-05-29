import { toast } from '@/utils';
import {
  Button,
  Checkbox,
  Field,
  Flex,
  Space,
  TextInput,
} from '@fruits-chain/react-native-xiaoshu';
import { useTheme } from '@react-navigation/native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const App = () => {
  const { colors } = useTheme();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const logOff = () => {
    toast('申请成功，稍后我们会联系您');
  };

  return (
    <View style={styles.root}>
      <Space align="stretch" style={styles.wrap}>
        <Text style={{ fontSize: 16, color: colors.text }}>当前账号</Text>
        <View style={styles.inputWrap}>
          <TextInput value="17600574204" readOnly />
        </View>
      </Space>
      <Space align="stretch" style={styles.wrap}>
        <Text style={{ fontSize: 16, color: colors.text }}>注销原因</Text>
        <View style={styles.inputWrap}>
          <TextInput
            type="textarea"
            placeholder="请输入注销原因"
            placeholderTextColor={colors.border}
            value={reason}
            clearable
            onChange={setReason}
          />
        </View>
      </Space>
      <Button
        disabled={!reason}
        style={styles.wrap}
        loading={loading}
        onPress={logOff}>
        申请注销
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: 30,
  },
  wrap: {
    marginHorizontal: 20,
  },
  inputWrap: {
    backgroundColor: '#12121280',
    borderRadius: 9,
    marginBottom: 30,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
});

export default App;

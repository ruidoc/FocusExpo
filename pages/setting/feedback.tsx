import { toast } from '@/utils';
import {
  Button,
  Checkbox,
  Space,
  TextInput,
} from '@fruits-chain/react-native-xiaoshu';
import { useTheme } from '@react-navigation/native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const App = () => {
  const { colors, dark } = useTheme();
  const [reason, setReason] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(false);

  const options = [
    { label: '账号问题', value: '1' },
    { label: '功能建议', value: '2' },
    { label: '其他问题', value: '3' },
  ];

  const toSubmit = () => {
    toast('提交成功，感谢您的反馈！');
  };

  // 动态样式
  const dynamicStyles = {
    inputWrap: {
      backgroundColor: colors.card,
      borderRadius: 9,
      marginBottom: 30,
      paddingVertical: 15,
      paddingHorizontal: 15,
    },
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Space align="stretch" style={styles.wrap}>
        <Text style={{ fontSize: 16, color: colors.text }}>反馈类型</Text>
        <View style={dynamicStyles.inputWrap}>
          <Checkbox.Group
            value={type}
            iconSize={20}
            checkboxLabelTextStyle={{
              fontSize: 15.3,
              color: colors.text,
              opacity: 0.8,
            }}
            options={options}
            onChange={v => setType(v as string)}
          />
        </View>
      </Space>
      <Space align="stretch" style={styles.wrap}>
        <Text style={{ fontSize: 16, color: colors.text }}>反馈内容</Text>
        <View style={dynamicStyles.inputWrap}>
          <TextInput
            type="textarea"
            rows={4}
            placeholder="请输入您的意见和反馈，我们会尽快处理并改进"
            placeholderTextColor={colors.border}
            value={reason}
            clearable
            style={{ color: colors.text }}
            onChange={setReason}
          />
        </View>
      </Space>
      <Button
        disabled={!reason || !type}
        style={styles.wrap}
        loading={loading}
        onPress={toSubmit}>
        提交反馈
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
});

export default App;

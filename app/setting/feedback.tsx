import { toast } from '@/utils';
import {
  Button,
  Checkbox,
  TextInput,
} from '@fruits-chain/react-native-xiaoshu';
import { useTheme } from '@react-navigation/native';
import { useState } from 'react';
import { Text, View } from 'react-native';

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

  return (
    <View
      className="flex-1 pt-[30px]"
      style={{ backgroundColor: colors.background }}>
      <View className="flex-col items-stretch mx-5">
        <Text className="text-base" style={{ color: colors.text }}>
          反馈类型
        </Text>
        <View
          className="rounded-lg mb-[30px] py-[15px] px-[15px]"
          style={{ backgroundColor: colors.card }}>
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
      </View>
      <View className="flex-col items-stretch mx-5">
        <Text className="text-base" style={{ color: colors.text }}>
          反馈内容
        </Text>
        <View
          className="rounded-lg mb-[30px] py-[15px] px-[15px]"
          style={{ backgroundColor: colors.card }}>
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
      </View>
      <Button
        disabled={!reason || !type}
        style={{ marginHorizontal: 20 }}
        loading={loading}
        onPress={toSubmit}>
        提交反馈
      </Button>
    </View>
  );
};

export default App;

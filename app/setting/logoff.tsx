import { Button, TextInput } from '@/components/ui';
import { toast } from '@/utils';
import { useTheme } from '@react-navigation/native';
import { useState } from 'react';
import { Text, View } from 'react-native';

const App = () => {
  const { colors } = useTheme();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const logOff = () => {
    toast('申请成功，稍后我们会联系您');
  };

  return (
    <View className="flex-1 pt-[30px]">
      <View className="flex-col items-stretch mx-5">
        <Text className="text-base" style={{ color: colors.text }}>
          当前账号
        </Text>
        <View className="bg-[#12121280] rounded-lg mb-[30px] py-[10px] px-[15px]">
          <TextInput value="17600574204" readOnly />
        </View>
      </View>
      <View className="flex-col items-stretch mx-5">
        <Text className="text-base" style={{ color: colors.text }}>
          注销原因
        </Text>
        <View className="bg-[#12121280] rounded-lg mb-[30px] py-[10px] px-[15px]">
          <TextInput
            type="textarea"
            placeholder="请输入注销原因"
            placeholderTextColor={colors.border}
            value={reason}
            clearable
            onChange={setReason}
          />
        </View>
      </View>
      <Button
        disabled={!reason}
        style={{ marginHorizontal: 20 }}
        loading={loading}
        onPress={logOff}>
        申请注销
      </Button>
    </View>
  );
};

export default App;

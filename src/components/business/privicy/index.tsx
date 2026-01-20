import { Checkbox, Flex } from '@/components/ui';
import { useCustomTheme } from '@/config/theme';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text } from 'react-native';

interface Props {
  agree?: boolean;
  onChange: (val: boolean) => void;
}

const Privicy = (props: Props) => {
  const { isDark, colors } = useCustomTheme();
  const [agree, setAgree] = useState(false);

  const changeStage = (val: boolean) => {
    setAgree(val);
    props.onChange(val);
  };

  useEffect(() => {
    setAgree(props.agree || false);
  }, [props.agree]);

  const handleLinkPress = () => {
    router.push('/others/webview');
  };

  return (
    <Flex className="justify-center absolute bottom-5 left-0 right-0 px-7.5">
      <Checkbox.Icon
        active={agree}
        size={17}
        onPress={() => changeStage(!agree)}
        activeColor={colors.primary}
      />
      <Text className="ml-0.5" style={{ color: isDark ? '#fff' : '#333' }}>
        已阅读并同意
      </Text>
      <Pressable onPress={handleLinkPress}>
        <Text style={{ color: colors.primary }}>《隐私政策》</Text>
      </Pressable>
    </Flex>
  );
};

export default Privicy;

import { Flex } from '@/components/ui';
import { Checkbox } from "@fruits-chain/react-native-xiaoshu";
import { Link, useTheme } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { Text } from "react-native";

interface Props {
  agree?: boolean;
  onChange: (val: boolean) => void;
}

const Privicy = (props: Props) => {
  const { colors, dark } = useTheme();
  const [agree, setAgree] = useState(false);

  const changeStage = (val: boolean) => {
    setAgree(val);
    props.onChange(val);
  };

  useEffect(() => {
    setAgree(props.agree || false);
  }, [props.agree]);

  return (
    <Flex className="justify-center absolute bottom-5 left-0 right-0 px-7.5">
      <Checkbox.Icon
        active={agree}
        size={17}
        onPress={() => changeStage(!agree)}
        activeColor={colors.primary}
      />
      <Text className="ml-0.5" style={{ color: dark ? "#fff" : "#333" }}>
        已阅读并同意
      </Text>
      <Link
        href="/WebView"
        style={{ color: colors.primary }}
        action={{ type: "push" }}
      >
        《隐私政策》
      </Link>
    </Flex>
  );
};

export default Privicy;

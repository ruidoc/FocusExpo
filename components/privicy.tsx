import { Checkbox, Flex } from "@fruits-chain/react-native-xiaoshu";
import { Link, useTheme } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";

interface Props {
  agree?: boolean;
  onChange: (val: boolean) => void;
}

const App = (props: Props) => {
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
    <Flex justify="center" style={styles.footer}>
      <Checkbox.Icon
        active={agree}
        size={17}
        onPress={() => changeStage(!agree)}
        activeColor={colors.primary}
      />
      <Text style={{ marginLeft: 2, color: dark ? "#fff" : "#333" }}>
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

const styles = StyleSheet.create({
  footer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    paddingHorizontal: 30,
  },
});

export default App;

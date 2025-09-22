import { useCustomTheme } from '@/config/theme';
import { Flex, Space } from '@fruits-chain/react-native-xiaoshu';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, Text } from 'react-native';

const App = () => {
  const { colors } = useCustomTheme();
  const [agree, setAgree] = useState(false);

  const changeStage = (val: boolean) => {
    setAgree(val);
  };
  return (
    <Flex justify="center" style={styles.root}>
      <Space align="center" style={styles.logobox}>
        <Image source={require('@/assets/images/splash.png')} style={styles.avator} />
        {/* <Text style={{ fontSize: 20, color: colors.text }}>Version 1.0</Text> */}
      </Space>
      <Space justify="center" align="center" gap={3} style={styles.footer}>
        <Link
          href={{
            pathname: '/others/webview',
            params: { url: 'https://beian.miit.gov.cn/' },
          }}
          style={{ color: colors.primary }}>
          京ICP备2024096030号-1A
        </Link>
        <Link href="/others/webview" style={{ color: colors.primary }}>
          《隐私政策》
        </Link>
        <Text style={{ fontSize: 12, marginTop: 8, color: colors.text3 }}>
          北京自由岸科技 ©️版权所有
        </Text>
      </Space>
    </Flex>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'flex-start',
  },
  logobox: {
    marginTop: 80,
  },
  avator: {
    width: 130,
    height: 180,
    borderRadius: 0,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    paddingHorizontal: 30,
  },
});

export default App;

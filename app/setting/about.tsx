import { useCustomTheme } from '@/config/theme';
import { Link } from 'expo-router';
import { Image, Text, View } from 'react-native';

const App = () => {
  const { colors } = useCustomTheme();

  return (
    <View className="flex-1">
      <View className="flex-col items-center mt-20">
        <Image
          source={require('@/assets/images/splash.png')}
          className="w-[130px] h-[180px] rounded-none"
        />
      </View>
      <View className="gap-0.5 absolute bottom-[50px] left-0 right-0 px-[30px]">
        <View className="flex-row gap-2 justify-center items-center">
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
        </View>
        <Text className="text-white mt-2 text-sm text-center">
          北京自由岸科技 ©️版权所有
        </Text>
      </View>
    </View>
  );
};

export default App;

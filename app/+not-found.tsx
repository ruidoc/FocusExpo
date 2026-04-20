import { useCustomTheme } from '@/config/theme';
import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  const { colors } = useCustomTheme();
  return (
    <>
      <Stack.Screen options={{ title: '未找到页面' }} />
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          backgroundColor: colors.background,
        }}>
        <Text style={{ fontSize: 25, color: colors.text }}>
          This screen does not exist.
        </Text>
        <Link href="/(tabs)" style={{ marginTop: 15, paddingVertical: 15 }}>
          <Text style={{ fontSize: 20, color: colors.primary }}>GO HOME</Text>
        </Link>
      </View>
    </>
  );
}

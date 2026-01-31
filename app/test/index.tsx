/**
 * 测试页面列表
 *
 * 提供各种功能测试入口
 */
import { Page } from '@/components/business';
import { Flex } from '@/components/ui';
import Icon from '@expo/vector-icons/Ionicons';
import { useTheme } from '@react-navigation/native';
import { router, Stack } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

interface TestItem {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Icon.glyphMap;
  route: string;
}

const TEST_ITEMS: TestItem[] = [
  {
    id: 'stripe',
    title: 'Stripe 支付测试',
    description: '测试 PaymentSheet 支付流程',
    icon: 'card-outline',
    route: '/test/stripe',
  },
];

const TestIndexPage = () => {
  const { colors, dark } = useTheme();

  return (
    <Page>
      <Stack.Screen options={{ title: '功能测试' }} />
      <View className="flex-1 px-4 pt-4">
        {TEST_ITEMS.map(item => (
          <Pressable
            key={item.id}
            onPress={() => router.push(item.route as any)}
            className={`mb-3 p-4 rounded-xl border ${
              dark
                ? 'bg-gray-800/50 border-gray-700 active:bg-gray-800'
                : 'bg-white border-gray-200 active:bg-gray-50'
            }`}>
            <Flex className="flex-row items-center">
              <View
                className={`w-10 h-10 rounded-lg justify-center items-center mr-3 ${
                  dark ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                <Icon name={item.icon} size={22} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text
                  className="text-base font-semibold mb-1"
                  style={{ color: colors.text }}>
                  {item.title}
                </Text>
                <Text
                  className="text-sm opacity-60"
                  style={{ color: colors.text }}>
                  {item.description}
                </Text>
              </View>
              <Icon name="chevron-forward" size={20} color="#9ca3af" />
            </Flex>
          </Pressable>
        ))}

        {TEST_ITEMS.length === 0 && (
          <View className="flex-1 justify-center items-center">
            <Icon name="flask-outline" size={48} color="#9ca3af" />
            <Text className="text-gray-500 mt-3">暂无测试项目</Text>
          </View>
        )}
      </View>
    </Page>
  );
};

export default TestIndexPage;

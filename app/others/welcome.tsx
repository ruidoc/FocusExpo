import { Button } from '@/components/ui';
// import { useSuperwall } from '@/utils';
import Icon from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const GuideWelcome = () => {
  // const { registerPlacement } = useSuperwall();

  const handleNext = () => {
    // registerPlacement({
    //   placement: 'start_onboarding',
    // });
    router.push('/step1');
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-8 pt-10 justify-center">
        {/* Header / Hero Section */}
        <View className="items-center mb-12">
          <View className="w-20 h-20 rounded-3xl bg-primary items-center justify-center mb-6 shadow-lg shadow-primary/30">
            <Icon name="hourglass-outline" size={40} color="#FFF" />
          </View>
          <Text className="text-3xl font-extrabold text-foreground text-center tracking-tight leading-10">
            “重新掌控你的时间”
          </Text>
          <Text className="text-lg text-muted-foreground text-center mt-4 leading-7">
            别让屏幕偷走你的生活{'\n'}建立健康的数字习惯
          </Text>
        </View>
      </View>

      {/* Footer Action */}
      <View className="px-8 pb-12">
        <Button onPress={handleNext} size="xl" text="开启专注之旅" />
      </View>
    </SafeAreaView>
  );
};

export default GuideWelcome;

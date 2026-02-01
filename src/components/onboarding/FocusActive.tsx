import { Button } from '@/components/ui';
import Icon from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Text, View } from 'react-native';

interface FocusActiveProps {
  selectedAppName: string;
  onNext: () => void;
}

const FocusActive = ({ selectedAppName, onNext }: FocusActiveProps) => {
  const isShield = true; // Always shield mode in onboarding

  return (
    <View className="flex-1">
      <View className="flex-1 items-center justify-center px-8">
        <View className="w-32 h-32 rounded-full bg-green-500/10 items-center justify-center mb-8 border-4 border-green-500/20">
          <View className="w-24 h-24 rounded-full bg-green-500 items-center justify-center shadow-lg shadow-green-500/30">
            <Icon name="checkmark" size={60} color="#FFF" />
          </View>
        </View>

        <Text className="text-3xl font-bold text-foreground mb-4 text-center tracking-tight">
          {isShield ? '限制生效中' : '专注模式已开启'}
        </Text>

        <Text className="text-lg text-muted-foreground text-center leading-7">
          现在，&ldquo;{selectedAppName || '该应用'}&rdquo;
          {isShield ? '已被限制' : '可正常访问'}。
        </Text>

        <View className="mt-8 bg-card px-6 py-4 rounded-xl border border-border flex-row items-center">
          <Icon
            name="information-circle-outline"
            size={20}
            color="hsl(var(--muted-foreground))"
            style={{ marginRight: 8 }}
          />
          <Text className="text-sm text-muted-foreground">
            您可以切换应用验证效果
          </Text>
        </View>
      </View>

      <View className="px-6 pb-8">
        <Button
          onPress={onNext}
          text="下一步"
          type="ghost"
          className="w-full rounded-2xl h-14 border-2"
          textClassName="text-lg text-primary"
        />
      </View>
    </View>
  );
};

export default FocusActive;

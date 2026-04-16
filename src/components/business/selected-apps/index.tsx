import { AppToken } from '@/components/business';
import { Flex } from '@/components/ui';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

interface App {
  stableId: string;
  type: string;
  tokenData?: string;
  [key: string]: any;
}

interface SelectedAppsListProps {
  apps: App[];
  hint?: string;
}

const SelectedApps: React.FC<SelectedAppsListProps> = ({ apps, hint }) => {
  const categoryCount = apps.filter((a: App) => a.type === 'category').length;
  const appCount = apps.filter(
    (a: App) => a.type === 'application' || a.type === 'webDomain',
  ).length;
  const parts: string[] = [];
  if (categoryCount > 0) parts.push(`${categoryCount} 个分类`);
  if (appCount > 0) parts.push(`${appCount} 个应用`);
  const countText = hint
    ? hint
    : parts.length > 0
      ? `已选择 ${parts.join('、')}`
      : `已选择 ${apps.length} 个`;
  return (
    <View style={{ paddingVertical: 0 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 2 }}>
        <Flex className="gap-2">
          {apps.map((app, index) => (
            <AppToken
              key={`${app.stableId}-${index}`}
              app={app}
              size={25}
              gap={16}
            />
          ))}
        </Flex>
      </ScrollView>

      <Text
        style={{
          fontSize: 12,
          color: hint ? '#F7AF5D' : '#666',
          marginTop: 10,
          textAlign: 'center',
        }}>
        {countText}
      </Text>
    </View>
  );
};

export default SelectedApps;

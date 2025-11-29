import { AppToken } from '@/components/business';
import { Flex } from '@/components/ui';
import React from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';

interface App {
  stableId: string;
  type: string;
  tokenData?: string;
  [key: string]: any;
}

interface SelectedAppsListProps {
  apps: App[];
}

const SelectedApps: React.FC<SelectedAppsListProps> = ({ apps }) => {
  if (Platform.OS !== 'ios' || apps.length === 0) {
    return (
      <View style={{ paddingVertical: 12 }}>
        <Text style={{ color: '#666', fontSize: 14 }}>未选择应用</Text>
      </View>
    );
  }

  return (
    <View style={{ paddingVertical: 4 }}>
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
      {apps.length > 0 && (
        <Text
          style={{
            fontSize: 12,
            color: '#666',
            marginTop: 8,
            textAlign: 'center',
          }}>
          已选择 {apps.length} 个应用
        </Text>
      )}
    </View>
  );
};

export default SelectedApps;

import { Flex } from '@/components/ui';
import { useCustomTheme } from '@/config/theme';
import { selectAppsToLimit } from '@/utils/permission';
import Icon from '@expo/vector-icons/Ionicons';
import React, { useMemo } from 'react';
import { Platform, Text } from 'react-native';

interface SelectAppsProps {
  maxCount?: number;
  entrySource?: string;
  /** 已选应用：支持 string[]（stableId:type）或对象数组 { stableId, type } */
  apps: string[] | { stableId: string; type?: string }[];
  onFinish: (apps: any[]) => void;
}

const SelectApps: React.FC<SelectAppsProps> = ({
  maxCount = 0,
  entrySource,
  apps,
  onFinish,
}) => {
  const { colors, isDark } = useCustomTheme();
  // 转为 native 期望的 string[] 格式 stableId:type
  const appIds = useMemo(() => {
    if (!apps?.length) return [];
    return apps.map(a =>
      typeof a === 'string' ? a : `${a.stableId}:${a.type ?? 'application'}`,
    );
  }, [apps]);

  const selectApps = () => {
    if (Platform.OS !== 'ios') return;
    selectAppsToLimit(maxCount, appIds, {
      entry_source: entrySource,
    }).then(data => {
      if (data.success && data.apps) {
        // 同时存储到AppStore和当前组件状态
        onFinish(data.apps);
      }
    });
  };

  return (
    <Flex
      onPress={selectApps}
      className="px-3 py-2 rounded-2xl gap-1"
      style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
      <Icon name="add" size={16} color={colors.text3} />
      <Text className="text-[13px]" style={{ color: colors.text2 }}>选择</Text>
    </Flex>
  );
};

export default SelectApps;

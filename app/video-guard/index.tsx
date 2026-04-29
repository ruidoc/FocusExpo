import { Page, SelectApps, SelectedApps } from '@/components/business';
import { Button, FieldGroup, FieldItem, Toast } from '@/components/ui';
import { useAppStore } from '@/stores';
import { startVideoGuard } from '@/utils/permission';
import { storage } from '@/utils/storage';
import { useNavigation } from '@react-navigation/native';
import React, { useLayoutEffect, useState } from 'react';
import { Text, View } from 'react-native';
import TimeSlider from '../quick-start/time-slider';

const VIDEO_GUARD_THRESHOLD_KEY = 'video_guard_threshold_minutes';

const VideoGuardPage = () => {
  const [threshold, setThreshold] = useState(
    () => storage.getNumber(VIDEO_GUARD_THRESHOLD_KEY, 20) || 20,
  );
  const [saving, setSaving] = useState(false);
  const navigation = useNavigation();
  const astore = useAppStore();

  useLayoutEffect(() => {
    navigation.setOptions?.({
      title: '刷视频守护',
    });
  }, [navigation]);

  const selectApps = (apps: any[]) => {
    astore.addIosApps(apps);
  };

  const handleSave = async () => {
    if (astore.ios_selected_apps.length === 0) {
      Toast('请先选择要锁定的应用', 'info');
      return;
    }

    setSaving(true);
    try {
      const ok = await startVideoGuard(threshold);
      if (ok) {
        storage.set(VIDEO_GUARD_THRESHOLD_KEY, threshold);
        Toast('刷视频守护已保存', 'success');
        navigation.goBack();
      }
    } catch (error) {
      console.error('保存刷视频守护失败:', error);
      Toast('保存失败，请检查权限设置', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page>
      <View className="p-5">
        <FieldGroup divider={false} className="rounded-xl mb-4">
          <FieldItem
            title="要锁定的应用"
            className="pt-3 pb-2"
            rightElement={
              <SelectApps
                apps={astore.ios_selected_apps}
                onFinish={selectApps}
                entrySource="video_guard"
              />
            }
            showArrow={false}
          />
          <View className="px-4 pb-4">
            <SelectedApps apps={astore.ios_selected_apps} />
          </View>
        </FieldGroup>

        <FieldGroup divider={false} className="rounded-xl mb-4">
          <FieldItem title="锁定阈值" className="pb-2" showArrow={false} />
          <View className="px-4 pb-2">
            <TimeSlider minute={threshold} setMinute={setThreshold} />
          </View>
          <View className="px-4 pb-4">
            <Text className="text-[13px] leading-5 text-muted-foreground">
              当这些应用当天累计使用达到阈值后，会立即锁定到当天结束。
            </Text>
          </View>
        </FieldGroup>
      </View>

      <View className="px-8">
        <Button
          onPress={handleSave}
          text="保存"
          loadingText="保存中..."
          loading={saving}
        />
      </View>
    </Page>
  );
};

export default VideoGuardPage;

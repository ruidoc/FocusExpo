import { AppToken } from '@/components/business';
import { Button } from '@/components/ui';
import {
  useAppStore,
  useGuideStore,
  useHomeStore,
  usePlanStore,
} from '@/stores';
import { startAppLimits } from '@/utils/permission';
import Icon from '@expo/vector-icons/Ionicons';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { Image, Platform, Text, View } from 'react-native';

interface FocusReadyProps {
  onNext: () => void;
}

const FocusReady = ({ onNext }: FocusReadyProps) => {
  const store = useHomeStore();
  const gstore = useGuideStore();
  const pstore = usePlanStore();
  const astore = useAppStore();

  const [loading, setLoading] = useState(false);

  const handleBlock = async () => {
    setLoading(true);
    let now = dayjs();
    let cur_minute = now.hour() * 60 + now.minute();
    let cur_secend = cur_minute * 60 + now.second();
    const newId = `once_${Math.floor(Math.random() * 99999999)}`;
    pstore.addOncePlan({
      id: newId,
      start: now.format('HH:mm'),
      start_min: cur_minute,
      start_sec: cur_secend,
      end: now.add(5, 'minute').format('HH:mm'),
      end_min: cur_minute + 5,
      end_sec: cur_secend + 5 * 60,
      repeat: 'once',
      mode: 'shield',
    });

    if (Platform.OS === 'ios') {
      await startAppLimits(5, newId);
    } else {
      store.startVpn();
      const selectedApp =
        store.all_apps
          .filter(app => gstore.selected_apps.includes(app.packageName))
          .map(app => app.appName)[0] || '';
      gstore.setSelectedAppName(selectedApp);
    }
    setLoading(false);
    onNext();
  };

  return (
    <View className="flex-1">
      <View className="flex-1 px-6 pt-12 items-center">
        <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-6">
          <Icon name="flash" size={40} color="hsl(var(--primary))" />
        </View>

        <Text className="text-3xl font-bold text-foreground mb-3 text-center tracking-tight">
          准备开启
        </Text>
        <Text className="text-lg text-muted-foreground text-center mb-12 px-4">
          已准备好屏蔽环境，{'\n'}
          建议先从 <Text className="text-primary font-bold">5分钟</Text>{' '}
          微习惯开始。
        </Text>

        <View className="bg-card w-full p-6 rounded-3xl border border-border shadow-sm items-center">
          <Text className="text-sm font-medium text-muted-foreground mb-6 uppercase tracking-widest">
            受限应用 (
            {astore.ios_selected_apps.length +
              store.all_apps.filter(app =>
                gstore.selected_apps.includes(app.packageName),
              ).length}
            )
          </Text>

          <View className="flex-row flex-wrap justify-center gap-4">
            {astore.ios_selected_apps.slice(0, 9).map(item => (
              <AppToken key={item.id} app={item} size={56} />
            ))}
            {store.all_apps
              .filter(app => gstore.selected_apps.includes(app.packageName))
              .slice(0, 9)
              .map(app => (
                <View key={app.packageName} className="items-center w-16 mb-2">
                  <Image
                    source={{
                      uri: 'data:image/jpeg;base64,' + app.icon,
                      width: 56,
                      height: 56,
                    }}
                    className="w-14 h-14 rounded-xl"
                  />
                </View>
              ))}
            {astore.ios_selected_apps.length > 9 && (
              <View className="w-14 h-14 rounded-xl bg-muted items-center justify-center">
                <Text className="text-muted-foreground font-bold">
                  +{astore.ios_selected_apps.length - 9}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View className="px-6 pb-8">
        <Button
          text="开始 5 分钟专注"
          onPress={handleBlock}
          loading={loading}
          className="w-full rounded-2xl h-14"
          textClassName="text-lg"
          style={{ shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}
        />
      </View>
    </View>
  );
};

export default FocusReady;

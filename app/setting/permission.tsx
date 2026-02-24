import { Page } from '@/components/business';
import { FieldGroup, FieldItem, Switch } from '@/components/ui';
import { checkScreenTimePermission, requestScreenTimePermission } from '@/native/ios/methods';
import { usePermisStore } from '@/stores';
import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';

const App = () => {
  const store = usePermisStore();
  const { dark } = useTheme();
  const [screenTimeGranted, setScreenTimeGranted] = useState(false);

  const checkScreenTime = async () => {
    const status = await checkScreenTimePermission();
    setScreenTimeGranted(status === 'approved');
  };

  const requestScreenTime = async () => {
    if (screenTimeGranted) return;
    const result = await requestScreenTimePermission();
    if (result) {
      setScreenTimeGranted(true);
    }
  };

  useEffect(() => {
    store.checkBattery();
    store.checkNotify();
    checkScreenTime();
  }, []);

  return (
    <Page>
      <Text
        className="text-[13px] font-medium px-5 mb-2 mt-4"
        style={{ color: dark ? '#6B7280' : '#94A3B8' }}>
        核心权限
      </Text>
      <FieldGroup>
        <FieldItem
          title="屏幕使用时间"
          rightElement={
            <Switch
              size={18}
              value={screenTimeGranted}
              disabled={screenTimeGranted}
              onChange={requestScreenTime}
            />
          }
          showArrow={false}
        />
        <FieldItem
          title="通知权限"
          rightElement={
            <Switch
              size={18}
              value={store.pm_notify}
              disabled={store.pm_notify}
              onChange={() => store.openNotify(true)}
            />
          }
          showArrow={false}
        />
      </FieldGroup>
      <Text
        className="text-xs px-5 mt-1.5"
        style={{ color: dark ? '#4B5563' : '#94A3B8', lineHeight: 18 }}>
        屏幕使用时间权限用于屏蔽分心应用，通知权限用于专注提醒。
      </Text>

      <Text
        className="text-[13px] font-medium px-5 mb-2 mt-4"
        style={{ color: dark ? '#6B7280' : '#94A3B8' }}>
        其他
      </Text>
      <FieldGroup>
        <FieldItem
          title="忽略电池优化"
          rightElement={
            <Switch
              size={18}
              value={store.pm_battery}
              disabled={store.pm_battery}
              onChange={() => store.checkBattery(true)}
            />
          }
          showArrow={false}
        />
      </FieldGroup>
    </Page>
  );
};

export default App;

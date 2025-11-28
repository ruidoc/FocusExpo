import { Page } from '@/components/business';
import { FieldGroup, FieldItem, Switch } from '@/components/ui';
import { PermisStore } from '@/stores';
import { observer, useLocalObservable } from 'mobx-react';
import React, { useEffect } from 'react';
import { View } from 'react-native';

const App = observer(() => {
  const store = useLocalObservable(() => PermisStore);

  const onClick = (tag: string) => {
    switch (tag) {
      case 'notify':
        return store.openNotify(true);
      case 'battery':
        return store.checkBattery(true);
    }
  };

  useEffect(() => {
    store.checkBattery();
    store.checkNotify();
  }, []);

  return (
    <Page>
      <View className="flex-col gap-y-2.5 pb-10">
        <FieldGroup className="rounded-xl mx-5 mb-5">
          <FieldItem
            title="允许通知"
            rightElement={
              <Switch
                size={18}
                value={store.pm_notify}
                disabled={store.pm_notify}
                onChange={() => onClick('notify')}
              />
            }
            showArrow={false}
          />
          <FieldItem
            title="关闭电池优化"
            rightElement={
              <Switch
                size={18}
                value={store.pm_battery}
                disabled={store.pm_battery}
                onChange={() => onClick('battery')}
              />
            }
            showArrow={false}
          />
        </FieldGroup>
      </View>
    </Page>
  );
});

export default App;

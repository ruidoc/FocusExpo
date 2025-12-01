import { Page } from '@/components/business';
import { FieldGroup, FieldItem, Switch } from '@/components/ui';
import { usePermisStore } from '@/stores';
import { observer } from 'mobx-react';
import React, { useEffect } from 'react';

const App = observer(() => {
  const store = usePermisStore();

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
      <FieldGroup>
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
    </Page>
  );
});

export default App;

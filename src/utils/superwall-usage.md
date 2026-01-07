# Superwall 使用说明

## 简化后的 API

代码已简化，移除了复杂的 `useEffect` 和自动同步逻辑。

## 1. 展示 Paywall

```tsx
import { useSuperwallPaywall } from '@/utils';

function MyComponent() {
  const { registerPlacement } = useSuperwallPaywall({
    onPresent: (info) => console.log('Paywall 展示:', info),
    onDismiss: (info, result) => console.log('Paywall 关闭:', result),
  });

  return (
    <Button
      onPress={() => registerPlacement({ placement: 'campaign_trigger' })}
      title="显示 Paywall"
    />
  );
}
```

## 2. 用户登录时识别用户

在登录成功的组件中调用：

```tsx
import { useSuperwallUser } from '@/utils';
import { useUserStore } from '@/stores';

function LoginComponent() {
  const { identify, update } = useSuperwallUser();
  const userStore = useUserStore();

  const handleLoginSuccess = async (userInfo: UserInfo) => {
    // 登录成功后
    if (userInfo?.id) {
      try {
        // 识别用户
        await identify(userInfo.id);
        
        // 设置用户属性
        await update({
          username: userInfo.username || '',
          phone: userInfo.phone || '',
          openid: userInfo.openid || '',
        });
      } catch (error) {
        console.error('Superwall 用户识别失败:', error);
      }
    }
  };

  // 在登录回调中使用
  const loginResult = async (result: any) => {
    if (result.statusCode === 200) {
      await userStore.login(result, async () => {
        const userInfo = userStore.uInfo;
        if (userInfo) {
          await handleLoginSuccess(userInfo);
        }
      });
    }
  };
}
```

## 3. 用户登出时

```tsx
import { useSuperwallUser } from '@/utils';

function LogoutComponent() {
  const { signOut } = useSuperwallUser();

  const handleLogout = async () => {
    try {
      await signOut();
      // 然后执行其他登出逻辑
    } catch (error) {
      console.error('Superwall 登出失败:', error);
    }
  };
}
```

## 注意事项

- `useSuperwallUser` 和 `useSuperwallPaywall` 必须在 `SuperwallProvider` 内部使用
- 这些 hooks 返回的函数可以直接调用，不需要 `useCallback` 包装
- 建议在登录/登出的具体操作中手动调用，而不是使用自动同步


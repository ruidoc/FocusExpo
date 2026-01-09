import { Button, Toast } from '@/components/ui';
import { useState } from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

interface Props {
  disabled?: boolean;
  label?: string;
  type?: 'primary' | 'ghost' | 'custom';
  onSuccess: (data: any) => void;
  onError?: (error: any) => void;
}

const App = (props: Props) => {
  const [loading, setLoading] = useState(false);

  // 检查是否支持 Apple 登录（仅 iOS 13+）
  if (Platform.OS !== 'ios') {
    return null;
  }

  const onButtonClicked = async () => {
    if (props.disabled) {
      return Toast('请阅读并勾选下方隐私政策');
    }

    try {
      setLoading(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // 构建用户信息（仅在首次授权时提供）
      const userInfo: any = {
        identityToken: credential.identityToken,
      };

      // 如果提供了用户信息（首次授权），添加到请求中
      if (credential.email || credential.fullName) {
        userInfo.user = {
          email: credential.email || undefined,
          name: credential.fullName
            ? {
                firstName: credential.fullName.givenName || undefined,
                lastName: credential.fullName.familyName || undefined,
              }
            : undefined,
        };
      }

      setLoading(false);
      props.onSuccess(userInfo);
    } catch (error: any) {
      setLoading(false);
      // 用户取消登录不显示错误
      if (error.code === 'ERR_CANCELED') {
        return;
      }
      console.log('Apple 登录失败', error);
      Toast('Apple 登录失败，请重试');
      props.onError?.(error);
    }
  };

  return (
    <Button
      type={props.type || 'primary'}
      loading={loading}
      loadingText="登录中..."
      style={{ marginBottom: 15 }}
      onPress={onButtonClicked}>
      {props.label || 'Apple 登录'}
    </Button>
  );
};

export default App;

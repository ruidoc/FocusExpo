import { useCustomTheme } from '@/config/theme';
import { toast } from '@/utils';
import http from '@/utils/request';
import { Button } from '@fruits-chain/react-native-xiaoshu';
import { registerApp, sendAuthRequest } from 'expo-native-wechat';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Button as CusButton } from '@/components/ui';

interface Props {
  disabled?: boolean;
  label?: string;
  color?: string;
  type?: 'primary' | 'ghost' | 'custom';
  onSuccess: (data: any) => void;
}

const App = (props: Props) => {
  const [loading, setLoading] = useState(false);
  const { colors } = useCustomTheme();
  const onButtonClicked = async () => {
    if (props.disabled) {
      return toast('请阅读并勾选下方隐私政策');
    }
    try {
      let {
        data: { code },
      } = await sendAuthRequest();
      setLoading(true);
      let result: any = await http.post('/user/wechat-app', { code });
      if (result?.statusCode) {
        props.onSuccess(result);
      }
    } catch (error) {
      console.log('微信登录失败', error);
    }
  };

  useEffect(() => {
    registerApp({
      appid: 'wxdc022c6a39cb32b7',
      universalLink: 'https://focusone.ruidoc.cn/iosapp/',
    });
  }, []);

  return (
    <>
      {props.type !== 'custom' && (
        <Button
          color={props.color || colors.primary}
          type={props.type || 'primary'}
          loading={loading}
          loadingText="登录中..."
          style={{ marginBottom: 15, height: 52 }}
          onPress={onButtonClicked}>
          <Text>{props.label || '微信登录/注册'}</Text>
        </Button>
      )}
      {props.type === 'custom' && (
        <CusButton
          loading={loading}
          loadingText="登录中..."
          onPress={onButtonClicked}
          text={props.label || '微信登录/注册'}
        />
      )}
    </>
  );
};

export default App;

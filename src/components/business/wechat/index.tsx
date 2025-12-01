import { Button, Toast } from '@/components/ui';
import http from '@/utils/request';
import { registerApp, sendAuthRequest } from 'expo-native-wechat';
import { useEffect, useState } from 'react';

interface Props {
  disabled?: boolean;
  label?: string;
  color?: string;
  type?: 'primary' | 'ghost' | 'custom';
  onSuccess: (data: any) => void;
}

const App = (props: Props) => {
  const [loading, setLoading] = useState(false);
  const onButtonClicked = async () => {
    if (props.disabled) {
      return Toast('请阅读并勾选下方隐私政策');
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
    <Button
      type={props.type || 'primary'}
      loading={loading}
      loadingText="登录中..."
      style={{ marginBottom: 15 }}
      onPress={onButtonClicked}>
      {props.label || '微信登录/注册'}
    </Button>
  );
};

export default App;

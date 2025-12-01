import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';

const WebScreen = () => {
  // const store = useLocalObservable(() => UserStore);
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const route = useRoute();
  const navigation = useNavigation<any>();

  const loadStart = (e: any) => {
    try {
      const { nativeEvent } = e;
      if (nativeEvent.url === 'about:blank') {
        setKey(key + 1);
      }
    } catch {}
  };

  const handleMessage = (data: any) => {};

  const onStateChange = (navState: WebViewNavigation) => {
    if (navState.title) {
      navigation.setOptions({ headerTitle: navState.title });
    }
  };

  useEffect(() => {
    let curl = (route.params as any)?.url || '';
    if (!curl) {
      curl = 'https://focusone.ruidoc.cn/privacy';
    }
    setUrl(curl);
  }, []);

  return (
    <View style={styles.container}>
      <WebView
        key={key}
        source={{ uri: url }}
        cacheEnabled={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        userAgent={
          'Mozilla/5.0 (Linux; Android 10; Pixel 3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Mobile Safari/537.36'
        }
        onMessage={e => handleMessage(e.nativeEvent.data)}
        onNavigationStateChange={onStateChange}
        onLoadStart={loadStart}
        onError={e => console.log('Error:', e)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: 'center',
    // alignItems: 'center',
  },
});

export default WebScreen;

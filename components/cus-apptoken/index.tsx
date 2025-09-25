import React, { useEffect, useRef } from 'react';
import ViewShot from 'react-native-view-shot';
import TokenLabel from '../native/TokenLabel';

const CustomAppToken = (props: AppToken) => {
  const size = props.size || 20;
  const viewShotRef = useRef<ViewShot>(null);

  useEffect(() => {
    // viewShotRef.current
    //   ?.capture()
    //   .then(async uri => {
    //     await saveToAlbum(uri);
    //   })
    //   .catch(error => {
    //     console.log('截图失败：', error);
    //   });
  }, []);

  return (
    <ViewShot
      ref={viewShotRef}
      options={{
        fileName: `app-token-${Date.now()}`,
        format: 'jpg',
        quality: 0.9,
        // result: 'data-uri',
      }}>
      <TokenLabel
        tokenBase64={props.app.tokenData}
        tokenType={props.app.type}
        size={props.size || undefined}
        style={{ height: size, width: size }}
      />
    </ViewShot>
  );
};

export default CustomAppToken;

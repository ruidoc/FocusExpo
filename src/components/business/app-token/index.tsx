import { Flex } from '@/components/ui';
import React, { useEffect } from 'react';
import TokenLabel from '../../native/TokenLabel';

const CustomAppToken = (props: AppToken) => {
  const size = props.size || 20;
  const isCategory = props.app.type === 'category';
  const iconSize = isCategory ? size * 0.67 : size;
  // const viewShotRef = useRef<ViewShot>(null);

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
    // <ViewShot
    //   ref={viewShotRef}
    //   options={{
    //     fileName: `app-token-${Date.now()}`,
    //     format: 'jpg',
    //     quality: 0.9,
    //     // result: 'data-uri',
    //   }}>
    <Flex
      className="justify-center items-start"
      style={{ height: size, width: size }}>
      <TokenLabel
        tokenBase64={props.app.tokenData}
        tokenType={props.app.type}
        size={iconSize || undefined}
        style={{
          height: iconSize,
          width: iconSize,
          position: 'relative',
        }}
      />
    </Flex>
    // </ViewShot>
  );
};

export default CustomAppToken;

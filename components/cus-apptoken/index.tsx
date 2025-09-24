import React from 'react';
import TokenLabel from '../native/TokenLabel';

const CustomAppToken = (props: AppToken) => {
  const size = props.size || 20;
  return (
    <TokenLabel
      tokenBase64={props.app.tokenData}
      tokenType={props.app.type}
      size={props.size || undefined}
      style={{ height: size, width: size, gap: props.gap || 8 }}
    />
  );
};

export default CustomAppToken;

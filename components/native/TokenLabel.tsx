import { requireNativeComponent, ViewProps } from 'react-native';

export type TokenLabelProps = ViewProps & {
  tokenBase64?: string;
  tokenHash?: string;
  size?: number; // 默认 40
  tokenType?: 'application' | 'category' | 'webDomain';
  display?: 'icon' | 'title';
};

// iOS 会将 ViewManager 名称去掉 "Manager" 后作为原生视图名
export default requireNativeComponent<TokenLabelProps>('TokenLabel');

import { useCustomTheme } from '@/config/theme';
import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Decoration from './decoration';
import { PageProps } from './type';

const Page = (props: PageProps) => {
  const { colors, isDark } = useCustomTheme();
  const Wrapper = props.safe ? SafeAreaView : View;

  return (
    <Wrapper
      {...(props.safe && props.safeEdges && { edges: props.safeEdges })}
      className="flex-1 relative"
      style={{ backgroundColor: props.bgcolor || colors.background }}>
      {props.decoration && isDark ? <Decoration /> : null}
      {props.children}
    </Wrapper>
  );
};

export default Page;

import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PageProps } from './type';

const Page = (props: PageProps) => {
  const Wrapper = props.safe ? SafeAreaView : View;

  return (
    <Wrapper
      className="flex-1 relative"
      style={props.bgcolor ? { backgroundColor: props.bgcolor } : undefined}>
      {props.children}
    </Wrapper>
  );
};

export default Page;

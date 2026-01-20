import { Page } from '@/components/business';
import { Process } from '@/components/ui';
import React from 'react';
import { View } from 'react-native';

interface GuidePageProps {
  children: React.ReactNode;
  progress?: number;
  showProgress?: boolean;
}

const GuidePage = ({
  children,
  progress = 0.5,
  showProgress = true,
}: GuidePageProps) => {
  return (
    <Page safe decoration>
      {showProgress && (
        <View className="pt-10 pb-[30px] px-5">
          <Process value={progress} />
        </View>
      )}
      {children}
    </Page>
  );
};

export default GuidePage;

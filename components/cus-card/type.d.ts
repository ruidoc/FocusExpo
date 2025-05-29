import { ReactNode } from 'react';

interface PageProps {
  title: string;
  desc?: string;
  action?: ReactNode | undefined;
  children: ReactNode | undefined;
}

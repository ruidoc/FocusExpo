import { ReactNode } from 'react';

interface PageProps {
  safe?: boolean;
  bgcolor?: string;
  children: ReactNode | undefined;
}

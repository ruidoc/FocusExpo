import { ReactNode } from 'react';

interface PageProps {
  safe?: boolean;
  bgcolor?: string;
  decoration?: boolean;
  children: ReactNode | undefined;
}

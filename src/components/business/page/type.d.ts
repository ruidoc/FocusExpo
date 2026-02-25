import { ReactNode } from 'react';

export type SafeEdge = 'top' | 'bottom' | 'left' | 'right';

interface PageProps {
  /** 是否启用安全区域，默认 true 时四边都 safe */
  safe?: boolean;
  /** 指定哪些边 safe，如 ['bottom'] 则仅底部 safe、顶部不 safe */
  safeEdges?: SafeEdge[];
  bgcolor?: string;
  decoration?: boolean;
  children: ReactNode | undefined;
}

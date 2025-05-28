'use client';

import type { ReactNode } from 'react';
import TopBar from '../components/TopBar';

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <TopBar />
      {children}
    </>
  );
}
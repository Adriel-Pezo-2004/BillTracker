'use client';

import type { ReactNode } from 'react';
import TopBar from '../components/TopBar';
import { usePathname } from 'next/navigation';

export default function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideTopBar = pathname === '/login' || pathname === '/registro';

  return (
    <>
      {!hideTopBar && <TopBar />}
      {children}
    </>
  );
}
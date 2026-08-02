'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export function PublicPageWrapper({
  children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  const pathname = usePathname();

  return (
    <main key={pathname} className="animate-page-enter flex-1 motion-reduce:animate-none">
      {children}
    </main>
  );
}

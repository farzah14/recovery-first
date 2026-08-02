'use client';

import React from 'react';

export default function AppTemplate({
  children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return <div className="w-full flex-1">{children}</div>;
}

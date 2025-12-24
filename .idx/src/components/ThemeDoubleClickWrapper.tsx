
'use client';

import { useTheme } from 'next-themes';
import { useCallback } from 'react';

export function ThemeDoubleClickWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme, setTheme } = useTheme();

  const handleDoubleClick = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  return <div onDoubleClick={handleDoubleClick}>{children}</div>;
}

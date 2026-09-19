'use client';

import { Button } from '@/components/ui/button';
import { useConsent } from '@/components/ConsentProvider';

/**
 * Small client island so the otherwise server-rendered legal pages can offer a
 * working "change your choices" control without becoming client components.
 */
export function ConsentSettingsButton({
  label = 'Change your cookie choices',
}: {
  label?: string;
}) {
  const { openPreferences } = useConsent();

  return (
    <Button variant="outline" size="sm" onClick={openPreferences}>
      {label}
    </Button>
  );
}

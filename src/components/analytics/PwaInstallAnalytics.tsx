'use client';

import { useEffect } from 'react';
import { trackPostHogEvent } from '@/lib/posthog';

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

function isStandaloneDisplayMode() {
  const navigatorStandalone = (window.navigator as NavigatorWithStandalone).standalone === true;
  return window.matchMedia('(display-mode: standalone)').matches || navigatorStandalone;
}

export function PwaInstallAnalytics() {
  useEffect(() => {
    const onInstallAvailable = () => {
      trackPostHogEvent('pwa_install_available', {
        surface: 'browser_install_prompt',
      });
    };

    const onInstalled = () => {
      trackPostHogEvent('pwa_installed', {
        surface: 'browser_install_prompt',
      }, {
        send_instantly: true,
        transport: 'sendBeacon',
      });
    };

    window.addEventListener('beforeinstallprompt', onInstallAvailable);
    window.addEventListener('appinstalled', onInstalled);

    if (isStandaloneDisplayMode()) {
      trackPostHogEvent('pwa_standalone_opened', {
        surface: 'installed_app',
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onInstallAvailable);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  return null;
}

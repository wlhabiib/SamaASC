'use client';

import { useEffect } from 'react';
import { useTeam } from '@/contexts/team-context';

export default function ThemeColorProvider() {
  const { team } = useTeam();

  useEffect(() => {
    const themeColor = team?.primary_color || '#16a34a';
    
    // Update or create meta theme-color tag
    let metaTag = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    if (!metaTag) {
      metaTag = document.createElement('meta') as HTMLMetaElement;
      metaTag.name = 'theme-color';
      document.head.appendChild(metaTag);
    }
    metaTag.content = themeColor;

    // Update apple-mobile-web-app-status-bar-style
    let appleMetaTag = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]') as HTMLMetaElement;
    if (!appleMetaTag) {
      appleMetaTag = document.createElement('meta') as HTMLMetaElement;
      appleMetaTag.name = 'apple-mobile-web-app-status-bar-style';
      document.head.appendChild(appleMetaTag);
    }
    appleMetaTag.content = themeColor;
  }, [team?.primary_color]);

  return null;
}

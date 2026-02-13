'use client';

import Script from 'next/script';

const HOTJAR_SITE_ID = process.env.NEXT_PUBLIC_HOTJAR_SITE_ID;

export default function Hotjar() {
  if (!HOTJAR_SITE_ID) {
    return null;
  }

  return (
    <Script
      id="hotjar"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(h,o,t,j,a,r){
            h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
            h._hjSettings={hjid:${HOTJAR_SITE_ID},hjsv:6};
            a=o.getElementsByTagName('head')[0];
            r=o.createElement('script');r.async=1;
            r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
            a.appendChild(r);
          })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
        `,
      }}
    />
  );
}

// Custom event tracking helper
export function trackEvent(eventName: string, properties?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && (window as unknown as { hj?: (cmd: string, ...args: unknown[]) => void }).hj) {
    (window as unknown as { hj: (cmd: string, ...args: unknown[]) => void }).hj('event', eventName);
    
    // Also track with properties if provided
    if (properties) {
      (window as unknown as { hj: (cmd: string, ...args: unknown[]) => void }).hj('identify', null, properties);
    }
  }
}

// Track custom user attributes
export function identifyUser(userId: string, attributes?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && (window as unknown as { hj?: (cmd: string, ...args: unknown[]) => void }).hj) {
    (window as unknown as { hj: (cmd: string, ...args: unknown[]) => void }).hj('identify', userId, attributes || {});
  }
}

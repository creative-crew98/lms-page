// components/MetaPixel.tsx
"use client";

import Script from "next/script";

const PIXEL_ID = "1613294250158679";

export default function MetaPixel() {
  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${PIXEL_ID}');
          fbq('trackSingle', '${PIXEL_ID}', 'PageView');
          var queued = window.__lmsMetaQueue || [];
          window.__lmsMetaQueue = [];
          queued.forEach(function(event) {
            var args = [event.custom ? 'trackSingleCustom' : 'trackSingle', '${PIXEL_ID}', event.name, event.params];
            if (event.eventId) args.push({eventID: event.eventId});
            fbq.apply(null, args);
          });
        `}
      </Script>
      {/* Raw fallback markup prevents React from preloading an image
          that browsers use only when JavaScript is disabled. */}
      <noscript dangerouslySetInnerHTML={{
        __html: `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${PIXEL_ID}&amp;ev=PageView&amp;noscript=1" alt="" />`,
      }} />
    </>
  );
}
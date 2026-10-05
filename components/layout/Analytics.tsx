import Script from "next/script";

/**
 * Google Analytics 4, loaded only when NEXT_PUBLIC_GA_ID is set and only after
 * the page is idle, so it never competes with page rendering.
 * Page views are tracked automatically; custom events go through lib/analytics.ts.
 */
export function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (!gaId || !/^G-[A-Z0-9]+$/.test(gaId)) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="lazyOnload" />
      <Script id="ga-init" strategy="lazyOnload">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${gaId}',{allow_google_signals:false,allow_ad_personalization_signals:false});`}
      </Script>
    </>
  );
}

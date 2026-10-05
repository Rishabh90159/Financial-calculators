import Link from "next/link";
import { SimplePage } from "@/components/layout/SimplePage";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

const DESCRIPTION = `How ${siteConfig.name} handles data: calculations run in your browser and the financial values you enter are never sent to us or to analytics.`;

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description: DESCRIPTION,
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <SimplePage title="Privacy policy" path="/privacy" description={DESCRIPTION}>
      <h2>Your calculator inputs stay on your device</h2>
      <p>
        All calculations run in your web browser. The loan amounts, interest rates, investment amounts and other values
        you enter are not sent to our servers, not stored, and not shared with analytics providers.
      </p>
      <h2>Analytics</h2>
      <p>
        We may use Google Analytics to understand, in aggregate, which pages are visited and whether the calculators are
        used. When enabled, it records general interaction events, such as that a calculator was used or a preset button
        was clicked. It never records the values you entered. Advertising personalisation and Google signals are turned
        off. Google Analytics uses cookies; you can block them through your browser settings or Google&apos;s opt-out
        browser add-on, and the calculators will keep working.
      </p>
      <h2>Hosting</h2>
      <p>
        The site is hosted on Vercel. Like most web hosts, Vercel may process standard technical request data, such as
        IP address, browser type and the page requested, to deliver the site and protect it from abuse.
      </p>
      <h2>No accounts</h2>
      <p>We do not offer sign-up, and we do not ask for your name, phone number, email or income.</p>
      <h2>Contact</h2>
      <p>
        Questions about this policy? Call us at{" "}
        <a href={`tel:${siteConfig.contact.phone}`}>{siteConfig.contact.phoneDisplay}</a>. See also our{" "}
        <Link href="/terms">terms of use</Link>.
      </p>
      <h2>Changes</h2>
      <p>If this policy changes, we will update this page and the date at the top.</p>
    </SimplePage>
  );
}

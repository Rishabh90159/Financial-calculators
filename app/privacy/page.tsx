import { SimplePage } from "@/components/layout/SimplePage";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Privacy",
  description: `How ${siteConfig.name} handles data: calculations run in your browser and the financial values you enter are never sent to us or to analytics.`,
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <SimplePage title="Privacy" path="/privacy">
      <h2>Your calculator inputs stay on your device</h2>
      <p>
        All calculations run in your web browser. The loan amounts, interest rates, investment amounts and other values
        you enter are not sent to our servers, not stored, and not shared with analytics providers.
      </p>
      <h2>Analytics</h2>
      <p>
        We may use Google Analytics to understand, in aggregate, which pages are visited and whether the calculators are
        used. When enabled, it records general interaction events, such as that a calculator was used or a preset button
        was clicked. It never records the values you entered. Google Analytics uses cookies; you can block them through
        your browser settings or Google&apos;s opt-out browser add-on, and the calculators will keep working.
      </p>
      <h2>No accounts</h2>
      <p>We do not offer sign-up, and we do not ask for your name, phone number, email or income.</p>
      <h2>Changes</h2>
      <p>If this policy changes, we will update this page.</p>
    </SimplePage>
  );
}

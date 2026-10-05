import Link from "next/link";
import { SimplePage } from "@/components/layout/SimplePage";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

const DESCRIPTION = `The terms for using ${siteConfig.name}'s free financial calculators and content, including the limits of what the results can be relied on for.`;

export const metadata = buildMetadata({
  title: "Terms of Use",
  description: DESCRIPTION,
  path: "/terms",
});

export default function TermsPage() {
  return (
    <SimplePage title="Terms of use" path="/terms" description={DESCRIPTION}>
      <p>
        By using {siteConfig.name} you agree to these terms. If you do not agree with them, please do not use the site.
      </p>
      <h2>Free to use</h2>
      <p>
        The calculators are free for personal, non-commercial use. There is no account, subscription or payment, and
        you do not need to give us any personal information to use them.
      </p>
      <h2>Estimates, not advice</h2>
      <p>
        Results are estimates based on the values you enter and the assumptions described in our{" "}
        <Link href="/methodology">methodology</Link>. They are not financial, investment, tax, legal or lending
        advice, and they are not a quote or offer from any lender or product provider. You are responsible for any
        decision you make, and you should confirm final terms with your lender or a qualified professional. See the full{" "}
        <Link href="/disclaimer">disclaimer</Link>.
      </p>
      <h2>Accuracy</h2>
      <p>
        We aim to keep formulas and content correct and up to date, but we do not guarantee that the site is free of
        errors or that it will always be available. To the extent permitted by law, {siteConfig.name} is not liable for
        any loss arising from the use of, or reliance on, the calculators or content.
      </p>
      <h2>Acceptable use</h2>
      <p>
        Please do not attempt to disrupt the site, access it through automated means at a volume that affects other
        users, or copy and republish substantial parts of its content as your own.
      </p>
      <h2>Privacy</h2>
      <p>
        How we handle data is described in our <Link href="/privacy">privacy policy</Link>.
      </p>
      <h2>Changes and contact</h2>
      <p>
        We may update these terms from time to time; the date at the top of this page shows the latest version. For
        questions, call us at <a href={`tel:${siteConfig.contact.phone}`}>{siteConfig.contact.phoneDisplay}</a>.
      </p>
    </SimplePage>
  );
}

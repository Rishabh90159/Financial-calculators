import Link from "next/link";
import { SimplePage } from "@/components/layout/SimplePage";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

const DESCRIPTION = `Contact ${siteConfig.name} to report a calculation error, suggest a correction or ask how a calculator works.`;

export const metadata = buildMetadata({
  title: "Contact Us",
  description: DESCRIPTION,
  path: "/contact",
});

export default function ContactPage() {
  return (
    <SimplePage title="Contact" path="/contact" description={DESCRIPTION}>
      <p>
        Call us on <a href={`tel:${siteConfig.contact.phone}`}>{siteConfig.contact.phoneDisplay}</a>.
      </p>

      <h2>What to contact us about</h2>
      <ul>
        <li>
          <strong>A result looks wrong.</strong> Tell us which calculator you used and the values you entered, and what
          figure you expected. We check every reported error against the formula and our automated tests, and publish
          corrections once they are verified.
        </li>
        <li>
          <strong>Outdated information.</strong> Tax slabs, regulatory limits and similar references are dated on the
          pages that use them. If a rule has changed, let us know.
        </li>
        <li>
          <strong>Suggestions.</strong> Ideas for new calculators or clearer explanations are welcome.
        </li>
      </ul>

      <h2>What we cannot help with</h2>
      <p>
        {siteConfig.name} is not a lender, broker or financial adviser. We cannot give personal financial advice, process
        loan applications or tell you what a particular bank will offer. For decisions about your own finances, speak to
        your lender or a qualified professional.
      </p>

      <p>
        How the calculators work is explained on our <Link href="/methodology">methodology page</Link>, and your privacy
        is covered in our <Link href="/privacy">privacy policy</Link>.
      </p>
    </SimplePage>
  );
}

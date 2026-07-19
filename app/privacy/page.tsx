import type { Metadata } from 'next';
import Link from 'next/link';
import LegalShell, { Section, Callout } from '@/components/legal/LegalShell';

export const metadata: Metadata = {
  title: 'Privacy Policy — Bitcoin Yield Intelligence',
  description:
    'How Bitcoin Yield Intelligence handles data. We collect no personal information: no accounts, no wallet connection, no identifying cookies — only anonymous, aggregate analytics.',
};

export default function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy Policy"
      subtitle="What we collect, why, and your rights. The short version: almost nothing."
      lastUpdated="18 July 2026"
    >
      <Callout>
        <strong>We do not collect personal information.</strong> Bitcoin Yield Intelligence has no accounts,
        no login, no wallet connection, and no forms. We do not use advertising or cross-site tracking
        cookies, and we never sell or share personal data — because we do not have any.
      </Callout>

      <Section title="1. Who we are">
        <p>
          Bitcoin Yield Intelligence (the &ldquo;Service&rdquo;) is an independent informational website
          operated by Ezra Kewa as an individual (the &ldquo;Operator&rdquo;, &ldquo;we&rdquo;,
          &ldquo;us&rdquo;). This policy explains how the Service handles information when you visit{' '}
          <span className="font-mono-data" style={{ color: 'var(--text)' }}>btc-yield-visibility.vercel.app</span>.
        </p>
      </Section>

      <Section title="2. What we collect">
        <p>The Service collects only two categories of information, neither of which identifies you:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Anonymous, aggregate usage analytics.</strong> We use Vercel Web Analytics to
            understand overall traffic — such as page views, referrers, country, browser, and device
            type. This data is aggregated and anonymous: visitors are identified only by a temporary
            hash derived from the incoming request, no cookies are used, your full IP address is not
            stored, and the data cannot be used to identify you or to follow you across other websites.
          </li>
          <li>
            <strong>Local display preferences.</strong> Your choices on the dashboard (for example
            Simple vs. Advanced view and which metrics are visible) are stored in your own
            browser&apos;s local storage. This information stays on your device, is never transmitted
            to us, and you can clear it at any time by clearing your browser&apos;s site data.
          </li>
        </ul>
      </Section>

      <Section title="3. What we do NOT collect">
        <p>The Service does not collect, request, or store:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>names, email addresses, phone numbers, or account credentials;</li>
          <li>wallet addresses, private keys, seed phrases, or transaction data;</li>
          <li>payment or financial-account information; or</li>
          <li>any tracking or advertising cookies, or cross-site identifiers.</li>
        </ul>
      </Section>

      <Section title="4. Why we process this information (legal basis)">
        <p>
          Where the GDPR or similar laws apply, we rely on our <strong>legitimate interest</strong> in
          understanding aggregate, anonymous usage to operate and improve the Service. Because this
          analytics data is anonymous and cannot be linked to you, it does not constitute personal
          data in most cases. Local display preferences are stored on your own device to make the
          Service work the way you left it, and are not processed by us.
        </p>
      </Section>

      <Section title="5. Cookies & local storage">
        <p>
          We do not use cookies for tracking, advertising, or cross-site profiling, so no cookie
          consent banner is required. The Service uses your browser&apos;s local storage only to
          remember your display preferences, as described above. You can disable or clear local
          storage in your browser settings without losing access to the Service.
        </p>
      </Section>

      <Section title="6. Third parties & international transfers">
        <p>
          The Service is hosted on <strong>Vercel</strong>, which also provides the anonymous
          analytics described above; in doing so, request data may be processed on servers located in
          the United States. To display yield data, our servers fetch information from third-party
          sources such as <strong>DefiLlama</strong> — these requests are made by us, and{' '}
          <strong>no information about you is sent to them</strong>. We do not otherwise share, sell,
          rent, or trade information with third parties.
        </p>
      </Section>

      <Section title="7. Data retention">
        <p>
          Anonymous analytics are retained in aggregate by our analytics provider for a limited period
          in line with their standard retention practices. Local display preferences remain on your
          device until you clear them. We do not maintain any database of visitors.
        </p>
      </Section>

      <Section title="8. Your rights">
        <p>
          Depending on where you live, you may have rights under laws such as the GDPR (EU/UK) or the
          CCPA/CPRA (California) to access, correct, delete, or restrict the processing of your
          personal information, and to object to it. <strong>We do not sell or share personal
          information</strong>, and there is no personal information to opt out of.
        </p>
        <p>
          Because the Service does not collect information that identifies you, we generally cannot
          locate any personal data associated with an individual visitor. If you believe we hold
          information about you, or you wish to exercise any right, contact us at the address below and
          we will respond as required by applicable law.
        </p>
      </Section>

      <Section title="9. Children's privacy">
        <p>
          The Service is intended for adults (18+) and is not directed to children. We do not knowingly
          collect information from children. If you believe a child has provided information through
          the Service, contact us and we will address it.
        </p>
      </Section>

      <Section title="10. Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time. Material changes will be reflected by
          the &ldquo;Last updated&rdquo; date above. Your continued use of the Service after an update
          constitutes acceptance of the revised policy.
        </p>
      </Section>

      <Section title="11. Contact">
        <p>
          Questions or privacy requests? Contact the Operator at{' '}
          <a href="mailto:ezrakewa3@gmail.com" style={{ color: 'var(--gold)' }}>ezrakewa3@gmail.com</a>.
        </p>
      </Section>

      <div className="mt-10 pt-6 text-xs" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-dim)' }}>
        See also our{' '}
        <Link href="/terms" style={{ color: 'var(--text)' }}>Terms of Service</Link> and{' '}
        <Link href="/risk" style={{ color: 'var(--text)' }}>Risk Disclosure</Link>.
      </div>
    </LegalShell>
  );
}

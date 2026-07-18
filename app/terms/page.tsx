import type { Metadata } from 'next';
import Link from 'next/link';
import LegalShell, { Section, Callout } from '@/components/legal/LegalShell';

export const metadata: Metadata = {
  title: 'Terms of Service — BTC Yield Visibility',
  description:
    'The terms governing your use of BTC Yield Visibility, an informational Bitcoin/Stacks yield dashboard. Informational only — not financial advice.',
};

export default function TermsPage() {
  return (
    <LegalShell
      title="Terms of Service"
      subtitle="The agreement between you and BTC Yield Visibility."
      lastUpdated="18 July 2026"
    >
      <Callout>
        BTC Yield Visibility is an <strong>informational tool</strong>. It publishes data and computed
        rankings about Bitcoin/Stacks yield opportunities. It is <strong>not</strong> financial,
        investment, legal, or tax advice, it does not handle your funds, and it never executes
        transactions on your behalf. Please also read our{' '}
        <Link href="/risk" style={{ color: 'var(--gold)' }}>Risk Disclosure</Link> and{' '}
        <Link href="/privacy" style={{ color: 'var(--gold)' }}>Privacy Policy</Link>.
      </Callout>

      <Section title="1. Who we are & acceptance of these Terms">
        <p>
          BTC Yield Visibility (the &ldquo;Service&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is an
          independent, informational website operated by Ezra Kewa as an individual
          (&ldquo;Operator&rdquo;). These Terms of Service (&ldquo;Terms&rdquo;) govern your access to
          and use of the website at{' '}
          <span className="font-mono-data" style={{ color: 'var(--text)' }}>btc-yield-visibility.vercel.app</span>{' '}
          and any related pages.
        </p>
        <p>
          By accessing or using the Service, you agree to be bound by these Terms and by our{' '}
          <Link href="/risk" style={{ color: 'var(--gold)' }}>Risk Disclosure</Link>. If you do not
          agree, do not use the Service.
        </p>
      </Section>

      <Section title="2. Eligibility">
        <p>
          You must be at least <strong>18 years old</strong> (or the age of majority in your
          jurisdiction, if higher) and legally able to enter into these Terms. The Service is not
          directed to children.
        </p>
        <p>
          You are responsible for ensuring that your use of the Service — and any dealings with the
          third-party protocols it describes — is lawful where you live. You may not use the Service
          if you are located in, or are a resident of, any jurisdiction where accessing information
          about digital assets or decentralized finance is prohibited, or where doing so would make
          the Operator subject to registration or licensing requirements.
        </p>
      </Section>

      <Section title="3. What the Service is — and is not">
        <p>
          The Service aggregates publicly available information about Bitcoin and Stacks yield
          opportunities and presents computed metrics — including an Opportunity Score, Risk Score,
          Health Score, and APY figures — to help you compare options in one place. How every figure
          is calculated is documented on our{' '}
          <Link href="/methodology" style={{ color: 'var(--gold)' }}>Methodology</Link> page.
        </p>
        <p>The Service is a read-only information display. It does not, and cannot:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>hold, custody, transfer, or manage any of your assets;</li>
          <li>connect to your wallet, initiate, sign, or broadcast any transaction;</li>
          <li>offer, sell, broker, or solicit any security, token, or financial product; or</li>
          <li>provide personalized financial, investment, legal, or tax advice.</li>
        </ul>
      </Section>

      <Section title="4. No financial, investment, legal, or tax advice">
        <p>
          All content is provided for general informational and educational purposes only. Nothing on
          the Service constitutes financial, investment, trading, legal, accounting, or tax advice, a
          recommendation, or an endorsement of any protocol, asset, or strategy, and nothing is
          tailored to your individual circumstances.
        </p>
        <p>
          You should not treat any content as a substitute for advice from a licensed and qualified
          professional. Always conduct your own research and seek independent professional advice
          before making any financial decision. Any reliance you place on the Service is strictly at
          your own risk.
        </p>
      </Section>

      <Section title="5. No offer, solicitation, or endorsement">
        <p>
          The Service is not an offer or solicitation to buy or sell any security, token,
          cryptocurrency, or financial instrument, and is not investment advice, in any jurisdiction.
          Displaying, ranking, or scoring a protocol is not an endorsement, recommendation, or
          guarantee of it. We are not affiliated with, and do not act as an agent of, the protocols
          described unless expressly stated.
        </p>
      </Section>

      <Section title="6. No custody & no fiduciary relationship">
        <p>
          We never take possession or control of your funds. Any decision to deposit, stake, lend,
          provide liquidity, or otherwise transact takes place entirely between you and a third-party
          protocol, using tools we do not provide or control. No advisory, brokerage, fiduciary, or
          agency relationship is created between you and the Operator by your use of the Service.
        </p>
      </Section>

      <Section title="7. Third-party data, protocols, and links">
        <p>
          Live figures such as TVL and APY are enriched from third-party sources (including
          DefiLlama), and some values fall back to curated estimates. Risk and health inputs are, in
          part, editorial assessments. We do not control third-party data sources or protocols and do
          not guarantee that their information is accurate, current, or complete.
        </p>
        <p>
          The Service may link to third-party websites, applications, and smart contracts. We are not
          responsible for their content, security, availability, terms, or practices, and your use of
          them is governed by their terms, not ours.
        </p>
      </Section>

      <Section title="8. Accuracy & availability — provided “as is”">
        <p>
          Yield figures are variable and not guaranteed. Data may be delayed, incomplete, inaccurate,
          or unavailable, and scores are relative rankings recomputed as data changes — not absolute
          grades. We provide the Service on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo;
          basis and may modify, suspend, or discontinue any part of it at any time without notice.
        </p>
      </Section>

      <Section title="9. Assumption of risk">
        <p>
          Digital assets and decentralized finance carry a high degree of risk, including the total
          loss of funds. By using the Service you acknowledge that you understand and accept these
          risks, which are described in our{' '}
          <Link href="/risk" style={{ color: 'var(--gold)' }}>Risk Disclosure</Link>, and that you
          are solely responsible for your own decisions and their outcomes.
        </p>
      </Section>

      <Section title="10. Intellectual property & acceptable use">
        <p>
          The Service — including its scoring methodology, text, design, and branding — is owned by
          the Operator and protected by intellectual-property laws. You may view and share the
          information for personal, non-commercial use. You may not scrape, republish at scale,
          reverse engineer, or use the Service to build a competing dataset, or misuse it in any way
          that disrupts, overburdens, or attempts to gain unauthorized access to the Service.
        </p>
      </Section>

      <Section title="11. Disclaimer of warranties">
        <p>
          To the fullest extent permitted by law, the Service is provided without warranties of any
          kind, whether express, implied, or statutory, including implied warranties of
          merchantability, fitness for a particular purpose, non-infringement, and any warranty as to
          the accuracy, reliability, completeness, or timeliness of the content. We do not warrant
          that the Service will be uninterrupted, secure, or error-free.
        </p>
      </Section>

      <Section title="12. Limitation of liability">
        <p>
          To the fullest extent permitted by law, the Operator will not be liable for any indirect,
          incidental, special, consequential, exemplary, or punitive damages, or for any loss of
          profits, revenue, data, or digital assets, arising out of or relating to your use of (or
          inability to use) the Service or your reliance on any content, even if advised of the
          possibility of such damages.
        </p>
        <p>
          To the extent any liability cannot be excluded, the Operator&apos;s total aggregate
          liability arising out of or relating to the Service is limited to one hundred US dollars
          (USD 100).
        </p>
      </Section>

      <Section title="13. Indemnification">
        <p>
          You agree to indemnify and hold harmless the Operator from and against any claims,
          liabilities, damages, losses, and expenses (including reasonable legal fees) arising out of
          or connected with your use of the Service, your breach of these Terms, or your violation of
          any law or the rights of any third party.
        </p>
      </Section>

      <Section title="14. Changes to these Terms">
        <p>
          We may update these Terms from time to time. When we do, we will revise the &ldquo;Last
          updated&rdquo; date above. Your continued use of the Service after changes take effect
          constitutes acceptance of the revised Terms.
        </p>
      </Section>

      <Section title="15. Governing law & dispute resolution">
        <p>
          These Terms are governed by the laws of the State of Delaware, United States, without
          regard to its conflict-of-laws rules. The parties will first attempt in good faith to
          resolve any dispute informally by contacting us at the address below. Any dispute not
          resolved informally will be subject to the exclusive jurisdiction of the state and federal
          courts located in the State of Delaware, and you consent to personal jurisdiction there.
          Nothing here limits any non-waivable rights you have under the mandatory law of your place
          of residence.
        </p>
      </Section>

      <Section title="16. Contact">
        <p>
          Questions about these Terms? Contact the Operator at{' '}
          <a href="mailto:ezrakewa3@gmail.com" style={{ color: 'var(--gold)' }}>ezrakewa3@gmail.com</a>.
        </p>
      </Section>

      <div className="mt-10 pt-6 text-xs" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-dim)' }}>
        BTC Yield Visibility — Stacks Bitcoin Yield Intelligence · Informational only · APY figures are
        variable and not guaranteed · This is not financial advice.
      </div>
    </LegalShell>
  );
}

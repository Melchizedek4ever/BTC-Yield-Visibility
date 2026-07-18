import type { Metadata } from 'next';
import Link from 'next/link';
import LegalShell, { Section, Callout } from '@/components/legal/LegalShell';

export const metadata: Metadata = {
  title: 'Risk Disclosure — Bitcoin Yield Intelligence',
  description:
    'The risks of Bitcoin, DeFi, and yield strategies on Stacks. Digital assets are high-risk and you can lose everything. Informational only — not financial advice.',
};

export default function RiskPage() {
  return (
    <LegalShell
      title="Risk Disclosure"
      subtitle="Read this before acting on anything you see on the dashboard."
      lastUpdated="18 July 2026"
    >
      <Callout>
        <strong>Digital assets are high-risk. You can lose some or all of your money.</strong> Bitcoin
        Yield Intelligence is an informational tool only — it is not financial, investment, legal, or
        tax advice, and it does not custody your funds or execute any transaction for you. Never risk
        more than you can afford to lose.
      </Callout>

      <Section title="Not advice — decisions are yours">
        <p>
          Everything on this Service is general information published for education and comparison. It
          is not a recommendation to buy, sell, hold, stake, lend, or provide liquidity to anything,
          and it is not tailored to your situation. You are solely responsible for your own decisions.
          Do your own research and seek advice from a licensed professional before you act.
        </p>
      </Section>

      <Section title="Volatility & total-loss risk">
        <p>
          Cryptocurrency prices are highly volatile and can move sharply in minutes. Yields can fall
          to zero. Unlike bank deposits, funds deployed into DeFi are <strong>not</strong> covered by
          FDIC, government guarantees, or deposit insurance. It is possible to lose your entire
          position.
        </p>
      </Section>

      <Section title="Smart-contract, protocol & oracle risk">
        <p>
          DeFi protocols run on smart contracts that may contain bugs or vulnerabilities. Exploits,
          hacks, economic attacks, oracle manipulation, governance failures, key compromise, and
          protocol insolvency can each lead to partial or total loss — sometimes with no recourse and
          no way to reverse a transaction. An audit reduces, but does not eliminate, this risk.
        </p>
      </Section>

      <Section title="Impermanent loss (liquidity positions)">
        <p>
          If you provide liquidity to a DEX or paired pool, the value of your position can diverge from
          simply holding the underlying assets as their relative prices change. This &ldquo;impermanent
          loss&rdquo; can become permanent when you withdraw, and can exceed the rewards you earn.
        </p>
      </Section>

      <Section title="Yield is variable and not guaranteed">
        <p>
          APY figures are annualized snapshots of a variable rate — not a promise of future return.
          Advertised yields are frequently driven by token emissions or incentives that can be reduced
          or end at any time, and the market value of reward tokens can decline. The yield you
          actually realize may be far lower than any figure shown, or negative after costs.
        </p>
      </Section>

      <Section title="Data may be incomplete, delayed, or wrong">
        <p>
          Figures on the dashboard are enriched from third-party sources (such as DefiLlama) and, where
          a live value is unavailable, fall back to curated estimates. Risk and health inputs are, in
          part, editorial assessments. Scores are <strong>relative rankings</strong> recomputed as data
          changes, not absolute grades, and can be stale or inaccurate. See the{' '}
          <Link href="/methodology" style={{ color: 'var(--gold)' }}>Methodology</Link> page for exactly
          how each figure is derived and its limits.
        </p>
      </Section>

      <Section title="No custody — you transact elsewhere, at your own risk">
        <p>
          The Service never holds your assets, connects to your wallet, or signs transactions. Any
          action you take happens directly between you and a third-party protocol using tools we
          neither provide nor control. You alone are responsible for wallet security, key management,
          approvals, network fees, and verifying every contract you interact with.
        </p>
      </Section>

      <Section title="Regulatory & tax uncertainty">
        <p>
          The legal and regulatory treatment of digital assets and DeFi is evolving and varies by
          jurisdiction. Some products or protocols may be restricted or unlawful where you live, and
          participation may have tax consequences. You are responsible for understanding and complying
          with the laws and tax rules that apply to you.
        </p>
      </Section>

      <Section title="Do your own research">
        <p>
          Use this Service as a starting point for comparison, never as the last word. Verify
          everything independently, understand each protocol before committing funds, and consult a
          licensed financial, legal, or tax professional about your specific circumstances.
        </p>
      </Section>

      <div className="mt-10 pt-6 text-xs" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-dim)' }}>
        See also our{' '}
        <Link href="/terms" style={{ color: 'var(--text)' }}>Terms of Service</Link> and{' '}
        <Link href="/privacy" style={{ color: 'var(--text)' }}>Privacy Policy</Link>. · APY figures are
        variable and not guaranteed · This is not financial advice.
      </div>
    </LegalShell>
  );
}

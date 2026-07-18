import Link from 'next/link';

/**
 * Shared chrome for the legal / disclosure pages (Terms, Privacy, Risk).
 * Mirrors the /methodology page: sticky header, max-w-3xl body, "back to
 * dashboard" link, and terminal-grade CSS variables. One source of truth so
 * the documents stay visually consistent.
 */
export default function LegalShell({
  title,
  subtitle,
  lastUpdated,
  children,
}: {
  title: string;
  subtitle?: string;
  lastUpdated?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <header
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
        className="sticky top-0 z-50"
      >
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">₿</span>
            <div className="font-bold text-base" style={{ color: 'var(--text)' }}>
              BTC Yield <span style={{ color: 'var(--text-faint)' }}>Visibility</span>
            </div>
          </Link>
          <Link
            href="/"
            className="text-sm px-3 py-1.5 rounded-lg"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            ← Back to dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
            {subtitle}
          </p>
        )}
        {lastUpdated && (
          <p className="font-mono-data text-[11px] uppercase tracking-widest mt-2 mb-8" style={{ color: 'var(--text-faint)' }}>
            Last updated {lastUpdated}
          </p>
        )}
        {!lastUpdated && <div className="mb-8" />}

        {children}
      </main>
    </div>
  );
}

/** A titled prose block, matching the /methodology page's Section. */
export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>
        {title}
      </h2>
      <div className="text-sm leading-relaxed space-y-2" style={{ color: 'var(--text-dim)' }}>
        {children}
      </div>
    </section>
  );
}

/** Callout used for the top-of-page "this is not advice" banners. */
export function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mb-8 rounded-lg px-4 py-3 text-sm leading-relaxed"
      style={{ background: 'var(--caution-tint)', borderLeft: '4px solid var(--caution)', color: 'var(--text)' }}
    >
      {children}
    </div>
  );
}

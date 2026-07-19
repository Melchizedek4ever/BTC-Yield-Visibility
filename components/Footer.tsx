import Link from 'next/link';

const LINKS = [
  { href: '/methodology', label: 'Methodology' },
  { href: '/risk', label: 'Risk Disclosure' },
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
];

export default function Footer() {
  return (
    <footer style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>
          Informational only — not financial advice. APY figures are variable and not guaranteed.
          <br className="hidden sm:block" /> © {new Date().getFullYear()} Bitcoin Yield Intelligence.
        </p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-xs hover:underline"
              style={{ color: 'var(--text-dim)' }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

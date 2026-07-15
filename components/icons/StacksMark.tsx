interface MarkProps {
  size?: number;
  color?: string;
  className?: string;
}

/**
 * A geometric rendition of the Stacks mark's stacked-layers motif — the name
 * itself comes from stacking blocks on Bitcoin via Proof of Transfer. This is
 * a hand-built interpretation, not the official brand SVG (no network access
 * to fetch it here); swap in the real asset if one is available.
 */
export function StacksMark({ size = 16, color = 'currentColor', className }: MarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M1 5h22l-3.5 4.5H4.5z" fill={color} />
      <path d="M1 11.5h22l-3.5 4.5H4.5z" fill={color} opacity="0.68" />
      <path d="M1 18h22l-3.5 4.5H4.5z" fill={color} opacity="0.4" />
    </svg>
  );
}

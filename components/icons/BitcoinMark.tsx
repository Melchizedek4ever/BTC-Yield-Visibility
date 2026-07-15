interface MarkProps {
  size?: number;
  className?: string;
}

/** The Bitcoin mark — orange disc, white glyph. Used as the app's primary identity mark. */
export function BitcoinMark({ size = 24, className }: MarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
      <circle cx="16" cy="16" r="16" fill="#F7931A" />
      <text
        x="16"
        y="22.5"
        textAnchor="middle"
        fontSize="18"
        fontWeight="700"
        fill="#FFFFFF"
        fontFamily="ui-sans-serif, -apple-system, sans-serif"
      >
        ₿
      </text>
    </svg>
  );
}

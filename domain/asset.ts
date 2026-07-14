/**
 * An on-chain asset a user deposits or earns. Kept intentionally small — richer
 * metadata (decimals, contract principal, price) can attach here later without
 * touching consumers.
 */
export interface Asset {
  symbol: string;
  name?: string;
}

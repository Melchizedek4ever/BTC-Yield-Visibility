/**
 * An on-chain asset a user deposits or earns. Kept intentionally small — richer
 * metadata (decimals, contract principal, price) can attach here later without
 * touching consumers.
 */
export interface Asset {
  symbol: string;
  name?: string;
}

/**
 * What a reward asset is worth to a Bitcoin holder, which is the question this
 * product exists to answer. A headline APY says nothing about whether the yield
 * accrues in Bitcoin or in a protocol token that can decay toward zero, and the
 * two are not the same offer.
 *
 * Ordered from most to least aligned with a Bitcoin holder's intent.
 */
export type AssetTier = 'bitcoin' | 'stablecoin' | 'native' | 'protocol';

/**
 * Anything a holder ultimately redeems for Bitcoin. That includes wrappers
 * (sBTC, xBTC, pBTC) and yield-bearing claims (stBTC, stSTXbtc, BTCz): the
 * wrapper's name does not change what the yield accrues in.
 *
 * The bridge or issuer risk those wrappers carry is real, but it belongs to
 * counterparty and smart-contract risk, which are separate factors. Pricing it
 * in here as well would charge the same risk twice and rate a pure-BTC position
 * as though it paid a governance token.
 */
const BITCOIN_ASSETS = new Set([
  'BTC',
  'SBTC',
  'XBTC',
  'HBTC',
  'WBTC',
  'LBTC',
  'PBTC',
  'ABTC',
  // BTC-denominated yield-bearing claims.
  'STBTC',
  'STSTXBTC',
  'BTCZ',
]);
const STABLECOIN_ASSETS = new Set(['USDA', 'USDC', 'USDT', 'SUSDT', 'AEUSDC', 'USDH', 'DAI']);
const NATIVE_ASSETS = new Set(['STX', 'STSTX']);

/**
 * Classifies a reward asset by symbol. Anything unrecognized is treated as a
 * protocol token: for a trust-first product the conservative default is to
 * assume an unknown asset carries token risk, never to assume it is safe.
 */
export function classifyRewardAsset(symbol: string): AssetTier {
  const s = symbol.trim().toUpperCase();
  if (BITCOIN_ASSETS.has(s)) return 'bitcoin';
  if (STABLECOIN_ASSETS.has(s)) return 'stablecoin';
  if (NATIVE_ASSETS.has(s)) return 'native';
  return 'protocol';
}

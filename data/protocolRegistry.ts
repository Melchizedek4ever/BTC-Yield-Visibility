import type { IlRisk, ProtocolCategory, SmartContractRisk } from '@/domain/protocol';

/**
 * Curated protocol registry — the judgement layer.
 *
 * Nothing here is available from any API: audit status, contract complexity,
 * impermanent-loss exposure and strategy category are assessments, not
 * readings. The risk engine runs entirely on these fields, so this file is the
 * product's actual intellectual property rather than incidental seed data.
 *
 * Market numbers deliberately live elsewhere (see marketBaseline.ts): those
 * decay daily and should come from a live source, while these change only when
 * a protocol is audited, ages, or changes shape.
 *
 * ── AUDIT DATA: WHAT `audited`/`audits` ACTUALLY CLAIM ─────────────────────
 * They record that the PROTOCOL has published audit coverage, named by firm.
 * They do NOT claim that the specific contract behind a given opportunity was
 * in that audit's scope, because that has not been checked against the audit
 * reports themselves.
 *
 * This matters because a protocol can be audited while a newer product on it
 * is not, which is exactly the case the risk engine should catch and currently
 * cannot. Smart-contract risk carries the weight here instead: newer contracts
 * on mature protocols are rated a band riskier by hand, per-row, with the
 * reason in a comment.
 *
 * Tracked for verification in docs/data-sources/02-open-questions.md, and
 * disclosed to readers on /methodology. Until it is verified, treat every
 * named firm as protocol-level coverage rather than contract-level assurance.
 */
export interface ProtocolRecord {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  description: string;
  category: ProtocolCategory;
  icon: string;
  website: string;
  appUrl: string;

  /** Months live. Drives protocol-age risk. */
  protocolAgeMonths: number;
  /** Protocol-level audit coverage — NOT per-contract scope. See the header. */
  audited: boolean;
  /** Firms that audited the protocol. Scope per opportunity is unverified. */
  audits: string[];
  smartContractRisk: SmartContractRisk;
  ilRisk: IlRisk;
  healthScore: number;
  /**
   * The curated risk score this row carried before the engine computed its own.
   * Reference only, for calibrating the engine against human judgement — it is
   * NOT an input to assessRisk() and must never become one.
   */
  curatedRiskScore: number;

  strategy: string;
  earnAsset: string;
  supportedAssets: string[];
  lockup: string;
  minimumDeposit: number | null;

  status: 'live' | 'coming-soon';
  launchTarget?: string;
  capacityNote?: string;
  /**
   * Set when no source publishes a rate for this strategy, holding the reason.
   * A managed strategy such as funding-rate arbitrage has nothing readable on
   * chain and nothing exposed off it, so the honest output is to say so rather
   * than show a curated number the reader cannot check anywhere.
   *
   * The row keeps its TVL and its full risk breakdown — only the rate is
   * missing — and is excluded from the best/safest APY stats.
   */
  unpublishedRate?: string;

  /**
   * Set to withhold this record from the dashboard, holding the reason.
   *
   * For opportunities that are real and worth tracking but cannot yet be
   * represented honestly — typically because no source publishes their rate or
   * size, and a row of blanks reads as broken rather than principled. The
   * curated research stays here, so relisting is deleting one line rather than
   * rebuilding from scratch.
   *
   * Distinct from `unpublishedRate`, which SHOWS the row and states that one
   * figure is unavailable. This hides the row entirely.
   */
  hiddenReason?: string;

  /** Identifiers enrichment adapters use to find this protocol upstream. */
  externalIds: {
    defiLlamaProject?: string;
    defiLlamaPool?: string;
    velarPool?: string;
    /**
     * Marks the row whose TVL is the entire PoX stacking pool. Only one row may
     * set this: `stacked_ustx` is a single chain-wide total, so attributing it
     * to more than one opportunity would double-count the same STX.
     */
    stacksPox?: boolean;
    /**
     * Which realized rate to take from StackingDAO's stats endpoint —
     * 'native' | 'ststx' | 'ststxbtc' | 'stbtc'. Unlike stacksPox these are
     * per-product rates, so several rows may each claim their own.
     */
    stackingDaoApyKey?: string;
    /** Numeric pool id on ALEX's AMM, for realized trading-fee APR. */
    alexPoolId?: number;
    /** Pool contract address on Bitflow's DEX, for USD liquidity. */
    bitflowPool?: string;
  };
}

export const PROTOCOL_REGISTRY: ProtocolRecord[] = [
  {
    id: "bitcoin-staking",
    name: "Bitcoin Staking (Native BTC)",
    shortName: "Bitcoin Staking",
    slug: "bitcoin-staking",
    description: "Self-custodial native BTC yield — your Bitcoin stays on L1 under your own keys. Phase 1 of the Stacks 2026 roadmap.",
    category: "Staking",
    icon: "₿",
    website: "https://www.stacks.co/yield",
    appUrl: "https://www.stacks.co/yield",

    protocolAgeMonths: 0,
    audited: false,
    audits: [],
    smartContractRisk: "Very Low",
    ilRisk: "None",
    healthScore: 9,
    curatedRiskScore: 2.0,

    strategy: "Bond BTC (kept self-custodial on Bitcoin L1) paired with a ≥5% STX ratio to earn native BTC yield from a waterfall of miner revenue. Rewards paid in BTC.",
    earnAsset: "BTC",
    supportedAssets: ["BTC","sBTC","STX"],
    lockup: "Cycle-based bond",
    minimumDeposit: null,

    status: "coming-soon",
    launchTarget: "Q3 2026",
    capacityNote: "3,000 BTC initial capacity · target 3% BTC APY · 5% min STX pairing",
    externalIds: {},
  },
  {
    id: "native-stacking",
    name: "Native STX Stacking",
    shortName: "STX Stacking",
    slug: "native-stacking",
    description: "Lock STX in Proof of Transfer consensus to earn BTC rewards. Pairing sBTC alongside (\"dual stacking\") targets a boosted rate on the same locked STX.",
    category: "Staking",
    icon: "⚡",
    website: "https://stacks.co",
    appUrl: "https://app.stacks.co",

    protocolAgeMonths: 36,
    audited: true,
    audits: ["Multiple"],
    smartContractRisk: "Very Low",
    ilRisk: "None",
    healthScore: 9.5,
    curatedRiskScore: 1.8,

    // Dual stacking was previously a separate row. It is the same locked STX
    // under PoX, so a second row double-counted the pool and invented a TVL
    // nobody publishes — it belongs here as a variant of one opportunity.
    strategy: "Lock STX in PoX consensus. Bitcoin miners transfer BTC to stackers each cycle. Holding sBTC alongside the locked STX targets a boosted rate on the same position.",
    earnAsset: "BTC",
    supportedAssets: ["STX"],
    lockup: "Cycle-based (~2 weeks)",
    minimumDeposit: 100,

    status: "live",
    externalIds: {
      stacksPox: true,
      stackingDaoApyKey: "native",
    },
  },
  {
    id: "hermetica-hbtc",
    name: "Hermetica — hBTC Vault",
    shortName: "Hermetica",
    slug: "hermetica-hbtc",
    description: "Delta-neutral BTC yield via funding rate arbitrage strategy",
    category: "Yield",
    icon: "⚗️",
    website: "https://hermetica.fi",
    appUrl: "https://app.hermetica.fi",

    protocolAgeMonths: 18,
    audited: true,
    audits: ["Clarity Alliance"],
    smartContractRisk: "Medium",
    ilRisk: "None",
    healthScore: 7.6,
    curatedRiskScore: 5.8,

    strategy: "BTC→sBTC→Zest collateral→borrow USDCx→convert USDh→earn funding rates",
    earnAsset: "BTC",
    supportedAssets: ["BTC","sBTC"],
    lockup: "None",
    minimumDeposit: null,

    status: "live",
    // Delta-neutral funding-rate arbitrage has no rate readable on chain, and
    // Hermetica exposes none off it. The row keeps its TVL and risk breakdown;
    // the rate is stated as unpublished rather than carried as a guess.
    unpublishedRate: "Managed strategy — no rate is published by the protocol or readable on chain.",
    externalIds: {
      defiLlamaProject: "hermetica",
    },
  },
  {
    id: "stackingdao-ststx",
    name: "StackingDAO — stSTX",
    shortName: "StackingDAO",
    slug: "stackingdao-ststx",
    description: "Liquid stacking — earn BTC yield while keeping STX liquid",
    category: "Staking",
    icon: "🏛️",
    website: "https://stackingdao.com",
    appUrl: "https://app.stackingdao.com",

    protocolAgeMonths: 24,
    audited: true,
    audits: ["Clarity Alliance"],
    smartContractRisk: "Low",
    ilRisk: "None",
    healthScore: 8.4,
    curatedRiskScore: 3.1,

    strategy: "Deposit STX → receive stSTX (rebasing token). stSTX accrues BTC yield.",
    earnAsset: "BTC",
    supportedAssets: ["STX"],
    lockup: "None (liquid)",
    minimumDeposit: null,

    status: "live",
    externalIds: {
      defiLlamaProject: "stackingdao",
      stackingDaoApyKey: "ststx",
    },
  },
  {
    id: "stackingdao-stbtc",
    name: "StackingDAO — stBTC",
    shortName: "stBTC",
    slug: "stackingdao-stbtc",
    description: "Deposit BTC or sBTC and receive stBTC — native Bitcoin yield that stays liquid across Stacks DeFi.",
    category: "Staking",
    icon: "🏛️",
    website: "https://stackingdao.com",
    appUrl: "https://app.stackingdao.com",

    protocolAgeMonths: 24,
    audited: true,
    audits: ["Clarity Alliance"],
    // Higher than stSTX despite the same operator: stBTC is a recent product
    // and its contract has far less time in production than the protocol
    // behind it. The audit coverage recorded here is the protocol's — whether
    // this specific contract is in scope still needs confirming.
    smartContractRisk: "Medium",
    ilRisk: "None",
    healthScore: 8,
    curatedRiskScore: 3.8,

    strategy: "Deposit BTC or sBTC → receive stBTC. Yield accrues in Bitcoin through a rising stBTC/sBTC ratio, realised on redemption.",
    earnAsset: "BTC",
    supportedAssets: ["BTC","sBTC"],
    lockup: "None (liquid)",
    minimumDeposit: null,

    status: "live",
    externalIds: {
      defiLlamaProject: "stackingdao",
      stackingDaoApyKey: "stbtc",
    },
  },
  {
    id: "stackingdao-ststxbtc",
    name: "StackingDAO — stSTXbtc",
    shortName: "stSTXbtc",
    slug: "stackingdao-ststxbtc",
    description: "Stake STX and take the rewards in sBTC rather than STX — Bitcoin yield from a STX position.",
    category: "Staking",
    icon: "🏛️",
    website: "https://stackingdao.com",
    appUrl: "https://app.stackingdao.com",

    protocolAgeMonths: 24,
    audited: true,
    audits: ["Clarity Alliance"],
    smartContractRisk: "Medium",
    ilRisk: "None",
    healthScore: 8,
    curatedRiskScore: 3.8,

    strategy: "Stake STX through StackingDAO and receive PoX rewards in sBTC, distributed roughly weekly and claimable at any time.",
    earnAsset: "sBTC",
    supportedAssets: ["STX"],
    lockup: "None (liquid)",
    minimumDeposit: null,

    status: "live",
    externalIds: {
      defiLlamaProject: "stackingdao",
      stackingDaoApyKey: "ststxbtc",
    },
  },
  {
    id: "zest-btc-supply",
    name: "Zest — BTC Supply",
    shortName: "Zest",
    slug: "zest-btc-supply",
    description: "Supply Bitcoin to earn lending interest from BTC borrowers",
    category: "Lending",
    icon: "🍊",
    website: "https://zestprotocol.com",
    appUrl: "https://app.zestprotocol.com",

    protocolAgeMonths: 20,
    audited: true,
    audits: ["Clarity Alliance"],
    smartContractRisk: "Low",
    ilRisk: "None",
    healthScore: 9.1,
    curatedRiskScore: 3.5,

    strategy: "Supply BTC to lending pool. Borrowers pay interest. Withdraw anytime.",
    earnAsset: "BTC",
    supportedAssets: ["BTC","sBTC"],
    lockup: "None",
    minimumDeposit: null,

    status: "live",
    externalIds: {
      defiLlamaProject: "zest-v2",
      defiLlamaPool: "f003d6df-fb8f-4a74-8cfb-aee8cc44f433",
    },
  },
  {
    id: "zest-ststxbtc-supply",
    name: "Zest — stSTXbtc Supply",
    shortName: "Zest stSTXbtc",
    slug: "zest-ststxbtc-supply",
    description: "Supply stSTXbtc to Zest's lending market and earn borrower interest on top of the underlying stacking yield.",
    category: "Lending",
    icon: "🍊",
    website: "https://zestprotocol.com",
    appUrl: "https://app.zestprotocol.com",

    protocolAgeMonths: 20,
    audited: true,
    audits: ["Clarity Alliance"],
    smartContractRisk: "Low",
    ilRisk: "None",
    healthScore: 8.4,
    // Above the plain sBTC market: this position stacks Zest's contract risk on
    // top of StackingDAO's, since the collateral is itself a liquid-staking
    // claim rather than the underlying asset.
    curatedRiskScore: 4.4,

    strategy: "Supply stSTXbtc to Zest's lending pool. Earns borrower interest in addition to the BTC yield the token already accrues.",
    earnAsset: "sBTC",
    supportedAssets: ["stSTXbtc"],
    lockup: "None",
    minimumDeposit: null,

    status: "live",
    externalIds: {
      defiLlamaProject: "zest-v2",
      defiLlamaPool: "369d03f8-40a3-4d00-aad7-659776f41647",
    },
  },
  {
    id: "zest-zvstbtc",
    name: "Zest — zvstBTC Vault",
    shortName: "zvstBTC",
    slug: "zest-zvstbtc",
    description: "Automated levered Bitcoin staking — the vault posts stBTC as collateral, borrows sBTC against it and restakes, looping to amplify the base staking yield.",
    category: "Yield",
    icon: "🍊",
    website: "https://zestprotocol.com",
    appUrl: "https://app.zestprotocol.com",

    protocolAgeMonths: 20,
    audited: true,
    audits: ["Clarity Alliance"],
    // High despite Zest's own maturity: this is Zest's first Stacks Vault, and
    // a deposit rides three contract surfaces at once — the vault, Zest's
    // lending market, and StackingDAO's staking. A failure in any one of them
    // reaches the position.
    smartContractRisk: "High",
    ilRisk: "None",
    healthScore: 6.5,
    curatedRiskScore: 6.8,

    strategy: "Deposit BTC, sBTC or stBTC. The vault posts stBTC as collateral on Zest, borrows sBTC, stakes it into more stBTC, and repeats within its risk limits. Net return is the staking yield on the larger position minus borrowing costs and fees.",
    earnAsset: "BTC",
    supportedAssets: ["BTC","sBTC","stBTC"],
    lockup: "Withdrawal cooldown",
    minimumDeposit: null,

    status: "live",
    // Zest publishes a 6-8% TARGET, which is not a reading — realised return
    // depends on borrowing cost and utilisation, and moves against the
    // depositor when either does. Showing the target as an APY would present
    // an aspiration as a measurement. The vault's share price is readable on
    // chain, so this is solvable; see docs/data-sources/33-zest-protocol.md.
    unpublishedRate: "Levered strategy — Zest publishes a 6-8% target, not a realised rate. Returns move with borrowing costs and utilisation.",
    // Withheld for now: with neither a rate nor a TVL, the row renders as two
    // blanks, which reads as a broken dashboard rather than a deliberate
    // disclosure. The record stays because this is the highest-value
    // integration target we have — see docs/data-sources/02-open-questions.md.
    hiddenReason: "No source publishes the vault's rate or size yet. Relist once the share-price contract read lands.",
    externalIds: {
      defiLlamaProject: "zest-v2",
    },
  },
  {
    id: "bitflow-sbtc-stx",
    name: "Bitflow — sBTC-STX",
    shortName: "Bitflow",
    slug: "bitflow-sbtc-stx",
    description: "LP in sBTC-STX pool via Bitflow's HODLMM",
    category: "DEX/LP",
    icon: "🌊",
    website: "https://bitflow.finance",
    appUrl: "https://app.bitflow.finance",

    protocolAgeMonths: 15,
    audited: true,
    audits: ["Clarity Alliance"],
    smartContractRisk: "Medium",
    ilRisk: "Low",
    healthScore: 6.8,
    curatedRiskScore: 5.5,

    strategy: "Provide liquidity to sBTC-STX pair. Earn trading fees + BTC/STX rewards.",
    earnAsset: "sBTC + STX",
    supportedAssets: ["sBTC","STX"],
    lockup: "None",
    minimumDeposit: null,

    status: "live",
    externalIds: {
      defiLlamaProject: "bitflow",
      bitflowPool: "SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.xyk-pool-sbtc-stx-v-1-1",
    },
  },
  {
    id: "bitflow-sbtc-pbtc",
    name: "Bitflow — sBTC-pBTC",
    shortName: "Bitflow sBTC-pBTC",
    slug: "bitflow-sbtc-pbtc",
    description: "Provide liquidity to Bitflow's sBTC-pBTC stableswap — a BTC-to-BTC pair, so both sides stay Bitcoin.",
    category: "DEX/LP",
    icon: "🌊",
    website: "https://bitflow.finance",
    appUrl: "https://app.bitflow.finance",

    protocolAgeMonths: 15,
    audited: true,
    audits: ["Clarity Alliance"],
    smartContractRisk: "Medium",
    // Both sides are Bitcoin claims, so divergence is bounded in a way an
    // sBTC-STX pair's is not. Not "None": pBTC is a bridged representation and
    // a depeg would move the pair like any other divergence.
    ilRisk: "Low",
    healthScore: 7,
    curatedRiskScore: 5.2,

    strategy: "LP the sBTC-pBTC stableswap pool. Earns trading fees; both legs remain BTC-denominated, so there is no exit to a non-Bitcoin asset.",
    earnAsset: "sBTC",
    supportedAssets: ["sBTC","pBTC"],
    lockup: "None",
    minimumDeposit: null,

    status: "live",
    externalIds: {
      defiLlamaProject: "bitflow",
      bitflowPool: "SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.stableswap-pool-sbtc-pbtc-v-1-1",
    },
  },
  {
    id: "velar-sbtc",
    name: "Velar — sBTC Pool",
    shortName: "Velar",
    slug: "velar-sbtc",
    description: "LP in Velar's STX-sBTC pool, earning trading fees",
    category: "DEX/LP",
    icon: "💧",
    website: "https://velar.co",
    appUrl: "https://app.velar.co",

    protocolAgeMonths: 10,
    audited: false,
    audits: [],
    smartContractRisk: "Medium",
    ilRisk: "Low",
    healthScore: 7,
    curatedRiskScore: 6.5,

    strategy: "LP in Velar's STX-sBTC pool. Earn trading fees only — no active token incentive program.",
    earnAsset: "sBTC",
    supportedAssets: ["sBTC","STX"],
    lockup: "None",
    minimumDeposit: null,

    status: "live",
    externalIds: {
      defiLlamaProject: "velar",
      velarPool: "SP20X3DC5R091J8B6YPQT638J8NR1W83KN6TN5BJY.univ2-lp-token-v1_0_0-0070",
    },
  },
  {
    id: "alex-stx-farm",
    name: "ALEX — STX-ALEX Farm",
    shortName: "ALEX Farm",
    slug: "alex-stx-farm",
    description: "High-yield token farming with ALEX emissions",
    category: "DEX/LP",
    icon: "🔥",
    website: "https://alexlab.co",
    appUrl: "https://app.alexlab.co",

    protocolAgeMonths: 30,
    audited: true,
    audits: ["Clarity Alliance"],
    smartContractRisk: "Medium",
    ilRisk: "High",
    healthScore: 6.8,
    curatedRiskScore: 7.1,

    strategy: "LP in STX-ALEX. High APY driven by token emissions. IL risk from divergence.",
    earnAsset: "STX + ALEX",
    supportedAssets: ["STX","ALEX"],
    lockup: "None (variable APY)",
    minimumDeposit: null,

    status: "live",
    externalIds: {
      defiLlamaProject: "alex",
      alexPoolId: 13,
    },
  },
];

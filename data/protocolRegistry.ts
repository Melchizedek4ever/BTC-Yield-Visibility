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
  audited: boolean;
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

  /** Identifiers enrichment adapters use to find this protocol upstream. */
  externalIds: {
    defiLlamaProject?: string;
    defiLlamaPool?: string;
    velarPool?: string;
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
    id: "dual-stacking",
    name: "Dual Stacking",
    shortName: "Dual Stacking",
    slug: "dual-stacking",
    description: "Stack STX and hold sBTC simultaneously for boosted BTC yield",
    category: "Staking",
    icon: "🔗",
    website: "https://stacks.co",
    appUrl: "https://app.stacks.co",

    protocolAgeMonths: 6,
    audited: true,
    audits: ["Clarity Alliance"],
    smartContractRisk: "Very Low",
    ilRisk: "None",
    healthScore: 9.2,
    curatedRiskScore: 2.2,

    strategy: "Stack STX + hold sBTC for BTC-denominated yield via Proof of Transfer",
    earnAsset: "BTC",
    supportedAssets: ["STX","sBTC"],
    lockup: "Cycle-based (~2 weeks)",
    minimumDeposit: null,

    status: "live",
    externalIds: {
      defiLlamaProject: "stacks",
    },
  },
  {
    id: "native-stacking",
    name: "Native STX Stacking",
    shortName: "STX Stacking",
    slug: "native-stacking",
    description: "Lock STX in Proof of Transfer consensus to earn BTC rewards",
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

    strategy: "Lock STX in PoX consensus. Bitcoin miners transfer BTC to stackers each cycle.",
    earnAsset: "BTC",
    supportedAssets: ["STX"],
    lockup: "Cycle-based (~2 weeks)",
    minimumDeposit: 100,

    status: "live",
    externalIds: {
      defiLlamaProject: "stacks",
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
    id: "granite-btc-supply",
    name: "Granite — BTC Supply",
    shortName: "Granite",
    slug: "granite-btc-supply",
    description: "Supply BTC to institutional-grade lending protocol",
    category: "Lending",
    icon: "🪨",
    website: "https://granite.fi",
    appUrl: "https://app.granite.fi",

    protocolAgeMonths: 12,
    audited: true,
    audits: ["Clarity Alliance"],
    smartContractRisk: "Low",
    ilRisk: "None",
    healthScore: 8.2,
    curatedRiskScore: 4.0,

    strategy: "Supply BTC to institutional borrowers. Higher rates than Zest.",
    earnAsset: "BTC",
    supportedAssets: ["BTC","sBTC"],
    lockup: "None",
    minimumDeposit: null,

    status: "live",
    externalIds: {
      defiLlamaProject: "granite-protocol",
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
    },
  },
  {
    id: "alex-sbtc-alex",
    name: "ALEX — sBTC-ALEX Pool",
    shortName: "ALEX LP",
    slug: "alex-sbtc-alex",
    description: "Provide liquidity on ALEX AMM and earn trading fees + ALEX rewards",
    category: "DEX/LP",
    icon: "🔬",
    website: "https://alexlab.co",
    appUrl: "https://app.alexlab.co",

    protocolAgeMonths: 30,
    audited: true,
    audits: ["Clarity Alliance"],
    smartContractRisk: "Medium",
    ilRisk: "Medium",
    healthScore: 7.2,
    curatedRiskScore: 6.2,

    strategy: "LP in sBTC-ALEX pair. ALEX token emission rewards dominate APY.",
    earnAsset: "sBTC + ALEX",
    supportedAssets: ["sBTC","ALEX"],
    lockup: "None",
    minimumDeposit: null,

    status: "live",
    externalIds: {
      defiLlamaProject: "alex",
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
    },
  },
  {
    id: "arkadiko-diko",
    name: "Arkadiko — DIKO Stake",
    shortName: "Arkadiko",
    slug: "arkadiko-diko",
    description: "Stake DIKO governance token to earn protocol yield",
    category: "Yield",
    icon: "🏺",
    website: "https://arkadiko.finance",
    appUrl: "https://app.arkadiko.finance",

    protocolAgeMonths: 28,
    audited: true,
    audits: ["Clarity Alliance"],
    smartContractRisk: "Medium",
    ilRisk: "None",
    healthScore: 6.2,
    curatedRiskScore: 6.5,

    strategy: "Stake DIKO governance token. Earn DIKO + USDA stablecoin from protocol fees.",
    earnAsset: "DIKO + USDA",
    supportedAssets: ["DIKO"],
    lockup: "None",
    minimumDeposit: null,

    status: "live",
    externalIds: {
      defiLlamaProject: "arkadiko",
    },
  },
];

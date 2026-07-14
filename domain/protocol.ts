/**
 * A yield PROVIDER (the app / protocol). A protocol can offer many yield
 * opportunities — do not conflate the two. See {@link YieldOpportunity}.
 */
export type ProtocolCategory = 'Staking' | 'Lending' | 'DEX/LP' | 'Yield';
export type SmartContractRisk = 'Very Low' | 'Low' | 'Medium' | 'High';
export type IlRisk = 'None' | 'Low' | 'Medium' | 'High';

export interface Protocol {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  category: ProtocolCategory;
  icon: string;
  website: string;
  appUrl: string;
  description: string;

  /** Months the protocol has been live. */
  protocolAgeMonths: number;
  audited: boolean;
  audits: string[];
  smartContractRisk: SmartContractRisk;
  supportedAssets: string[];

  /** External identifiers used by enrichment adapters. */
  metadata: {
    defiLlamaProject?: string;
    defiLlamaPool?: string;
  };
}

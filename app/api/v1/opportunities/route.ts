import { NextResponse } from 'next/server';
import { getOpportunities } from '@/services/yieldService';

/**
 * API-first endpoint: the canonical YieldOpportunity[] intelligence model, for
 * wallets, protocols, developers, and agents. Not UI-shaped — consumers get the
 * full risk breakdown and score components, not a dashboard view.
 *
 *   GET /api/v1/opportunities  →  { data: YieldOpportunity[], meta }
 */
export async function GET() {
  const data = await getOpportunities();
  return NextResponse.json({
    data,
    meta: {
      schema: 'YieldOpportunity@1',
      count: data.length,
      generatedAt: new Date().toISOString(),
    },
  });
}

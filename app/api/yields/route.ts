import { NextResponse } from 'next/server';
import { getDashboard } from '@/services/yieldService';

/**
 * Dashboard feed (legacy shape). Thin controller: validate (nothing to validate
 * here yet), delegate to the service, return. All business logic lives in
 * services/yieldService.ts and the domain engines.
 */
export async function GET() {
  const data = await getDashboard();
  return NextResponse.json(data);
}

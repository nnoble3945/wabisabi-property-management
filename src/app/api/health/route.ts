import { NextResponse } from 'next/server';
import { databaseConfigured } from '@/lib/db';

export async function GET() {
  return NextResponse.json({ service: 'noble-property-management', status: 'ok', databaseConfigured: databaseConfigured() });
}

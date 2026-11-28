import { NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/auth';
import { databaseConfigured } from '@/lib/db';

export async function GET() {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    service: 'wabisabi-property-management',
    status: 'ok',
    databaseConfigured: databaseConfigured(),
  });
}

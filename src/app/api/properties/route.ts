import { NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/auth';
import { databaseConfigured } from '@/lib/db';
import { createProperty, listProperties } from '@/lib/properties';
import { createPropertySchema } from '@/lib/schemas';

export const runtime = 'nodejs';

export async function GET() {
  if (!(await isAuthorized())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!databaseConfigured()) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  try {
    return NextResponse.json({ properties: await listProperties() });
  } catch (error) {
    console.error('Property query failed', error);
    return NextResponse.json({ error: 'Unable to load properties' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAuthorized())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!databaseConfigured()) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const parsed = createPropertySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid property data', details: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const property = await createProperty(parsed.data);
    return NextResponse.json({ property }, { status: 201 });
  } catch (error) {
    console.error('Property insert failed', error);
    return NextResponse.json({ error: 'Unable to create property' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isAuthorized } from '@/lib/auth';
import { isTransientSqlError } from '@/lib/sql-resilience.mjs';
import { databaseConfigured } from '@/lib/db';
import { getProperty, updateProperty } from '@/lib/properties';
import { createPropertySchema } from '@/lib/schemas';

export const runtime = 'nodejs';
type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  if (!(await isAuthorized())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid property ID' }, { status: 400 });
  }
  if (!databaseConfigured()) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  try {
    const property = await getProperty(id);
    if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    return NextResponse.json({ property });
  } catch (error) {
    console.error('Property detail query failed', error);
    if (isTransientSqlError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable. Please retry shortly.' }, { status: 503, headers: { 'Retry-After': '10' } });
    }
    return NextResponse.json({ error: 'Unable to load property' }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: Context) {
  if (!(await isAuthorized())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid property ID' }, { status: 400 });
  }
  if (!databaseConfigured()) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const parsed = createPropertySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid property data', details: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const property = await updateProperty(id, parsed.data);
    if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    return NextResponse.json({ property });
  } catch (error) {
    console.error('Property update failed', error);
    if (isTransientSqlError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable. Please retry shortly.' }, { status: 503, headers: { 'Retry-After': '10' } });
    }
    return NextResponse.json({ error: 'Unable to update property' }, { status: 500 });
  }
}

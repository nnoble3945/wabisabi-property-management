import 'server-only';
import sql from 'mssql';
import { getPool } from '@/lib/db';
import type { CreatePropertyInput } from '@/lib/schemas';

export type PropertyRecord = {
  PropertyId: string;
  Name: string;
  PropertyType: 'PRIMARY' | 'LONG_TERM_RENTAL' | 'SHORT_TERM_RENTAL';
  AddressLine1: string;
  City: string;
  State: string;
  PostalCode: string;
};

export async function listProperties(): Promise<PropertyRecord[]> {
  const pool = await getPool();
  const result = await pool.request().query<PropertyRecord>(`
    SELECT PropertyId, Name, PropertyType, AddressLine1, City, State, PostalCode
    FROM dbo.Property WHERE IsActive = 1 ORDER BY Name ASC
  `);
  return result.recordset;
}

export async function createProperty(data: CreatePropertyInput): Promise<PropertyRecord> {
  const pool = await getPool();
  const result = await pool.request()
    .input('Name', sql.NVarChar(120), data.name)
    .input('PropertyType', sql.VarChar(30), data.type)
    .input('AddressLine1', sql.NVarChar(200), data.addressLine1)
    .input('City', sql.NVarChar(100), data.city)
    .input('State', sql.NVarChar(50), data.state)
    .input('PostalCode', sql.NVarChar(20), data.postalCode)
    .query<PropertyRecord>(`
      INSERT INTO dbo.Property (Name, PropertyType, AddressLine1, City, State, PostalCode)
      OUTPUT INSERTED.PropertyId, INSERTED.Name, INSERTED.PropertyType,
             INSERTED.AddressLine1, INSERTED.City, INSERTED.State, INSERTED.PostalCode
      VALUES (@Name, @PropertyType, @AddressLine1, @City, @State, @PostalCode)
    `);
  return result.recordset[0];
}

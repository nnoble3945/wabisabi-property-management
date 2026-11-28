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
  AcquisitionDate: string | null;
  PurchasePrice: number | null;
};

const propertyColumns = `
  PropertyId, Name, PropertyType, AddressLine1, City, [State], PostalCode,
  CONVERT(varchar(10), AcquisitionDate, 23) AS AcquisitionDate, PurchasePrice
`;

function addPropertyInputs(request: sql.Request, data: CreatePropertyInput) {
  return request
    .input('Name', sql.NVarChar(120), data.name)
    .input('PropertyType', sql.VarChar(30), data.type)
    .input('AddressLine1', sql.NVarChar(200), data.addressLine1)
    .input('City', sql.NVarChar(100), data.city)
    .input('State', sql.NVarChar(50), data.state)
    .input('PostalCode', sql.NVarChar(20), data.postalCode)
    .input('AcquisitionDate', sql.Date, data.acquisitionDate ? new Date(`${data.acquisitionDate}T00:00:00Z`) : null)
    .input('PurchasePrice', sql.Decimal(19, 2), data.purchasePrice ?? null);
}

export async function listProperties(): Promise<PropertyRecord[]> {
  const pool = await getPool();
  const result = await pool.request().query<PropertyRecord>(`
    SELECT ${propertyColumns}
    FROM dbo.Property WHERE IsActive = 1 ORDER BY Name ASC
  `);
  return result.recordset;
}

export async function getProperty(propertyId: string): Promise<PropertyRecord | null> {
  const pool = await getPool();
  const result = await pool.request()
    .input('PropertyId', sql.UniqueIdentifier, propertyId)
    .query<PropertyRecord>(`
      SELECT ${propertyColumns}
      FROM dbo.Property WHERE PropertyId = @PropertyId AND IsActive = 1
    `);
  return result.recordset[0] ?? null;
}

export async function createProperty(data: CreatePropertyInput): Promise<PropertyRecord> {
  const pool = await getPool();
  const result = await addPropertyInputs(pool.request(), data)
    .query<PropertyRecord>(`
      DECLARE @Created TABLE (PropertyId uniqueidentifier);
      INSERT INTO dbo.Property (
        Name, PropertyType, AddressLine1, City, [State], PostalCode, AcquisitionDate, PurchasePrice
      )
      OUTPUT INSERTED.PropertyId INTO @Created
      VALUES (
        @Name, @PropertyType, @AddressLine1, @City, @State, @PostalCode, @AcquisitionDate, @PurchasePrice
      );
      SELECT ${propertyColumns} FROM dbo.Property
      WHERE PropertyId IN (SELECT PropertyId FROM @Created);
    `);
  return result.recordset[0];
}

export async function updateProperty(propertyId: string, data: CreatePropertyInput): Promise<PropertyRecord | null> {
  const pool = await getPool();
  const result = await addPropertyInputs(pool.request(), data)
    .input('PropertyId', sql.UniqueIdentifier, propertyId)
    .query<PropertyRecord>(`
      UPDATE dbo.Property
      SET Name = @Name, PropertyType = @PropertyType,
          AddressLine1 = @AddressLine1, City = @City, [State] = @State,
          PostalCode = @PostalCode, AcquisitionDate = @AcquisitionDate,
          PurchasePrice = @PurchasePrice, UpdatedAt = SYSUTCDATETIME()
      WHERE PropertyId = @PropertyId AND IsActive = 1;
      SELECT ${propertyColumns}
      FROM dbo.Property WHERE PropertyId = @PropertyId AND IsActive = 1;
    `);
  return result.recordset[0] ?? null;
}

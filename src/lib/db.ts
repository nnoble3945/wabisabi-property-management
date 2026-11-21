import 'server-only';
import sql, { type ConnectionPool, type config as SqlConfig } from 'mssql';
import { DefaultAzureCredential } from '@azure/identity';

let cachedPool: Promise<ConnectionPool> | undefined;
let cachedUntil = 0;

export function databaseConfigured(): boolean {
  return Boolean(process.env.AZURE_SQL_SERVER && process.env.AZURE_SQL_DATABASE);
}

async function openPool(): Promise<ConnectionPool> {
  const server = process.env.AZURE_SQL_SERVER;
  const database = process.env.AZURE_SQL_DATABASE;
  if (!server || !database) throw new Error('Azure SQL is not configured');

  const config: SqlConfig = {
    server,
    database,
    port: 1433,
    options: { encrypt: true, trustServerCertificate: false },
    pool: { max: 4, min: 0, idleTimeoutMillis: 30000 },
    connectionTimeout: 15000,
  };

  if (process.env.SQL_USER && process.env.SQL_PASSWORD) {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('SQL passwords are allowed only for local development');
    }
    config.user = process.env.SQL_USER;
    config.password = process.env.SQL_PASSWORD;
  } else {
    const token = await new DefaultAzureCredential().getToken('https://database.windows.net/.default');
    if (!token) throw new Error('Unable to obtain Azure SQL access token');
    config.authentication = {
      type: 'azure-active-directory-access-token',
      options: { token: token.token },
    };
  }

  return new sql.ConnectionPool(config).connect();
}

export async function getPool(): Promise<ConnectionPool> {
  if (!databaseConfigured()) throw new Error('Azure SQL configuration is missing');
  // Access tokens expire. Recreate pools periodically instead of retaining stale credentials.
  if (!cachedPool || Date.now() > cachedUntil) {
    const oldPool = cachedPool;
    cachedPool = openPool();
    cachedUntil = Date.now() + 40 * 60 * 1000;
    cachedPool.catch(() => { cachedPool = undefined; cachedUntil = 0; });
    if (oldPool) void oldPool.then((pool) => pool.close()).catch(() => {});
  }
  return cachedPool;
}

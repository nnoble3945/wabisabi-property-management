import 'server-only';
import { headers } from 'next/headers';

/**
 * Production is DENY BY DEFAULT. App Service Easy Auth must also be configured
 * to require Microsoft Entra authentication for EVERY request. This function
 * adds a second, explicit per-user allowlist check.
 */
export async function isAuthorized(): Promise<boolean> {
  if (process.env.NODE_ENV === 'development' && process.env.DEV_AUTH_BYPASS === 'true') {
    return true;
  }

  if (process.env.APP_AUTH_MODE !== 'azure' || !process.env.WEBSITE_SITE_NAME) {
    return false;
  }

  const principalId = (await headers()).get('x-ms-client-principal-id')?.trim().toLowerCase();
  const permitted = (process.env.ALLOWED_PRINCIPAL_IDS ?? '')
    .split(',')
    .map((id) => id.trim().toLowerCase())
    .filter(Boolean);

  return Boolean(principalId && permitted.includes(principalId));
}

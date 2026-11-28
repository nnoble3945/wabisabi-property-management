import 'server-only';
import { headers } from 'next/headers';
import { isAllowedAzurePrincipal, isLocalDevelopmentBypassEnabled } from '@/lib/auth-policy.mjs';

/**
 * Azure App Service Easy Auth MUST require Microsoft Entra sign-in at the edge.
 * This application-level allowlist is an additional safeguard, not a replacement
 * for validating identities at the trusted App Service edge.
 */
export async function isAuthorized(): Promise<boolean> {
  if (isLocalDevelopmentBypassEnabled(process.env.NODE_ENV, process.env.DEV_AUTH_BYPASS)) {
    return true;
  }

  return isAllowedAzurePrincipal({
    authMode: process.env.APP_AUTH_MODE,
    siteName: process.env.WEBSITE_SITE_NAME,
    principalId: (await headers()).get('x-ms-client-principal-id'),
    allowedPrincipalIds: process.env.ALLOWED_PRINCIPAL_IDS,
  });
}

const ENTRA_OBJECT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * @param {string | undefined} nodeEnv
 * @param {string | undefined} bypassFlag
 * @returns {boolean}
 */
export function isLocalDevelopmentBypassEnabled(nodeEnv, bypassFlag) {
  return nodeEnv === 'development' && bypassFlag === 'true';
}

/**
 * @param {{
 *   authMode: string | undefined,
 *   siteName: string | undefined,
 *   principalId: string | null | undefined,
 *   allowedPrincipalIds: string | undefined
 * }} input
 * @returns {boolean}
 */
export function isAllowedAzurePrincipal({ authMode, siteName, principalId, allowedPrincipalIds }) {
  if (authMode !== 'azure' || !siteName?.trim() || typeof principalId !== 'string') {
    return false;
  }

  const normalizedPrincipal = principalId.trim().toLowerCase();
  if (!ENTRA_OBJECT_ID.test(normalizedPrincipal)) return false;

  return (allowedPrincipalIds ?? '')
    .split(',')
    .some((id) => id.trim().toLowerCase() === normalizedPrincipal);
}

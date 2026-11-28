import assert from 'node:assert/strict';
import test from 'node:test';
import { isAllowedAzurePrincipal, isLocalDevelopmentBypassEnabled } from '../src/lib/auth-policy.mjs';

const allowedId = 'e5f995a9-d3a0-42be-8da2-940030106f77';
const otherId = 'd1b45b2d-23e3-4f6e-8e92-d6f42b07d45a';
const valid = {
  authMode: 'azure',
  siteName: 'app-wabisabi-pm-dev',
  principalId: allowedId,
  allowedPrincipalIds: allowedId,
};

test('development bypass only works with an explicit flag in development', () => {
  assert.equal(isLocalDevelopmentBypassEnabled('development', 'true'), true);
  assert.equal(isLocalDevelopmentBypassEnabled('production', 'true'), false);
  assert.equal(isLocalDevelopmentBypassEnabled('development', 'false'), false);
  assert.equal(isLocalDevelopmentBypassEnabled('test', 'true'), false);
});

test('grants only explicitly allowlisted Azure principal IDs', () => {
  assert.equal(isAllowedAzurePrincipal(valid), true);
  assert.equal(isAllowedAzurePrincipal({ ...valid, principalId: otherId }), false);
  assert.equal(isAllowedAzurePrincipal({ ...valid, allowedPrincipalIds: '' }), false);
  assert.equal(isAllowedAzurePrincipal({ ...valid, principalId: null }), false);
});

test('fails closed without Azure App Service settings', () => {
  assert.equal(isAllowedAzurePrincipal({ ...valid, authMode: undefined }), false);
  assert.equal(isAllowedAzurePrincipal({ ...valid, siteName: undefined }), false);
  assert.equal(isAllowedAzurePrincipal({ ...valid, siteName: ' ' }), false);
});

test('normalizes whitespace and case, and handles comma-separated allowlists', () => {
  assert.equal(isAllowedAzurePrincipal({
    ...valid,
    principalId: ` ${allowedId.toUpperCase()} `,
    allowedPrincipalIds: ` ${otherId}, ${allowedId} `,
  }), true);
});

test('rejects invalid principal IDs even when listed', () => {
  assert.equal(isAllowedAzurePrincipal({
    ...valid,
    principalId: 'attacker',
    allowedPrincipalIds: 'attacker',
  }), false);
});

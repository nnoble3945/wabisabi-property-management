import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getPropertyTypeLabel, money } from '../src/lib/labels.mjs';

describe('presentation helpers', () => {
  it('distinguishes all three property types', () => {
    assert.equal(getPropertyTypeLabel('PRIMARY'), 'Primary residence');
    assert.equal(getPropertyTypeLabel('LONG_TERM_RENTAL'), 'Long-term rental');
    assert.equal(getPropertyTypeLabel('SHORT_TERM_RENTAL'), 'Cabin / short-term rental');
  });
  it('formats dollars and cents', () => {
    assert.equal(money(1250.5), '$1,250.50');
  });
  it('rejects invalid amounts', () => {
    assert.throws(() => money(Number.NaN), TypeError);
  });
});

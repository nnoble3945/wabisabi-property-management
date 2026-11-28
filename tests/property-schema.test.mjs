import assert from 'node:assert/strict';
import test from 'node:test';
import { createPropertySchema } from '../src/lib/schemas.ts';

const valid = {
  name: 'Test Cabin',
  type: 'SHORT_TERM_RENTAL',
  addressLine1: '123 Example Road',
  city: 'Exampletown',
  state: 'OR',
  postalCode: '97067',
};

test('accepts each supported property category', () => {
  for (const type of ['PRIMARY', 'LONG_TERM_RENTAL', 'SHORT_TERM_RENTAL']) {
    assert.equal(createPropertySchema.safeParse({ ...valid, type }).success, true);
  }
});

test('accepts optional acquisition date and purchase price', () => {
  const result = createPropertySchema.safeParse({
    ...valid,
    acquisitionDate: '2026-11-27',
    purchasePrice: 675000,
  });
  assert.equal(result.success, true);
});

test('accepts null or omitted acquisition fields', () => {
  assert.equal(createPropertySchema.safeParse(valid).success, true);
  assert.equal(createPropertySchema.safeParse({
    ...valid,
    acquisitionDate: null,
    purchasePrice: null,
  }).success, true);
});

test('rejects malformed dates, negative prices, and invalid property categories', () => {
  for (const invalid of [
    { ...valid, acquisitionDate: '2026-02-30' },
    { ...valid, purchasePrice: -5 },
    { ...valid, purchasePrice: Number.POSITIVE_INFINITY },
    { ...valid, type: 'VACATION_HOME' },
  ]) {
    assert.equal(createPropertySchema.safeParse(invalid).success, false);
  }
});

test('rejects unknown fields and missing required address details', () => {
  assert.equal(createPropertySchema.safeParse({ ...valid, IsActive: false }).success, false);
  assert.equal(createPropertySchema.safeParse({ ...valid, addressLine1: '' }).success, false);
});

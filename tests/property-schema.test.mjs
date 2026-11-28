import assert from 'node:assert/strict';
import test from 'node:test';
import { createPropertySchema, propertyIdSchema } from '../src/lib/schemas.ts';

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


test('accepts SQL Server NEWSEQUENTIALID GUIDs as property IDs', () => {
  // SQL Server GUIDs are not guaranteed to satisfy the RFC UUID version-nibble constraint.
  for (const id of [
    '01234567-89ab-f123-9abc-0123456789ab',
    '01234567-89AB-F123-9ABC-0123456789AB',
    '550e8400-e29b-41d4-a716-446655440000',
  ]) {
    assert.equal(propertyIdSchema.safeParse(id).success, true, id);
  }
});

test('rejects malformed property IDs', () => {
  for (const id of [
    'not-a-guid',
    '01234567-89ab-f123-9abc',
    '01234567-89ab-f123-9abc-0123456789ab-extra',
    '',
  ]) {
    assert.equal(propertyIdSchema.safeParse(id).success, false, id);
  }
});

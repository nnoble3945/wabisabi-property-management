import assert from 'node:assert/strict';
import test from 'node:test';
import { isTransientSqlError, retryTransientSqlConnection } from '../src/lib/sql-resilience.mjs';

const temporary = (code = 'ETIMEOUT') => Object.assign(new Error('Transient SQL connection'), { code });

test('classifies temporary connection errors including wrapped connection failures', () => {
  for (const code of ['ETIMEOUT', 'ESOCKET', 'ECONNRESET', 'ETIMEDOUT', 'ECONNCLOSED']) {
    assert.equal(isTransientSqlError(temporary(code)), true, code);
  }
  assert.equal(isTransientSqlError({ originalError: { code: 'ETIMEDOUT' } }), true);
  assert.equal(isTransientSqlError({ cause: { number: 40613 } }), true);
  assert.equal(isTransientSqlError({ number: 40501 }), true);
});

test('never classifies firewall denial, login failures or schema errors as retryable', () => {
  for (const error of [
    { code: 'ELOGIN', message: 'Client with IP address is not allowed' },
    { code: 'ELOGIN', number: 18456 },
    { code: 'EREQUEST', number: 208 },
    new Error('Missing configuration'),
    null,
  ]) {
    assert.equal(isTransientSqlError(error), false);
  }
});

test('retries a failed connection then succeeds without sleeping during unit tests', async () => {
  let attempts = 0;
  const slept = [];
  const result = await retryTransientSqlConnection(async () => {
    attempts += 1;
    if (attempts === 1) throw temporary();
    return 'connected';
  }, { wait: async (ms) => { slept.push(ms); } });

  assert.equal(result, 'connected');
  assert.equal(attempts, 2);
  assert.deepEqual(slept, [2000]);
});

test('stops after three temporary connection failures', async () => {
  let attempts = 0;
  const slept = [];
  await assert.rejects(
    retryTransientSqlConnection(async () => {
      attempts += 1;
      throw temporary('ESOCKET');
    }, { wait: async (ms) => { slept.push(ms); } }),
    (error) => error.code === 'ESOCKET',
  );
  assert.equal(attempts, 3);
  assert.deepEqual(slept, [2000, 5000]);
});

test('fails immediately for permanent errors without retrying', async () => {
  let attempts = 0;
  await assert.rejects(
    retryTransientSqlConnection(async () => {
      attempts += 1;
      throw { code: 'ELOGIN', number: 18456 };
    }, { wait: async () => { throw new Error('must not sleep'); } }),
    (error) => error.code === 'ELOGIN',
  );
  assert.equal(attempts, 1);
});

test('successful connections never retry', async () => {
  let attempts = 0;
  const value = await retryTransientSqlConnection(async () => {
    attempts += 1;
    return 42;
  }, { wait: async () => { throw new Error('must not sleep'); } });
  assert.equal(value, 42);
  assert.equal(attempts, 1);
});

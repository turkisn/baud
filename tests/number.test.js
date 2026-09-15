import test from 'node:test';
import assert from 'node:assert/strict';
import { formatCurrency, formatCount } from '../src/utils/number.js';

test('missing and invalid prices do not appear as free products', () => {
  for (const value of [null, undefined, '', 'not a number', NaN, Infinity]) {
    assert.equal(formatCurrency(value, 'SAR', 'en-SA'), null);
  }
  assert.ok(formatCurrency(0, 'SAR', 'en-SA'));
});

test('malformed currency codes safely fall back to SAR', () => {
  for (const currency of [null, '', 'Saudi Riyal', {}, 'S']) {
    assert.equal(formatCurrency(15, currency, 'en-SA'), formatCurrency(15, 'SAR', 'en-SA'));
  }
  assert.equal(formatCurrency('15', ' sar ', 'en-SA'), formatCurrency(15, 'SAR', 'en-SA'));
});

test('invalid and negative counters safely display zero', () => {
  for (const value of [undefined, null, 'broken', -10, Infinity]) {
    assert.equal(formatCount(value, 'en-US'), '0');
  }
  assert.equal(formatCount('1200', 'en-US'), '1,200');
});

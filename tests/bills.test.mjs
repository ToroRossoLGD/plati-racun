import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialLocations, isLocations, validAmount, validDate, amountNumber } from '../bills.ts';

test('five independent locations survive storage serialization', () => {
  const data = initialLocations();
  assert.equal(data.length, 5);
  data[0].bills[0].paid = true;
  data[0].bills[0].amount = '2500,50';
  data[0].bills[0].date = '13.10.2026.';
  assert.equal(data[1].bills[0].paid, false);
  const saved = JSON.parse(JSON.stringify(data));
  assert.equal(isLocations(saved), true);
  assert.equal(saved[0].bills[0].date, '13.10.2026.');
  assert.equal(isLocations([{ id: 'broken' }]), false);
});
test('date validation handles leap years and invalid calendar dates', () => {
  for (const value of ['29.02.2024.', '13.10.2026', '1.1.2026.']) assert.equal(validDate(value), true, value);
  for (const value of ['29.02.2025.', '31.04.2026.', '00.01.2026.', '13/10/2026', 'abc']) assert.equal(validDate(value), false, value);
});
test('amounts accept Serbian decimal comma and reject invalid prices', () => {
  assert.equal(amountNumber('2500,50'), 2500.5);
  for (const value of ['', '0', '2500,50', '2500.50']) assert.equal(validAmount(value), true, value);
  for (const value of ['-10', '1e3', 'abc', '12,345', 'Infinity']) assert.equal(validAmount(value), false, value);
});

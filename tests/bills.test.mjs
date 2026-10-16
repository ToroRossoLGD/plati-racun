import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialLocations, isLocations, migrateLocations, isForwarding, billDueDay, validAmount, validDate, amountNumber } from '../bills.ts';

test('monthly deadlines apply to every apartment bill, including forwarded and added bills', () => {
  for (const location of initialLocations()) {
    for (const bill of location.bills) {
      assert.equal(billDueDay(location.id, bill.name), ['3', '4'].includes(location.id) ? null : bill.name === 'Struja' ? 28 : 15);
    }
  }
  for (const id of ['0', '1', '2']) {
    assert.equal(billDueDay(id, ' STRUJA '), 28);
    assert.equal(billDueDay(id, 'Novi račun'), 15);
  }
  assert.equal(billDueDay('unknown', 'Struja'), null);
});

test('location-specific lists and forwarding mode', () => {
  const locations = initialLocations();
  assert.deepEqual(locations.map(l => l.bills.map(b => b.name)), [
    ['Infostan', 'Struja', 'Internet', 'UNIQA'], ['Struja', 'Internet'],
    ['Struja', 'Gile', 'Upravnik', 'Yettel', 'Infostan'], ['Struja'], ['Struja', 'Komunalije'],
  ]);
  assert.deepEqual(locations.filter(isForwarding).map(l => l.name), ['Pere Velimirovića']);
});
test('migration preserves payments by name rather than positional ID', () => {
  const old = initialLocations().map(l => ({ ...l, bills: ['Struja', 'Voda', 'Internet', 'Komunalije'].map((name, i) => ({ id: `${l.id}-${i}`, name, paid: true, amount: '1500,50', date: '13.10.2026.' })) }));
  const snapshot = JSON.stringify(old);
  const next = migrateLocations(old);
  assert.equal(next[0].bills[0].name, 'Infostan');
  assert.equal(next[0].bills[0].amount, '');
  assert.equal(next[0].bills[1].name, 'Struja');
  assert.equal(next[0].bills[1].amount, '1500,50');
  assert.equal(next[0].bills[1].paid, true);
  assert.equal(next[0].bills[1].date, '13.10.2026.');
  assert.equal(next[1].bills.every(b => !b.paid && !b.amount && !b.date), true);
  assert.equal(next[4].bills[1].amount, '1500,50');
  assert.equal(JSON.stringify(old), snapshot);
  assert.equal(isLocations(next), true);
  assert.equal(new Set(next.flatMap(l => l.bills.map(b => b.id))).size, 14);
});

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

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialTaxes, taxTotal, taxDeadline, taxReminder, upcomingQuarterReminder, validTaxes } from '../taxes.ts';

test('home reminder covers each quarter from 10 days before through deadline day', () => {
  for (const [quarter, month] of [[1, 1], [2, 4], [3, 7], [4, 10]]) {
    assert.equal(upcomingQuarterReminder(new Date(2026, month, 4, 23, 59)), null);
    for (let day = 5; day <= 15; day++) {
      const reminder = upcomingQuarterReminder(new Date(2026, month, day, 23, 59));
      assert.equal(reminder.quarter, quarter);
      assert.equal(reminder.daysLeft, 15 - day);
    }
    assert.equal(upcomingQuarterReminder(new Date(2026, month, 16)), null);
  }
});
test('home reminder uses the current calendar year and updates across midnight', () => {
  assert.equal(upcomingQuarterReminder(new Date(2026, 11, 31)), null);
  assert.equal(upcomingQuarterReminder(new Date(2027, 1, 5)).deadline, '15.02.2027.');
  assert.equal(upcomingQuarterReminder(new Date(2026, 10, 14, 23, 59)).daysLeft, 1);
  assert.equal(upcomingQuarterReminder(new Date(2026, 10, 15, 0, 0)).daysLeft, 0);
});
test('tax installments have the requested counts and exact supplied deadlines', () => {
  const l = initialTaxes();
  assert.deepEqual(l.map(l => l.payments.length), [4, 4, 4, 1, 2]);
  assert.deepEqual(l[0].payments.map((_, i) => taxDeadline(l[0], i, 2026)), ['15.02.2026.', '15.05.2026.', '15.08.2026.', '15.11.2026.']);
  assert.equal(taxDeadline(l[3], 0, 2026), null);
  assert.equal(taxDeadline(l[4], 0, 2026), null);
});
test('tax totals count completed payments precisely and keep years separate', () => {
  const l = initialTaxes();
  l[0].payments[0] = { ...l[0].payments[0], amount: '100,10', date: '15.02.2026.' };
  l[0].payments[1] = { ...l[0].payments[1], amount: '200.20', date: '15.05.2026.' };
  l[3].payments[0] = { ...l[3].payments[0], amount: '500', date: '14.10.2026.' };
  l[4].payments[0].amount = '999';
  assert.equal(taxTotal([l[0]]), 300.3);
  assert.equal(taxTotal(l), 800.3);
  const records = JSON.parse(JSON.stringify({ 2026: l, 2027: initialTaxes() }));
  assert.equal(validTaxes(records), true);
  assert.equal(taxTotal(records[2027]), 0);
  records[2026][0].payments[0].date = '31.02.2026.';
  assert.equal(validTaxes(records), false);
  assert.equal(validTaxes([]), false);
});
test('deadline reminders distinguish overdue, today, upcoming and paid', () => {
  const p = initialTaxes()[0].payments[0];
  assert.equal(taxReminder('15.11.2026.', p, new Date(2026, 10, 14)), 'Rok je sutra');
  assert.equal(taxReminder('15.11.2026.', p, new Date(2026, 10, 15)), 'Rok je danas');
  assert.equal(taxReminder('15.11.2026.', p, new Date(2026, 10, 16)), 'Rok je prošao');
  assert.equal(taxReminder('15.11.2026.', { ...p, amount: '100', date: '14.11.2026.' }), 'Plaćeno');
});

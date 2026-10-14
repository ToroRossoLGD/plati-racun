import { initialLocations, amountNumber, validAmount, validDate } from './bills.ts';
export type TaxPayment = { id: string; amount: string; date: string };
export type TaxLocation = { id: string; name: string; payments: TaxPayment[] };
export type TaxRecords = Record<string, TaxLocation[]>;
export const TAX_STORAGE_KEY = 'plati-racun:taxes:v1';
export const DEADLINES = ['15.02.', '15.05.', '15.08.', '15.11.'];
export function initialTaxes(): TaxLocation[] {
  return initialLocations().map(l => ({ id: l.id, name: l.name, payments: Array.from({ length: l.id === '3' ? 1 : l.id === '4' ? 2 : 4 }, (_, i) => ({ id: `${l.id}-${i}`, amount: '', date: '' })) }));
}
export function taxTotal(locations: TaxLocation[]): number {
  return locations.flatMap(l => l.payments).reduce((sum, p) => sum + (p.amount && p.date ? Math.round(amountNumber(p.amount) * 100) : 0), 0) / 100;
}
export function taxDeadline(location: TaxLocation, index: number, year: number): string | null {
  return location.payments.length === 4 ? `${DEADLINES[index]}${year}.` : null;
}
export function taxReminder(deadline: string | null, payment: TaxPayment, now = new Date()): string {
  if (payment.amount && payment.date) return 'Plaćeno';
  if (!deadline) return 'Datum plaćanja biraš sam';
  const [day, month, year] = deadline.split('.').map(Number);
  const due = new Date(year, month - 1, day);
  const current = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((due.getTime() - current.getTime()) / 86400000);
  return days < 0 ? 'Rok je prošao' : days === 0 ? 'Rok je danas' : days === 1 ? 'Rok je sutra' : `Rok za ${days} dana`;
}
export function validTaxes(value: unknown): value is TaxRecords {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const templates = initialTaxes();
  return Object.entries(value).every(([year, locations]) => /^\d{4}$/.test(year) && Array.isArray(locations) && locations.length === 5 && templates.every(template => {
    const l = locations.find(l => l?.id === template.id);
    return l && typeof l.name === 'string' && Array.isArray(l.payments) && l.payments.length === template.payments.length && template.payments.every(expected => {
      const p = l.payments.find((p: TaxPayment) => p?.id === expected.id);
      return p && typeof p.amount === 'string' && validAmount(p.amount) && typeof p.date === 'string' && (!p.date || validDate(p.date));
    });
  }));
}

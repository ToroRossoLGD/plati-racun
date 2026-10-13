export type Bill = { id: string; name: string; paid: boolean; amount: string; date: string };
export type Location = { id: string; name: string; bills: Bill[] };
export const STORAGE_KEY = 'plati-racun:v1';
export function initialLocations(): Location[] {
  return ['Ilije Stojadinovića', 'Pere Velimirovića', '2. Srpske', 'More', 'Petrovac'].map((name, index) => ({
    id: String(index), name,
    bills: ['Struja', 'Voda', 'Internet', 'Komunalije'].map((name, i) => ({ id: `${index}-${i}`, name, paid: false, amount: '', date: '' })),
  }));
}
export function today(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}.`;
}
export function validDate(value: string): boolean {
  const match = /^(\d{1,2})\.(\d{1,2})\.(\d{4})\.?$/.exec(value.trim());
  if (!match) return false;
  const [, day, month, year] = match.map(Number);
  const d = new Date(year, month - 1, day);
  return year >= 2000 && d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}
export function amountNumber(value: string): number {
  return Number(value.replace(',', '.')) || 0;
}
export function validAmount(value: string): boolean {
  return value === '' || /^\d{1,9}([,.]\d{0,2})?$/.test(value);
}
export function isLocations(value: unknown): value is Location[] {
  if (!Array.isArray(value) || value.length !== 5) return false;
  return value.every(l => typeof l?.id === 'string' && typeof l?.name === 'string' && Array.isArray(l?.bills) && l.bills.every((b: Bill) =>
    typeof b?.id === 'string' && typeof b?.name === 'string' && typeof b?.paid === 'boolean' && typeof b?.amount === 'string' && typeof b?.date === 'string'));
}

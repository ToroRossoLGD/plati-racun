export type Bill = { id: string; name: string; paid: boolean; amount: string; date: string };
export type Location = { id: string; name: string; bills: Bill[] };
export const LEGACY_STORAGE_KEY = 'plati-racun:v1';
export const STORAGE_KEY = 'plati-racun:v2';
export const isForwarding = (location: Location) => location.id === '1';
export function billDueDay(locationId: string, billName: string): 15 | 28 | null {
  if (!['0', '1', '2'].includes(locationId)) return null;
  return billName.trim().toLowerCase() === 'struja' ? 28 : 15;
}
export function initialLocations(): Location[] {
  const names = ['Ilije Stojadinovića', 'Pere Velimirovića', '2. Srpske armije', 'More', 'Petrovac'];
  const bills = [ ['Infostan', 'Struja', 'Internet', 'UNIQA'], ['Struja', 'Internet'], ['Struja', 'Gile', 'Upravnik', 'Yettel', 'Infostan'], ['Struja'], ['Struja', 'Komunalije'] ];
  return names.map((name, index) => ({
    id: String(index), name,
    bills: bills[index].map((name, i) => ({ id: `${index}-${i}`, name, paid: false, amount: '', date: '' })),
  }));
}
// Match by name: the original positional IDs refer to different bills now.
// The v1 storage key remains untouched as a backup of all original records.
export function migrateLocations(previous: Location[]): Location[] {
  return initialLocations().map(location => ({ ...location, bills: location.bills.map(bill => {
    const old = previous.find(l => l.id === location.id)?.bills.find(b => b.name.toLowerCase() === bill.name.toLowerCase());
    return old && !isForwarding(location) ? { ...old, id: bill.id, name: bill.name } : bill;
  }) }));
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

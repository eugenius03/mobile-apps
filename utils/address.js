import { CITY } from '../api';

export const MIN_STREET_CHARS = 2;
export const MAX_ROWS = 8;

const capitalize = (upper) =>
  upper
    .toLowerCase()
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');

export function allSameGroup(houses) {
  return houses.length > 0 && houses.every((h) => h.groupId === houses[0].groupId);
}

export function filterHouses(houses, query) {
  const q = query.trim().toLowerCase();
  const lower = (h) => h.number.toLowerCase();
  const starts = (h) => (lower(h).startsWith(q) ? 0 : 1);
  const order = (a, b) => starts(a) - starts(b) || a.number.length - b.number.length || (lower(a) < lower(b) ? -1 : Number(lower(a) > lower(b)));
  return houses
    .filter((h) => !q || lower(h).includes(q))
    .sort(order)
    .slice(0, MAX_ROWS);
}

export function houseHint(houses, shown, query) {
  if (houses.length === 0) return '';
  if (query.trim() === '') return `Будинків: ${houses.length}. Введіть номер, щоб звузити.`;
  return shown.length === 0 ? 'Такого будинку на цій вулиці немає.' : '';
}

export function formatAddress({ district, street, houses, houseQuery, hit }) {
  const parts = [];
  if (district !== CITY) parts.push(district);
  parts.push(/\p{Ll}/u.test(street) ? street : capitalize(street));
  const whole = allSameGroup(houses) && houseQuery.trim() === '' && houses.length > 1 && hit === houses[0];
  if (!whole && hit.number) parts.push(hit.number);
  return parts.join(', ');
}

export function filterDistricts(districts, filter) {
  const f = (filter ?? '').trim().toLowerCase();
  return districts.filter((d) => !f || d.toLowerCase().includes(f));
}

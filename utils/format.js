import { toKyiv, ON, OFF } from './schedule';
import { colors } from '../styles/theme';

const MONTHS = ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру'];
const WEEKDAYS = ['нд', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

const pad = (n) => String(n).padStart(2, '0');

export function date(d, weekday = false) {
  return `${weekday ? `${WEEKDAYS[d.getUTCDay()]} ` : ''}${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

export function localDate(ms) {
  const d = new Date(ms);
  return date(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())));
}

export function localHm(ms) {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function hm(ms) {
  const k = toKyiv(ms);
  return `${pad(k.getUTCHours())}:${pad(k.getUTCMinutes())}`;
}

export function dur(ms) {
  const total = Math.floor(ms / 60000);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} хв`;
  return m === 0 ? `${h} год` : `${h} год ${m} хв`;
}

export function dayLabel(day) {
  return date(new Date(day), true);
}

export function availColor(a, possibleAsOn) {
  if (a === ON) return colors.on;
  if (a === OFF) return colors.off;
  return possibleAsOn ? colors.on : colors.possible;
}

export function cardColor(a, possibleAsOn) {
  const c = availColor(a, possibleAsOn);
  return c === colors.on ? colors.white : c;
}

export function availLabel(a) {
  if (a === ON) return 'Світло є';
  if (a === OFF) return 'Світла немає';
  return 'Світло можливе';
}

export function availShort(a) {
  return a === 'possible' ? 'Можливе' : availLabel(a);
}

export function availIcon(a) {
  if (a === ON) return 'zap';
  if (a === OFF) return 'zapOff';
  return 'hourglass';
}

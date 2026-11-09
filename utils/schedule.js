export const ON = 'on';
export const OFF = 'off';
export const POSSIBLE = 'possible';

const MIN = 60000;
export const HOUR = 3600000;
export const DAY = 86400000;
const SLOT = 30 * MIN;

function availabilityFromInt(v) {
  if (v === 1) return OFF;
  if (v === 2) return POSSIBLE;
  return ON;
}

function lastSundayUtc(year, month) {
  const d = new Date(Date.UTC(year, month, 31, 1));
  while (d.getUTCDay() !== 0) d.setUTCDate(d.getUTCDate() - 1);
  return d.getTime();
}

export function kyivOffset(ms) {
  const y = new Date(ms).getUTCFullYear();
  const summer = ms >= lastSundayUtc(y, 2) && ms < lastSundayUtc(y, 9);
  return (summer ? 3 : 2) * HOUR;
}

export function toKyiv(ms) {
  return new Date(ms + kyivOffset(ms));
}

export function kyivDay(ms) {
  const k = toKyiv(ms);
  return Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate());
}

export function kyivMidnightUtc(day) {
  return day - kyivOffset(day - 3 * HOUR);
}

function mergeSlots(slots) {
  const out = [];
  for (const s of slots) {
    const last = out[out.length - 1];
    if (last && last.availability === s.availability && last.end === s.start) {
      last.end = s.end;
    } else {
      out.push({ start: s.start, end: s.end, availability: s.availability });
    }
  }
  return out;
}

export function parseSchedule(raw) {
  const list = JSON.parse(raw);
  if (!Array.isArray(list)) throw new Error('Unexpected schedule format.');
  const slots = list
    .map((e) => {
      const start = Date.parse(e.dateTime);
      if (Number.isNaN(start)) throw new Error('Bad slot time.');
      return { start, end: start + SLOT, availability: availabilityFromInt(e.availability) };
    })
    .sort((a, b) => a.start - b.start);
  return {
    runs: mergeSlots(slots),
    days: [...new Set(slots.map((s) => kyivDay(s.start)))].sort((a, b) => a - b),
    isEmpty: slots.length === 0,
  };
}

function currentRunIndex(schedule, now) {
  return schedule.runs.findIndex((r) => now >= r.start && now < r.end);
}

export function currentRun(schedule, now) {
  return schedule.runs[currentRunIndex(schedule, now)] ?? null;
}

export function nextRun(schedule, now) {
  const i = currentRunIndex(schedule, now);
  return i >= 0 && i + 1 < schedule.runs.length ? schedule.runs[i + 1] : null;
}

export function runsForDay(schedule, day) {
  const startUtc = kyivMidnightUtc(day);
  const endUtc = kyivMidnightUtc(day + DAY);
  const out = [];
  for (const r of schedule.runs) {
    const start = Math.max(r.start, startUtc);
    const end = Math.min(r.end, endUtc);
    if (start < end) out.push({ start, end, availability: r.availability });
  }
  return out;
}

export function offTime(schedule, day, from = 0) {
  const floor = kyivMidnightUtc(day) + from * SLOT;
  return runsForDay(schedule, day)
    .filter((r) => r.availability === OFF)
    .reduce((sum, r) => sum + Math.max(0, r.end - Math.max(r.start, floor)), 0);
}

export function nowSlot(day, now) {
  const slot = Math.floor((now - kyivMidnightUtc(day)) / SLOT);
  return Math.min(47, Math.max(0, slot));
}

export { SLOT };

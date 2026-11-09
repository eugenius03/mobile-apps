import { ON, OFF, currentRun, nextRun, runsForDay, offTime, kyivDay, kyivMidnightUtc, nowSlot, SLOT } from './schedule';
import * as fmt from './format';
import { colors } from '../styles/theme';

export function groupName(g) {
  return g.nickname.trim() || `Група ${g.number}`;
}

export function groupSubName(g) {
  return g.nickname.trim() ? `Група ${g.number}` : '';
}

function offText(off) {
  return off === 0 ? 'без відключень' : `${fmt.dur(off)} без світла`;
}

function timelineCells(schedule, day, asOn, now, from = 0) {
  const runs = runsForDay(schedule, day);
  const start = kyivMidnightUtc(day);
  const cells = [];
  let nowIndex = -1;
  for (let i = from; i < 48; i++) {
    const t = start + i * SLOT;
    const run = runs.find((r) => t >= r.start && t < r.end);
    cells.push(run ? fmt.availColor(run.availability, asOn) : null);
    if (now >= t && now < t + SLOT) nowIndex = i - from;
  }
  return { cells, nowIndex };
}

export function dayItems(schedule, asOn, now) {
  return schedule.days.map((day) => {
    const runs = runsForDay(schedule, day)
      .filter((r) => r.availability !== ON)
      .map((r) => ({
        key: String(r.start),
        range: `${fmt.hm(r.start)} – ${fmt.hm(r.end)}`,
        length: fmt.dur(r.end - r.start),
        icon: fmt.availIcon(r.availability),
        color: fmt.availColor(r.availability, asOn),
      }));
    const label = fmt.dayLabel(day);
    return {
      key: String(day),
      title: runs.length > 0 ? `Відключення · ${label}` : `${label} · без відключень`,
      runs,
    };
  });
}

function message(g, text, loading = false) {
  return { ready: false, name: groupName(g), sub: groupSubName(g), address: g.address, message: text, loading, color: colors.white };
}

export function card(g, d, asOn, now, futureOnly = false) {
  if (!d.schedule) {
    return d.status === 'error' ? message(g, d.error ?? 'Щось пішло не так.') : message(g, 'Перевіряємо мережу…', true);
  }
  if (d.schedule.isEmpty) return message(g, 'Для цієї групи немає даних.');
  const cur = currentRun(d.schedule, now);
  if (!cur) return message(g, 'Зараз поза опублікованим графіком.');

  const next = nextRun(d.schedule, now);
  const today = kyivDay(now);
  const from = futureOnly ? nowSlot(today, now) : 0;
  let until;
  if (next) {
    until = `До ${fmt.hm(cur.end)} · лишилось ${fmt.dur(cur.end - now)}`;
  } else if (cur.availability === OFF) {
    until = 'Час увімкнення ще не опубліковано';
  } else if (cur.availability === ON) {
    until = 'Наступне відключення ще не опубліковано';
  } else {
    until = 'Наступну зміну ще не опубліковано';
  }
  const dayTitle = futureOnly
    ? `Решта дня · ${offText(offTime(d.schedule, today, from))}`
    : `${fmt.dayLabel(today)} · ${offText(offTime(d.schedule, today))}`;
  return {
    ready: true,
    name: groupName(g),
    sub: groupSubName(g),
    address: g.address,
    color: fmt.cardColor(cur.availability, asOn),
    tile: fmt.availColor(cur.availability, asOn),
    icon: fmt.availIcon(cur.availability),
    label: fmt.availLabel(cur.availability),
    until,
    next: next ? `Далі: ${fmt.availLabel(next.availability).toLowerCase()} ${fmt.hm(next.start)}–${fmt.hm(next.end)}` : '',
    timeline: timelineCells(d.schedule, today, asOn, now, from),
    axis: { startHour: from / 2, step: futureOnly ? 3 : 6 },
    dayTitle,
  };
}

export function row(g, d, asOn, now) {
  const plain = (state) => ({ name: groupName(g), sub: groupSubName(g), address: g.address, color: colors.white, icon: null, state, slot: '' });
  if (!d.schedule) return plain(d.status === 'error' ? 'Немає даних' : 'Завантаження…');
  const cur = currentRun(d.schedule, now);
  if (!cur) return plain('Зараз немає даних');
  const next = nextRun(d.schedule, now);
  return {
    name: groupName(g),
    sub: groupSubName(g),
    address: g.address,
    color: fmt.availColor(cur.availability, asOn),
    icon: fmt.availIcon(cur.availability),
    state: fmt.availShort(cur.availability),
    slot: next ? `· ${fmt.hm(cur.start)}–${fmt.hm(cur.end)}` : `· з ${fmt.hm(cur.start)}`,
  };
}

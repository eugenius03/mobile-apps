const HOST = 'https://e-svitlo-api.intercode.win';
const TIMEOUT_MS = 10000;

export const CITY = 'Чернівці';
export const BAD_RESPONSE = 'Неочікувана відповідь сервера eSvitlo.';

async function getText(path, query) {
  const url = HOST + path + (query ? `?${query}` : '');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res;
  try {
    res = await fetch(url, { signal: controller.signal });
  } catch {
    throw new Error("Немає зв'язку із сервером eSvitlo.");
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new Error(`Помилка сервера (HTTP ${res.status}).`);
  return res.text();
}

function parseArray(body) {
  let list;
  try {
    list = JSON.parse(body);
  } catch {
    throw new Error(BAD_RESPONSE);
  }
  if (!Array.isArray(list)) throw new Error(BAD_RESPONSE);
  return list;
}

function parseStrings(body) {
  return parseArray(body).filter((s) => typeof s === 'string' && s.length > 0);
}

const enc = encodeURIComponent;

function addressQuery(district, street, number) {
  const num = number === undefined ? '' : `&addressNumber=${enc(number)}`;
  return `district=${enc(district)}&addressSearch=${enc(street)}${num}&city=`;
}

export async function fetchGroups() {
  return parseArray(await getText('/shutdowns/groups'))
    .map((g) => ({ id: g.id, number: g.groupNumber }))
    .sort((a, b) => a.number - b.number);
}

export async function fetchDistricts() {
  return [CITY, ...parseStrings(await getText('/shutdowns/group-search/districts'))];
}

export async function searchStreets(district, text) {
  return parseStrings(await getText('/shutdowns/group-search', addressQuery(district, text)));
}

export async function fetchHouses(district, street) {
  const body = await getText('/shutdowns/group-search', addressQuery(district, street, ''));
  return parseArray(body).map((h) => ({
    number: h.addressNumber ?? '',
    groupNumber: h.groupNumber,
    groupId: h.groupId,
  }));
}

export function fetchScheduleRaw(group) {
  return getText('/shutdowns/schedule', `groupIds=${group.id}`);
}

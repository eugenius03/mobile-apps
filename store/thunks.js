import AsyncStorage from '@react-native-async-storage/async-storage';
import * as api from '../api';
import { parseSchedule } from '../utils/schedule';
import * as catalog from './catalogSlice';
import * as schedules from './schedulesSlice';
import { added } from './trackedSlice';
import { ticked } from './clockSlice';

const CACHE_KEY = 'schedule_cache_';
export const AUTO_REFRESH_TICKS = 15;

async function readCache(id) {
  try {
    const [raw, at] = await Promise.all([AsyncStorage.getItem(CACHE_KEY + id), AsyncStorage.getItem(`${CACHE_KEY}${id}_at`)]);
    if (!raw) return null;
    return { schedule: parseSchedule(raw), fetchedAt: Number(at) || Date.now() };
  } catch {
    return null;
  }
}

function errorText(e) {
  return e instanceof SyntaxError || e.message === 'Unexpected schedule format.' || e.message === 'Bad slot time.'
    ? api.BAD_RESPONSE
    : e.message;
}

export const loadCatalog = () => async (dispatch) => {
  dispatch(catalog.loading());
  try {
    dispatch(catalog.loaded(await api.fetchGroups()));
  } catch (e) {
    dispatch(catalog.failed(errorText(e)));
  }
};

export const refreshGroup = (id) => async (dispatch, getState) => {
  const group = getState().tracked.items.find((t) => t.id === id);
  if (!group) return;
  dispatch(schedules.loading(id));
  try {
    const raw = await api.fetchScheduleRaw(group);
    const schedule = parseSchedule(raw);
    const fetchedAt = Date.now();
    dispatch(schedules.loaded({ id, schedule, fetchedAt, stale: false, error: null }));
    AsyncStorage.multiSet([[CACHE_KEY + id, raw], [`${CACHE_KEY}${id}_at`, String(fetchedAt)]]).catch(() => {});
  } catch (e) {
    if (!getState().tracked.items.some((t) => t.id === id)) return;
    const error = errorText(e);
    const current = getState().schedules[id];
    const cached = current?.schedule ? current : await readCache(id);
    if (cached) {
      dispatch(schedules.loaded({ id, schedule: cached.schedule, fetchedAt: cached.fetchedAt, stale: true, error }));
    } else {
      dispatch(schedules.failed({ id, error }));
    }
  }
};

export const refreshAll = () => (dispatch, getState) =>
  Promise.all(getState().tracked.items.map((t) => dispatch(refreshGroup(t.id))));

export const addGroup = (group, nickname, address = '') => (dispatch, getState) => {
  const isNew = !getState().tracked.items.some((t) => t.id === group.id);
  dispatch(added({ group, nickname, address }));
  return isNew ? dispatch(refreshGroup(group.id)) : Promise.resolve();
};

export const start = () => (dispatch) => {
  let ticks = 0;
  const timer = setInterval(() => {
    ticks += 1;
    if (ticks % AUTO_REFRESH_TICKS === 0) dispatch(refreshAll());
    dispatch(ticked());
  }, 60000);
  dispatch(loadCatalog());
  dispatch(refreshAll());
  return () => clearInterval(timer);
};

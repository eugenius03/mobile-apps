import { configureStore } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import trackedReducer, { hydrate } from './trackedSlice';
import schedulesReducer from './schedulesSlice';
import catalogReducer from './catalogSlice';
import clockReducer from './clockSlice';

const STATE_KEY = 'pixelsvitlo:state';

export const store = configureStore({
  reducer: {
    tracked: trackedReducer,
    schedules: schedulesReducer,
    catalog: catalogReducer,
    clock: clockReducer,
  },
});

async function readSaved() {
  try {
    const raw = await AsyncStorage.getItem(STATE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function hydrateStore() {
  store.dispatch(hydrate(await readSaved()));
  let last = store.getState().tracked;
  store.subscribe(() => {
    const { tracked } = store.getState();
    if (tracked === last) return;
    last = tracked;
    const { items, mainId, possibleAsOn } = tracked;
    AsyncStorage.setItem(STATE_KEY, JSON.stringify({ items, mainId, possibleAsOn })).catch(() => {});
  });
}

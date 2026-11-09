import { createSlice } from '@reduxjs/toolkit';

const initialState = { items: [], mainId: null, possibleAsOn: false, hydrated: false };

const trackedSlice = createSlice({
  name: 'tracked',
  initialState,
  reducers: {
    hydrate(state, { payload }) {
      state.items = payload.items ?? [];
      state.mainId = state.items.some((t) => t.id === payload.mainId) ? payload.mainId : (state.items[0]?.id ?? null);
      state.possibleAsOn = payload.possibleAsOn === true;
      state.hydrated = true;
    },
    added(state, { payload: { group, nickname, address } }) {
      const existing = state.items.find((t) => t.id === group.id);
      if (existing) {
        if (address && !existing.address) existing.address = address;
        return;
      }
      state.items.push({ id: group.id, number: group.number, nickname: nickname.trim(), address });
      state.mainId ??= group.id;
    },
    removed(state, { payload: id }) {
      state.items = state.items.filter((t) => t.id !== id);
      if (state.mainId === id) state.mainId = state.items[0]?.id ?? null;
    },
    mainSet(state, { payload: id }) {
      if (state.items.some((t) => t.id === id)) state.mainId = id;
    },
    renamed(state, { payload: { id, nickname } }) {
      const item = state.items.find((t) => t.id === id);
      if (item) item.nickname = nickname.trim();
    },
    cleared(state) {
      state.items = [];
      state.mainId = null;
    },
    possibleAsOnSet(state, { payload }) {
      state.possibleAsOn = payload;
    },
  },
});

export const { hydrate, added, removed, mainSet, renamed, cleared, possibleAsOnSet } = trackedSlice.actions;

export const selectTracked = (s) => s.tracked.items;
export const selectMainId = (s) => s.tracked.mainId;
export const selectPossibleAsOn = (s) => s.tracked.possibleAsOn;
export const selectGroupById = (id) => (s) => s.tracked.items.find((t) => t.id === id);

export default trackedSlice.reducer;

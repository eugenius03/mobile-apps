import { createSlice } from '@reduxjs/toolkit';
import { removed, cleared } from './trackedSlice';

const blank = { schedule: null, fetchedAt: null, stale: false, status: 'loading', error: null };

const schedulesSlice = createSlice({
  name: 'schedules',
  initialState: {},
  reducers: {
    loading(state, { payload: id }) {
      state[id] = { ...(state[id] ?? blank), status: 'loading', error: null };
    },
    loaded(state, { payload: { id, schedule, fetchedAt, stale, error } }) {
      state[id] = { schedule, fetchedAt, stale, status: 'ready', error };
    },
    failed(state, { payload: { id, error } }) {
      state[id] = { ...(state[id] ?? blank), status: 'error', error };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(removed, (state, { payload }) => {
        delete state[payload];
      })
      .addCase(cleared, () => ({}));
  },
});

export const { loading, loaded, failed } = schedulesSlice.actions;

export const selectSchedule = (id) => (s) => s.schedules[id] ?? blank;

export default schedulesSlice.reducer;

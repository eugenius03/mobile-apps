import { createSlice } from '@reduxjs/toolkit';

const catalogSlice = createSlice({
  name: 'catalog',
  initialState: { groups: [], status: 'idle', error: null },
  reducers: {
    loading(state) {
      state.status = 'loading';
    },
    loaded(state, { payload }) {
      state.groups = payload;
      state.status = 'ready';
    },
    failed(state, { payload }) {
      state.status = 'error';
      state.error = payload;
    },
  },
});

export const { loading, loaded, failed } = catalogSlice.actions;

export default catalogSlice.reducer;

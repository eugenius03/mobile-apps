import { createSlice } from '@reduxjs/toolkit';

const clockSlice = createSlice({
  name: 'clock',
  initialState: { now: Date.now() },
  reducers: {
    ticked(state) {
      state.now = Date.now();
    },
  },
});

export const { ticked } = clockSlice.actions;

export default clockSlice.reducer;

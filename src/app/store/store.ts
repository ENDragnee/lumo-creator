import { configureStore } from '@reduxjs/toolkit';
import editorReducer from './slices/editorSlice';
import mediaReducer from './slices/mediaSlice';

export const store = configureStore({
  reducer: {
    editor: editorReducer,
    media: mediaReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

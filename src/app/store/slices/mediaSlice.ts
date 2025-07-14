// @/app/store/slices/mediaSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
// **THE FIX**: Import the plain data interface, not the Mongoose Document interface.
import { IMediaData } from '@/models/Media';

interface MediaState {
  // **THE FIX**: Use the serializable type for the state.
  items: IMediaData[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: MediaState = {
  items: [],
  status: 'idle',
  error: null,
};

// Async thunk for fetching media
export const fetchMedia = createAsyncThunk('media/fetchMedia', async (_, { rejectWithValue }) => {
  try {
    const response = await fetch('/api/media');
    if (!response.ok) {
      throw new Error('Server responded with an error!');
    }
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch media.');
    }
    // **THE FIX**: The API returns plain JSON data, which matches IMediaData[].
    return data.data as IMediaData[];
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

const mediaSlice = createSlice({
  name: 'media',
  initialState,
  reducers: {
    // **THE FIX**: The payload action should be typed with the serializable interface.
    addMediaItem: (state, action: PayloadAction<IMediaData>) => {
      // This works now because action.payload is a plain object.
      state.items.unshift(action.payload);
    },
    removeMediaItem: (state, action: PayloadAction<string>) => { // action.payload is the mediaId
      state.items = state.items.filter(item => item._id !== action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMedia.pending, (state) => {
        state.status = 'loading';
      })
      // **THE FIX**: The fulfilled action payload is an array of plain objects.
      .addCase(fetchMedia.fulfilled, (state, action: PayloadAction<IMediaData[]>) => {
        state.status = 'succeeded';
        // This is now safe because action.payload is serializable.
        state.items = action.payload;
      })
      .addCase(fetchMedia.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export const { addMediaItem, removeMediaItem } = mediaSlice.actions;
export default mediaSlice.reducer;

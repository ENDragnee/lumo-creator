import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { IMedia } from '@/models/Media'; // Assuming this is your media type from the model

interface MediaState {
  items: IMedia[];
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
    return data.data as IMedia[];
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

const mediaSlice = createSlice({
  name: 'media',
  initialState,
  reducers: {
    addMediaItem: (state, action: PayloadAction<IMedia>) => {
        state.items.unshift(action.payload); // Add to the beginning of the list
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
      .addCase(fetchMedia.fulfilled, (state, action: PayloadAction<IMedia[]>) => {
        state.status = 'succeeded';
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

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/api';

const ENDPOINT = '/amenities';

export const fetchAmenities = createAsyncThunk('amenities/fetch', async () => {
  const res = await api.get(ENDPOINT);
  return res.data.data;
});

export const addAmenity = createAsyncThunk('amenities/add', async (data) => {
  const res = await api.post(ENDPOINT, data);
  return res.data.data;
});

export const updateAmenity = createAsyncThunk('amenities/update', async ({ id, data }) => {
  const res = await api.put(`${ENDPOINT}/${id}`, data);
  return res.data.data;
});

export const removeAmenity = createAsyncThunk('amenities/delete', async (id) => {
  await api.delete(`${ENDPOINT}/${id}`);
  return id;
});

export const lockAmenity = createAsyncThunk(
  'amenities/lock',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.patch(`${ENDPOINT}/${id}/lock`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Khóa tiện nghi thất bại',
      );
    }
  },
);

export const unlockAmenity = createAsyncThunk(
  'amenities/unlock',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.patch(`${ENDPOINT}/${id}/unlock`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Mở khóa tiện nghi thất bại',
      );
    }
  },
);

export const fetchAmenityProposals = createAsyncThunk(
  'amenities/fetchAmenityProposals',
  async () => {
    const res = await api.get('/admin/notifications', { params: { loai: 'tien_nghi' } });
    const items = res.data.data?.items || [];
    return items.filter((n) => String(n.tieu_de || '').startsWith('Đề xuất tiện nghi'));
  },
);

const amenitySlice = createSlice({
  name: 'amenities',
  initialState: {
    list: [],
    proposals: [],
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAmenities.pending, (state) => { state.loading = true; })
      .addCase(fetchAmenities.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(addAmenity.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      .addCase(updateAmenity.fulfilled, (state, action) => {
        const i = state.list.findIndex((x) => x.ma_tien_nghi === action.payload.ma_tien_nghi);
        if (i !== -1) state.list[i] = action.payload;
      })
      .addCase(removeAmenity.fulfilled, (state, action) => {
        state.list = state.list.filter((x) => x.ma_tien_nghi !== action.payload);
      })
      .addCase(lockAmenity.fulfilled, (state, action) => {
        const i = state.list.findIndex((x) => x.ma_tien_nghi === action.payload?.ma_tien_nghi);
        if (i !== -1 && action.payload) state.list[i] = action.payload;
      })
      .addCase(unlockAmenity.fulfilled, (state, action) => {
        const i = state.list.findIndex((x) => x.ma_tien_nghi === action.payload?.ma_tien_nghi);
        if (i !== -1 && action.payload) state.list[i] = action.payload;
      })
      .addCase(fetchAmenityProposals.fulfilled, (state, action) => {
        state.proposals = action.payload || [];
      })
      .addCase(fetchAmenityProposals.rejected, (state) => {
        state.proposals = [];
      });
  },
});

export default amenitySlice.reducer;

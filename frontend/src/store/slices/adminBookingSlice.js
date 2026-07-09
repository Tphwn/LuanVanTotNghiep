import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const BASE = '/admin/bookings';

export const fetchAdminBookings = createAsyncThunk(
  'adminBooking/fetchAll',
  async (filters = {}) => {
    const params = new URLSearchParams(
      Object.fromEntries(Object.entries(filters).filter(([, v]) => v && v !== 'all'))
    ).toString();
    const res = await api.get(`${BASE}?${params}`);
    return res.data.data;
  }
);

export const fetchAdminBookingDetail = createAsyncThunk(
  'adminBooking/fetchOne',
  async (id) => {
    const res = await api.get(`${BASE}/${id}`);
    return res.data.data;
  }
);

export const cancelAdminBooking = createAsyncThunk(
  'adminBooking/cancel',
  async ({ id, ly_do }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`${BASE}/${id}/cancel`, { ly_do });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Lỗi hủy đơn');
    }
  }
);

export const fetchBookingStats = createAsyncThunk(
  'adminBooking/stats',
  async () => {
    const res = await api.get(`${BASE}/stats`);
    return res.data.data;
  }
);

export const fetchHotelsForFilter = createAsyncThunk(
  'adminBooking/hotels',
  async () => {
    const res = await api.get(`${BASE}/hotels`);
    return res.data.data;
  }
);

export const fetchPartnersForFilter = createAsyncThunk(
  'adminBooking/partners',
  async () => {
    const res = await api.get(`${BASE}/partners`);
    return res.data.data;
  }
);

const adminBookingSlice = createSlice({
  name: 'adminBooking',
  initialState: {
    list: [],
    detail: null,
    stats: null,
    hotels: [],
    partners: [],
    loading: false,
    detailLoading: false,
    error: null,
    successMsg: null,
  },
  reducers: {
    clearMsg:    (state) => { state.error = null; state.successMsg = null; },
    clearDetail: (state) => { state.detail = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminBookings.pending,   (state) => { state.loading = true; })
      .addCase(fetchAdminBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchAdminBookings.rejected,  (state) => { state.loading = false; })

      .addCase(fetchAdminBookingDetail.pending,   (state) => { state.detailLoading = true; })
      .addCase(fetchAdminBookingDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.detail = action.payload;
      })
      .addCase(fetchAdminBookingDetail.rejected, (state) => {
        state.detailLoading = false;
        state.detail = null;
      })

      .addCase(fetchBookingStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })

      .addCase(fetchHotelsForFilter.fulfilled, (state, action) => {
        state.hotels = action.payload;
      })

      .addCase(fetchPartnersForFilter.fulfilled, (state, action) => {
        state.partners = action.payload;
      })

      .addCase(cancelAdminBooking.fulfilled, (state, action) => {
        state.successMsg = 'Đã hủy đơn đặt phòng!';
        const i = state.list.findIndex((x) => x.ma_dat_phong === action.payload.ma_dat_phong);
        if (i !== -1) state.list[i] = action.payload;
        if (state.detail?.ma_dat_phong === action.payload.ma_dat_phong) {
          state.detail = action.payload;
        }
      })
      .addCase(cancelAdminBooking.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearMsg, clearDetail } = adminBookingSlice.actions;
export default adminBookingSlice.reducer;
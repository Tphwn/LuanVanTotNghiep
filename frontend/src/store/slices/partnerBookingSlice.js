import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const BASE = '/partner/bookings';

export const fetchPartnerBookings = createAsyncThunk(
  'partnerBooking/fetchAll',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const res = await api.get(`${BASE}?${params}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Lỗi lấy danh sách booking'
      );
    }
  }
);

export const fetchBookingDetail = createAsyncThunk(
  'partnerBooking/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`${BASE}/${id}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Lỗi lấy chi tiết booking'
      );
    }
  }
);

export const confirmBooking = createAsyncThunk(
  'partnerBooking/confirm',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.patch(`${BASE}/${id}/confirm`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Lỗi xác nhận booking'
      );
    }
  }
);

export const rejectBooking = createAsyncThunk(
  'partnerBooking/reject',
  async ({ id, ly_do }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`${BASE}/${id}/reject`, { ly_do });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Lỗi từ chối booking'
      );
    }
  }
);

const partnerBookingSlice = createSlice({
  name: 'partnerBooking',
  initialState: {
    list: [],
    detail: null,
    loading: false,
    detailLoading: false,
    error: null,
    successMsg: null,
  },

  reducers: {
    clearMsg: (state) => {
      state.error = null;
      state.successMsg = null;
    },

    clearDetail: (state) => {
      state.detail = null;
    },
  },

  extraReducers: (builder) => {
    builder

      .addCase(fetchPartnerBookings.pending, (state) => {
        state.loading = true;
      })

      .addCase(fetchPartnerBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })

      .addCase(fetchPartnerBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchBookingDetail.pending, (state) => {
        state.detailLoading = true;
      })

      .addCase(fetchBookingDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.detail = action.payload;
      })

      .addCase(fetchBookingDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.detail = null;
        state.error = action.payload;
      })

      .addCase(confirmBooking.fulfilled, (state, action) => {
        state.successMsg = 'Đã xác nhận booking';

        const index = state.list.findIndex(
          item => item.ma_dat_phong === action.payload.ma_dat_phong
        );

        if (index !== -1) {
          state.list[index] = action.payload;
        }
      })

      .addCase(rejectBooking.fulfilled, (state, action) => {
        state.successMsg = 'Đã từ chối booking';

        const index = state.list.findIndex(
          item => item.ma_dat_phong === action.payload.ma_dat_phong
        );

        if (index !== -1) {
          state.list[index] = action.payload;
        }
      });
  },
});

export const { clearMsg, clearDetail } = partnerBookingSlice.actions;

export default partnerBookingSlice.reducer;
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const BASE = '/partner/hotels';

// Lấy ds KS của mình
export const fetchMyHotels = createAsyncThunk('partnerHotel/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get(BASE);
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    } else {
      return rejectWithValue(res.data?.message || 'Lấy danh sách thất bại');
    }
  } catch (err) {
    console.error('fetchMyHotels error:', err);
    return rejectWithValue(err.response?.data?.message || err.message || 'Lỗi lấy danh sách khách sạn');
  }
});

// Lấy chi tiết
export const fetchHotelById = createAsyncThunk('partnerHotel/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const res = await api.get(`${BASE}/${id}`);
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    } else {
      return rejectWithValue(res.data?.message || 'Lấy chi tiết thất bại');
    }
  } catch (err) {
    console.error('fetchHotelById error:', err);
    return rejectWithValue(err.response?.data?.message || err.message || 'Lỗi lấy chi tiết khách sạn');
  }
});

// Tạo mới
export const createHotel = createAsyncThunk('partnerHotel/create', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post(BASE, data);
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    } else {
      return rejectWithValue(res.data?.message || 'Tạo khách sạn thất bại');
    }
  } catch (err) {
    console.error('createHotel error:', err);
    return rejectWithValue(err.response?.data?.message || err.message || 'Lỗi tạo khách sạn');
  }
});

// Cập nhật
export const updateHotel = createAsyncThunk('partnerHotel/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.put(`${BASE}/${id}`, data);
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    } else {
      return rejectWithValue(res.data?.message || 'Cập nhật thất bại');
    }
  } catch (err) {
    console.error('updateHotel error:', err);
    return rejectWithValue(err.response?.data?.message || err.message || 'Lỗi cập nhật');
  }
});

// Lấy địa điểm
export const fetchDiaDiem = createAsyncThunk('partnerHotel/diaDiem', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get(`${BASE}/dia-diem`);
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    } else {
      return rejectWithValue(res.data?.message || 'Lấy địa điểm thất bại');
    }
  } catch (err) {
    console.error('fetchDiaDiem error:', err);
    return rejectWithValue(err.response?.data?.message || err.message || 'Lỗi lấy địa điểm');
  }
});

// Lấy tiện nghi KS
export const fetchAmenitiesForHotel = createAsyncThunk('partnerHotel/amenities', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get(`${BASE}/amenities`);
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    } else {
      return rejectWithValue(res.data?.message || 'Lấy tiện nghi thất bại');
    }
  } catch (err) {
    console.error('fetchAmenitiesForHotel error:', err);
    return rejectWithValue(err.response?.data?.message || err.message || 'Lỗi lấy tiện nghi');
  }
});

const partnerHotelSlice = createSlice({
  name: 'partnerHotel',
  initialState: {
    list: [],
    detail: null,
    diaDiem: [],
    amenities: [],
    loading: false,
    error: null,
    successMsg: null,
  },
  reducers: {
    clearMsg: (state) => {
      state.error = null;
      state.successMsg = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyHotels.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(fetchMyHotels.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchMyHotels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchHotelById.fulfilled, (state, action) => {
        state.detail = action.payload;
      })
      .addCase(fetchDiaDiem.pending, (state) => { state.error = null; })
      .addCase(fetchDiaDiem.fulfilled, (state, action) => {
        state.diaDiem = action.payload;
      })
      .addCase(fetchDiaDiem.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(fetchAmenitiesForHotel.pending, (state) => { state.error = null; })
      .addCase(fetchAmenitiesForHotel.fulfilled, (state, action) => {
        state.amenities = action.payload;
      })
      .addCase(fetchAmenitiesForHotel.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(createHotel.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(createHotel.fulfilled, (state, action) => {
        state.loading = false;
        state.list.unshift(action.payload);
        state.successMsg = 'Tạo khách sạn thành công! Chờ admin duyệt.';
      })
      .addCase(createHotel.rejected,  (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateHotel.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(updateHotel.fulfilled, (state, action) => {
        state.loading = false;
        const i = state.list.findIndex(x => x.ma_khach_san === action.payload.ma_khach_san);
        if (i !== -1) state.list[i] = action.payload;
        state.successMsg = 'Cập nhật thành công!';
      })
      .addCase(updateHotel.rejected,  (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearMsg } = partnerHotelSlice.actions;
export default partnerHotelSlice.reducer;
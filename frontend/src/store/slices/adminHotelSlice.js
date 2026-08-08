import { createSlice, createAsyncThunk } from'@reduxjs/toolkit';
import adminHotelService from'../../services/adminHotelService';

export const fetchHotels = createAsyncThunk('adminHotels/fetchHotels', async (_, thunkAPI) => {
  try {
    const response = await adminHotelService.getHotels();
    return response.data.data || response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message ||'Lỗi tải dữ liệu');
  }
});

export const approveHotel = createAsyncThunk('adminHotels/approve', async (id, thunkAPI) => {
  try {
    await adminHotelService.approve(id);
    return id;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message);
  }
});

export const rejectHotel = createAsyncThunk('adminHotels/reject', async ({ id, lyDo }, thunkAPI) => {
  try {
    await adminHotelService.reject(id, lyDo);
    return { id, trang_thai:'tu_choi'};
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message);
  }
});

export const lockHotel = createAsyncThunk('adminHotels/lock', async ({ id, lyDoKhoa }, thunkAPI) => {
  try {
    await adminHotelService.lock(id, lyDoKhoa);
    return { id, trang_thai:'bi_khoa'};
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message);
  }
});

export const unlockHotel = createAsyncThunk('adminHotels/unlock', async (id, thunkAPI) => {
  try {
    await adminHotelService.unlock(id);
    return { id, trang_thai:'hoat_dong'};
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message);
  }
});

const matchHotelId = (a, b) => Number(a) === Number(b);

const adminHotelSlice = createSlice({
  name:'adminHotels',
  initialState: {
    hotels: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHotels.pending, (state) => { state.loading = true; })
      .addCase(fetchHotels.fulfilled, (state, action) => {
        state.loading = false;
        state.hotels = action.payload;
      })
      .addCase(fetchHotels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(approveHotel.fulfilled, (state, action) => {
        const hotel = state.hotels.find((h) => matchHotelId(h.ma_khach_san, action.payload));
        if (hotel) hotel.trang_thai = 'hoat_dong';
      })
      .addCase(rejectHotel.fulfilled, (state, action) => {
        const hotel = state.hotels.find((h) => matchHotelId(h.ma_khach_san, action.payload.id));
        if (hotel) hotel.trang_thai = action.payload.trang_thai;
      })
      .addCase(lockHotel.fulfilled, (state, action) => {
        const hotel = state.hotels.find((h) => matchHotelId(h.ma_khach_san, action.payload.id));
        if (hotel) hotel.trang_thai = action.payload.trang_thai;
      })
      .addCase(unlockHotel.fulfilled, (state, action) => {
        const hotel = state.hotels.find((h) => matchHotelId(h.ma_khach_san, action.payload.id));
        if (hotel) hotel.trang_thai = action.payload.trang_thai;
      });
  },
});

export default adminHotelSlice.reducer;

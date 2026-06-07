import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Thay đổi URL này cho khớp với Backend port 5000 của bạn
const API_URL = 'http://localhost:5000/api/admin/hotels';

// Hàm hỗ trợ lấy Token để gọi API Admin
const getAuthHeader = () => {
  const token = localStorage.getItem('token'); // Đảm bảo key này khớp với lúc bạn lưu khi đăng nhập
  return {
    headers: { Authorization: `Bearer ${token}` }
  };
};

// 1. Lấy danh sách khách sạn
export const fetchHotels = createAsyncThunk('adminHotels/fetchHotels', async (_, thunkAPI) => {
  try {
    const response = await axios.get(API_URL, getAuthHeader());
    return response.data.data || response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Lỗi tải dữ liệu');
  }
});

// 2. Duyệt khách sạn
export const approveHotel = createAsyncThunk('adminHotels/approve', async (id, thunkAPI) => {
  try {
    await axios.patch(`${API_URL}/${id}/approve`, {}, getAuthHeader());
    return id;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message);
  }
});

// 3. Từ chối khách sạn (Kèm lý do)
export const rejectHotel = createAsyncThunk('adminHotels/reject', async ({ id, lyDo }, thunkAPI) => {
  try {
    await axios.patch(`${API_URL}/${id}/reject`, { lyDo }, getAuthHeader());
    return { id, trang_thai: 'tu_choi' };
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message);
  }
});

// 4. Yêu cầu bổ sung thông tin
export const requestInfoHotel = createAsyncThunk('adminHotels/requestInfo', async ({ id, ghiChu }, thunkAPI) => {
  try {
    await axios.patch(`${API_URL}/${id}/request-info`, { ghiChu }, getAuthHeader());
    return { id, trang_thai: 'yeu_cau_sua' };
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message);
  }
});

// 5. Khóa khách sạn
export const lockHotel = createAsyncThunk('adminHotels/lock', async (id, thunkAPI) => {
  try {
    await axios.patch(`${API_URL}/${id}/lock`, {}, getAuthHeader());
    return { id, trang_thai: 'bi_khoa' };
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message);
  }
});

// 6. Mở khóa khách sạn
export const unlockHotel = createAsyncThunk('adminHotels/unlock', async (id, thunkAPI) => {
  try {
    await axios.patch(`${API_URL}/${id}/unlock`, {}, getAuthHeader());
    return { id, trang_thai: 'hoat_dong' };
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message);
  }
});

const adminHotelSlice = createSlice({
  name: 'adminHotels',
  initialState: {
    hotels: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Xử lý khi Lấy danh sách
      .addCase(fetchHotels.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchHotels.fulfilled, (state, action) => {
        state.loading = false;
        state.hotels = action.payload;
      })
      .addCase(fetchHotels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Xử lý khi Duyệt thành công (Tự động cập nhật giao diện mà không cần reload trang)
      .addCase(approveHotel.fulfilled, (state, action) => {
        const hotel = state.hotels.find((h) => h.ma_khach_san === action.payload);
        if (hotel) hotel.trang_thai = 'hoat_dong';
      })
      // Xử lý khi Từ chối thành công
      .addCase(rejectHotel.fulfilled, (state, action) => {
        const hotel = state.hotels.find((h) => h.ma_khach_san === action.payload.id);
        if (hotel) hotel.trang_thai = action.payload.trang_thai;
      })
      // Xử lý khi Yêu cầu bổ sung thành công
      .addCase(requestInfoHotel.fulfilled, (state, action) => {
        const hotel = state.hotels.find((h) => h.ma_khach_san === action.payload.id);
        if (hotel) hotel.trang_thai = action.payload.trang_thai;
      })
      // Xử lý khi Khóa thành công
      .addCase(lockHotel.fulfilled, (state, action) => {
        const hotel = state.hotels.find((h) => h.ma_khach_san === action.payload.id);
        if (hotel) hotel.trang_thai = action.payload.trang_thai;
      })
      // Xử lý khi Mở khóa thành công
      .addCase(unlockHotel.fulfilled, (state, action) => {
        const hotel = state.hotels.find((h) => h.ma_khach_san === action.payload.id);
        if (hotel) hotel.trang_thai = action.payload.trang_thai;
      });
  },
});

export default adminHotelSlice.reducer;
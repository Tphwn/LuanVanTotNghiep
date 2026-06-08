import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const BASE = '/partner/rooms'; // Đảm bảo backend đã có route này

// Lấy ds Loại phòng của khách sạn cụ thể
export const fetchRooms = createAsyncThunk('partnerRooms/fetchAll', async (ma_ks, { rejectWithValue }) => {
  try {
    const res = await api.get(`${BASE}?ma_ks=${ma_ks}`);
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    } else {
      return rejectWithValue(res.data?.message || 'Lấy danh sách phòng thất bại');
    }
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Lỗi lấy danh sách phòng');
  }
});

// Tạo mới loại phòng
export const createRoom = createAsyncThunk('partnerRooms/create', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post(BASE, data);
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    } else {
      return rejectWithValue(res.data?.message || 'Tạo loại phòng thất bại');
    }
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Lỗi tạo loại phòng');
  }
});

// Cập nhật loại phòng
export const updateRoom = createAsyncThunk('partnerRooms/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.put(`${BASE}/${id}`, data);
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    } else {
      return rejectWithValue(res.data?.message || 'Cập nhật thất bại');
    }
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Lỗi cập nhật loại phòng');
  }
});

// Ẩn loại phòng (Soft Delete)
export const deleteRoom = createAsyncThunk('partnerRooms/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`${BASE}/${id}`);
    return id; // Trả về ID để filter ra khỏi danh sách
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Lỗi ẩn loại phòng');
  }
});

const partnerRoomSlice = createSlice({
  name: 'partnerRooms',
  initialState: {
    list: [],
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
      // Fetch Rooms
      .addCase(fetchRooms.pending, (state) => { state.loading = true; state.error = null; })
     .addCase(fetchRooms.fulfilled, (state, action) => {
        console.log("FETCH SUCCESS:", action.payload);

        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Room
      .addCase(createRoom.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createRoom.fulfilled, (state, action) => {
        state.loading = false;
        state.list.push(action.payload);
        state.successMsg = 'Thêm loại phòng thành công!';
      })
      .addCase(createRoom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Room
      .addCase(updateRoom.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateRoom.fulfilled, (state, action) => {
        state.loading = false;
        const i = state.list.findIndex(x => x.ma_loai_phong === action.payload.ma_loai_phong);
        if (i !== -1) state.list[i] = action.payload;
        state.successMsg = 'Cập nhật thành công!';
      })
      .addCase(updateRoom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete (Ẩn) Room
      .addCase(deleteRoom.fulfilled, (state, action) => {
        state.list = state.list.filter(x => x.ma_loai_phong !== action.payload);
        state.successMsg = 'Đã ẩn loại phòng!';
      });
  },
});

export const { clearMsg } = partnerRoomSlice.actions;
export default partnerRoomSlice.reducer;
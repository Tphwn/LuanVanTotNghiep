import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const BASE = '/partner/rooms';

const buildRoomFormData = (data, { includeImages = true } = {}) => {
  const formData = new FormData();
  
  // Nạp thông tin cơ bản
  ['ten_loai', 'dien_tich', 'suc_chua', 'so_luong_phong', 'gia_co_ban', 'so_giuong', 'mo_ta', 'ma_khach_san'].forEach((key) => {
    if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
      formData.append(key, data[key]);
    }
  });

  if (data.tien_nghi_ids) formData.append('tien_nghi_ids', JSON.stringify(data.tien_nghi_ids));
  if (data.removedImageIds?.length) formData.append('removedImageIds', JSON.stringify(data.removedImageIds));

  // Xử lý nạp File ảnh
  if (includeImages && data.hinh_anh?.length) {
    const newImages = data.hinh_anh.filter((img) => img.file instanceof File);
    let mainNewIndex = -1;

    newImages.forEach((img, idx) => {
      formData.append('images', img.file);
      if (img.la_anh_chinh === 1 || img.la_anh_chinh === true) mainNewIndex = idx;
    });

    const mainExisting = data.hinh_anh.find(
      (img) => !img.file && (img.la_anh_chinh === 1 || img.la_anh_chinh === true)
    );
    if (mainExisting?.ma_hinh_anh) formData.append('mainImageId', mainExisting.ma_hinh_anh);
    if (mainNewIndex >= 0) formData.append('mainNewIndex', mainNewIndex);
  }

  return formData;
};

// Gọi API
export const fetchMyRooms = createAsyncThunk('partnerRoom/fetchAll', async (hotelId, { rejectWithValue }) => {
  try {
    const url = hotelId ? `${BASE}?hotelId=${hotelId}` : BASE;
    const res = await api.get(url);
    if (res.data?.success && res.data?.data) return res.data.data;
    return rejectWithValue('Lấy danh sách loại phòng thất bại');
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Lỗi hệ thống khi lấy loại phòng');
  }
});

export const fetchAmenitiesForRoom = createAsyncThunk('partnerRoom/amenities', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get(`${BASE}/amenities`);
    if (res.data?.success && res.data?.data) return res.data.data;
    return rejectWithValue('Lấy tiện nghi thất bại');
 } catch (err) { return rejectWithValue(err.response?.data?.message || 'Lỗi hệ thống khi lấy tiện nghi'); }
});

export const createRoomType = createAsyncThunk('partnerRoom/create', async (data, { rejectWithValue }) => {
  try {
    const newImages = (data.hinh_anh || []).filter((img) => img.file instanceof File);
    if (newImages.length === 0) return rejectWithValue('Vui lòng tải lên ít nhất 1 hình ảnh');

    const formData = buildRoomFormData(data);
    let mainIndex = 0;
    newImages.forEach((img, index) => { if (img.la_anh_chinh) mainIndex = index; });
    formData.append('mainImageIndex', mainIndex);

    const response = await api.post(BASE, formData);
    if (response.data?.success && response.data?.data) return response.data.data;
    return rejectWithValue(response.data?.message || 'Lỗi thêm loại phòng');
  } catch (error) { return rejectWithValue(error.response?.data?.message || 'Lỗi hệ thống'); }
});

export const updateRoomType = createAsyncThunk('partnerRoom/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const isStatusOnly = data.trang_thai && Object.keys(data).length === 1;
    if (isStatusOnly) {
      const res = await api.put(`${BASE}/${id}`, data);
      if (res.data?.success && res.data?.data) return res.data.data;
      return rejectWithValue(res.data?.message || 'Cập nhật thất bại');
    }

    const formData = buildRoomFormData(data);
    const res = await api.put(`${BASE}/${id}`, formData);
    if (res.data?.success && res.data?.data) return res.data.data;
    return rejectWithValue(res.data?.message || 'Cập nhật thất bại');
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Lỗi hệ thống'); }
});

const partnerRoomSlice = createSlice({
  name: 'partnerRoom',
  initialState: {
    list: [],
    amenities: [],
    loading: false,
    error: null,
    successMsg: null,
  },
  reducers: {
    clearRoomMsg: (state) => { state.error = null; state.successMsg = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyRooms.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchMyRooms.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchMyRooms.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      
      .addCase(fetchAmenitiesForRoom.fulfilled, (state, action) => { state.amenities = action.payload; })
      
      .addCase(createRoomType.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createRoomType.fulfilled, (state, action) => {
        state.loading = false;
        state.list.unshift(action.payload);
        state.successMsg = 'Tạo loại phòng thành công!';
      })
      .addCase(createRoomType.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      
      .addCase(updateRoomType.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateRoomType.fulfilled, (state, action) => {
        state.loading = false;
        const i = state.list.findIndex((x) => x.ma_loai_phong === action.payload.ma_loai_phong);
        if (i !== -1) state.list[i] = action.payload;
        state.successMsg = 'Cập nhật phòng thành công!';
      })
      .addCase(updateRoomType.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { clearRoomMsg } = partnerRoomSlice.actions;
export default partnerRoomSlice.reducer;
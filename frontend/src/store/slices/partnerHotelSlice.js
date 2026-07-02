import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const BASE = '/partner/hotels';

export const DEFAULT_CANCEL_POLICIES = [
  { so_ngay_truoc: 7, phan_tram_hoan: 100 },
  { so_ngay_truoc: 3, phan_tram_hoan: 50 },
  { so_ngay_truoc: 1, phan_tram_hoan: 0 },
];

const buildHotelFormData = (data) => {
  const formData = new FormData();

  ['ten', 'dia_chi', 'mo_ta', 'so_sao', 'gio_nhan_phong', 'gio_tra_phong', 'ma_dia_diem'].forEach((key) => {
    if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
      formData.append(key, data[key]);
    }
  });

  if (data.tien_nghi_ids !== undefined) {
    formData.append('tien_nghi_ids', JSON.stringify(data.tien_nghi_ids));
  }
  if (data.chinh_sach_huy) {
    formData.append('chinh_sach_huy', JSON.stringify(data.chinh_sach_huy));
  }

  if (data.giay_to_bat_buoc !== undefined) {
    formData.append('giay_to_bat_buoc', JSON.stringify(data.giay_to_bat_buoc || []));
  }
  ['cho_phep_hut_thuoc', 'cho_phep_to_chuc_tiec', 'cho_phep_thu_cung'].forEach((key) => {
    if (data[key] !== undefined) {
      formData.append(key, data[key] ? 'true' : 'false');
    }
  });
  ['phu_thu_thu_cung', 'tuoi_toi_da_mien_phi', 'phu_thu_tre_em'].forEach((key) => {
    if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
      formData.append(key, data[key]);
    }
  });
  ['hoan_khi_benh', 'hoan_cong_viec_dot_xuat', 'yeu_cau_minh_chung_huy'].forEach((key) => {
    if (data[key] !== undefined) {
      formData.append(key, data[key] ? 'true' : 'false');
    }
  });
  if (data.mo_ta_chinh_sach_huy !== undefined && data.mo_ta_chinh_sach_huy !== null) {
    formData.append('mo_ta_chinh_sach_huy', data.mo_ta_chinh_sach_huy);
  }

  if (data.removedImageIds?.length) {
    formData.append('removedImageIds', JSON.stringify(data.removedImageIds));
  }

  const newImages = (data.hinh_anh || []).filter((img) => img.file instanceof File);
  let mainNewIndex = -1;

  newImages.forEach((img, idx) => {
    formData.append('images', img.file);
    if (img.la_anh_chinh === 1 || img.la_anh_chinh === true) {
      mainNewIndex = idx;
    }
  });

  const mainExisting = (data.hinh_anh || []).find(
    (img) => !img.file && (img.la_anh_chinh === 1 || img.la_anh_chinh === true)
  );
  if (mainExisting?.ma_hinh_anh) {
    formData.append('mainImageId', mainExisting.ma_hinh_anh);
  }
  if (mainNewIndex >= 0) {
    formData.append('mainNewIndex', mainNewIndex);
  }

  return { formData, newImages, mainNewIndex };
};

export const fetchMyHotels = createAsyncThunk('partnerHotel/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get(BASE);
    if (res.data?.success && res.data?.data) {
      return {
        list: res.data.data,
        defaultCancelPolicies: res.data.defaultCancelPolicies || DEFAULT_CANCEL_POLICIES,
      };
    }
    return rejectWithValue(res.data?.message || 'Lấy danh sách thất bại');
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Lỗi lấy danh sách khách sạn');
  }
});

export const fetchHotelById = createAsyncThunk('partnerHotel/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const res = await api.get(`${BASE}/${id}`);
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
    return rejectWithValue(res.data?.message || 'Lấy chi tiết thất bại');
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Lỗi lấy chi tiết khách sạn');
  }
});

export const createHotel = createAsyncThunk(
  'partnerHotel/create',
  async (data, { rejectWithValue }) => {
    try {
      const { formData, newImages, mainNewIndex } = buildHotelFormData(data);
      if (newImages.length === 0) {
        return rejectWithValue('Vui lòng tải lên ít nhất 1 hình ảnh');
      }
      formData.append('mainImageIndex', mainNewIndex >= 0 ? mainNewIndex : 0);

      const response = await api.post(BASE, formData);
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      return rejectWithValue(response.data?.message || 'Lỗi thêm khách sạn');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi thêm khách sạn');
    }
  }
);

export const updateHotel = createAsyncThunk('partnerHotel/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const isStatusOnly = data.trang_thai && Object.keys(data).length === 1;

    if (isStatusOnly) {
      const res = await api.put(`${BASE}/${id}`, data);
      if (res.data?.success && res.data?.data) return res.data.data;
      return rejectWithValue(res.data?.message || 'Cập nhật thất bại');
    }

    const { formData } = buildHotelFormData(data);
    const res = await api.put(`${BASE}/${id}`, formData);
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
    return rejectWithValue(res.data?.message || 'Cập nhật thất bại');
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Lỗi cập nhật');
  }
});

export const deleteHotel = createAsyncThunk('partnerHotel/delete', async (id, { rejectWithValue }) => {
  try {
    const res = await api.delete(`${BASE}/${id}`);
    if (res.data?.success) {
      return Number(id);
    }
    return rejectWithValue(res.data?.message || 'Xóa khách sạn thất bại');
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Lỗi xóa khách sạn');
  }
});

export const fetchDiaDiem = createAsyncThunk('partnerHotel/diaDiem', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get(`${BASE}/dia-diem`);
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
    return rejectWithValue(res.data?.message || 'Lấy địa điểm thất bại');
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Lỗi lấy địa điểm');
  }
});

export const fetchAmenitiesForHotel = createAsyncThunk('partnerHotel/amenities', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get(`${BASE}/amenities`);
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
    return rejectWithValue(res.data?.message || 'Lấy tiện nghi thất bại');
  } catch (err) {
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
    defaultCancelPolicies: DEFAULT_CANCEL_POLICIES,
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
      .addCase(fetchMyHotels.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchMyHotels.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.list;
        state.defaultCancelPolicies = action.payload.defaultCancelPolicies;
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
      .addCase(createHotel.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createHotel.fulfilled, (state, action) => {
        state.loading = false;
        state.list.unshift(action.payload);
        state.successMsg = 'Tạo khách sạn thành công! Chờ admin duyệt.';
      })
      .addCase(createHotel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateHotel.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateHotel.fulfilled, (state, action) => {
        state.loading = false;
        const i = state.list.findIndex((x) => x.ma_khach_san === action.payload.ma_khach_san);
        if (i !== -1) state.list[i] = action.payload;
        state.successMsg = 'Cập nhật thành công!';
      })
      .addCase(updateHotel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteHotel.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(deleteHotel.fulfilled, (state, action) => {
        state.loading = false;
        state.list = state.list.filter((h) => h.ma_khach_san !== action.payload);
        state.successMsg = 'Đã xóa khách sạn thành công';
      })
      .addCase(deleteHotel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearMsg } = partnerHotelSlice.actions;
export default partnerHotelSlice.reducer;

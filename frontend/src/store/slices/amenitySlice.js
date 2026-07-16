import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

const ENDPOINT = "/amenities";

// ===== TIỆN NGHI =====
export const fetchAmenities = createAsyncThunk("amenities/fetch", async () => {
  const res = await api.get(ENDPOINT);
  return res.data.data;
});

export const addAmenity = createAsyncThunk("amenities/add", async (data) => {
  const res = await api.post(ENDPOINT, data);
  return res.data.data;
});

export const updateAmenity = createAsyncThunk("amenities/update", async ({ id, data }) => {
  const res = await api.put(`${ENDPOINT}/${id}`, data);
  return res.data.data;
});

export const removeAmenity = createAsyncThunk("amenities/delete", async (id) => {
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

// ===== YÊU CẦU TIỆN NGHI =====
export const fetchRequests = createAsyncThunk("amenities/fetchRequests", async () => {
  const res = await api.get(`${ENDPOINT}/requests`);
  return res.data.data;
});

export const approveRequest = createAsyncThunk('amenities/approveRequest', async ({ id }) => {
  const res = await api.patch(`${ENDPOINT}/requests/${id}/approve`);
  return res.data.data;
});

export const rejectRequest = createAsyncThunk("amenities/rejectRequest", async ({ id, phan_hoi }) => {
  const res = await api.patch(`${ENDPOINT}/requests/${id}/reject`, { phan_hoi });
  return res.data.data;
});

const amenitySlice = createSlice({
  name: "amenities",
  initialState: {
    list: [],
    requests: [],   // danh sách yêu cầu từ đối tác
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Tiện nghi
      .addCase(fetchAmenities.pending,   (state) => { state.loading = true; })
      .addCase(fetchAmenities.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(addAmenity.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      .addCase(updateAmenity.fulfilled, (state, action) => {
        const i = state.list.findIndex(x => x.ma_tien_nghi === action.payload.ma_tien_nghi);
        if (i !== -1) state.list[i] = action.payload;
      })
      .addCase(removeAmenity.fulfilled, (state, action) => {
        state.list = state.list.filter(x => x.ma_tien_nghi !== action.payload);
      })
      .addCase(lockAmenity.fulfilled, (state, action) => {
        const i = state.list.findIndex(x => x.ma_tien_nghi === action.payload?.ma_tien_nghi);
        if (i !== -1 && action.payload) state.list[i] = action.payload;
      })
      .addCase(unlockAmenity.fulfilled, (state, action) => {
        const i = state.list.findIndex(x => x.ma_tien_nghi === action.payload?.ma_tien_nghi);
        if (i !== -1 && action.payload) state.list[i] = action.payload;
      })

      // Yêu cầu
      .addCase(fetchRequests.fulfilled, (state, action) => {
        state.requests = action.payload || [];
      })
      .addCase(fetchRequests.rejected, (state) => {
        state.requests = [];
      })
      .addCase(approveRequest.fulfilled, (state, action) => {
        const i = state.requests.findIndex((x) => x.ma_yeu_cau === action.payload?.ma_yeu_cau);
        if (i !== -1 && action.payload) state.requests[i] = action.payload;
      })
      .addCase(rejectRequest.fulfilled, (state, action) => {
        const i = state.requests.findIndex((x) => x.ma_yeu_cau === action.payload?.ma_yeu_cau);
        if (i !== -1 && action.payload) state.requests[i] = action.payload;
      });
  },
});

export default amenitySlice.reducer;
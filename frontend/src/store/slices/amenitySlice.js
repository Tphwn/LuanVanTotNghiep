import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

const ENDPOINT = "/amenities";

// GET
export const fetchAmenities = createAsyncThunk(
  "amenities/fetch",
  async (params) => {
    const res = await api.get(ENDPOINT, { params });
    return res.data.data;
  }
);

// CREATE
export const addAmenity = createAsyncThunk(
  "amenities/add",
  async (data) => {
    const res = await api.post(ENDPOINT, data);
    return res.data.data;
  }
);

// UPDATE
export const updateAmenity = createAsyncThunk(
  "amenities/update",
  async ({ id, data }) => {
    const res = await api.put(`${ENDPOINT}/${id}`, data);
    return res.data.data;
  }
);

// DELETE
export const removeAmenity = createAsyncThunk(
  "amenities/delete",
  async (id) => {
    await api.delete(`${ENDPOINT}/${id}`);
    return id;
  }
);

const amenitySlice = createSlice({
  name: "amenities",
  initialState: {
    list: [],
    loading: false,
  },

  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(fetchAmenities.fulfilled, (state, action) => {
        state.list = action.payload;
      })

      .addCase(addAmenity.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })

      .addCase(updateAmenity.fulfilled, (state, action) => {
        const index = state.list.findIndex(
          (i) => i.ma_tien_nghi === action.payload.ma_tien_nghi
        );
        if (index !== -1) state.list[index] = action.payload;
      })

      .addCase(removeAmenity.fulfilled, (state, action) => {
        state.list = state.list.filter(
          (i) => i.ma_tien_nghi !== action.payload
        );
      });
  },
});

export default amenitySlice.reducer;
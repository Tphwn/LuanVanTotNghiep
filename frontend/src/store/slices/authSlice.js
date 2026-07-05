import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/authService';
import { setToken, setUser, removeToken, removeUser, getToken, getUser } from '../../utils/storage';

const mapAuthUser = (raw = {}) => ({
  id: raw.ma_nguoi_dung ?? raw.id ?? null,
  email: raw.email ?? null,
  vai_tro: raw.vai_tro ?? null,
  so_dien_thoai: raw.so_dien_thoai ?? null,
  ho_ten: raw.khach_hang?.ho_ten || raw.ho_ten || null,
  khach_hang: raw.khach_hang ?? null,
});

export const login = createAsyncThunk('auth/login', async (data, { rejectWithValue }) => {
  try {
    const res = await authService.login(data);
    return res.data?.data ?? res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Đăng nhập thất bại');
  }
});

export const register = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await authService.register(data);
    return res.data?.data ?? res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Đăng ký thất bại');
  }
});

export const getMe = createAsyncThunk('auth/getMe', async (_, { rejectWithValue }) => {
  try {
    const res = await authService.getMe();
    return res.data?.data ?? res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const authSlice = createSlice({
  name: 'auth',

  initialState: {
    user: getUser(),  
    token: getToken(), 
    loading: false,   
    error: null,   
  },

  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      removeToken();
      removeUser();
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = mapAuthUser(action.payload.user);
        setToken(action.payload.token);
        setUser(state.user);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = mapAuthUser(action.payload.user);
        setToken(action.payload.token);
        setUser(state.user);
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getMe.fulfilled, (state, action) => {
        const user = mapAuthUser(action.payload);
        state.user = user;
        setUser(user);
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
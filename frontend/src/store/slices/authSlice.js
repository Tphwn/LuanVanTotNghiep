import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/authService';
import { setToken, setUser, removeToken, removeUser, getToken, getUser } from '../../utils/storage';

export const login = createAsyncThunk('auth/login', async (data, { rejectWithValue }) => {
  try {
    const res = await authService.login(data);
    return res.data.data; 
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Đăng nhập thất bại');
  }
});

export const register = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await authService.register(data);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Đăng ký thất bại');
  }
});

// Action lấy thông tin user hiện tại — gọi khi app khởi động để kiểm tra token còn hợp lệ không
// Chạy: App.jsx khởi động → dispatch(getMe) → gọi /auth/me với token → cập nhật Redux
export const getMe = createAsyncThunk('auth/getMe', async (_, { rejectWithValue }) => {
  try {
    const res = await authService.getMe();
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const authSlice = createSlice({
  name: 'auth',

  // State khởi đầu: lấy từ localStorage để giữ đăng nhập khi refresh trang
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
        state.user = action.payload.user;
        setToken(action.payload.token);
        setUser(action.payload.user);
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
        state.user = action.payload.user;
        setToken(action.payload.token);
        setUser(action.payload.user);
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getMe.fulfilled, (state, action) => {
        state.user = action.payload;
        setUser(action.payload);
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
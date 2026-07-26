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

const applyAuthSession = (state, payload) => {
  state.token = payload.token;
  state.user = mapAuthUser(payload.user);
  setToken(payload.token);
  setUser(state.user);
};

export const login = createAsyncThunk('auth/login', async (data, { rejectWithValue }) => {
  try {
    const res = await authService.login(data);
    return res.data?.data ?? res.data;
  } catch (err) {
    return rejectWithValue({
      message: err.response?.data?.message || 'Đăng nhập thất bại',
      code: err.response?.data?.code,
      email: err.response?.data?.email,
    });
  }
});

export const loginWithGoogle = createAsyncThunk(
  'auth/loginWithGoogle',
  async (idToken, { rejectWithValue }) => {
    try {
      const res = await authService.loginWithGoogle(idToken);
      return res.data?.data ?? res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Đăng nhập Google thất bại');
    }
  },
);

export const register = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await authService.register(data);
    return res.data?.data ?? res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Đăng ký thất bại');
  }
});

export const verifyRegisterOtp = createAsyncThunk(
  'auth/verifyRegisterOtp',
  async (data, { rejectWithValue }) => {
    try {
      const res = await authService.verifyRegisterOtp(data);
      return res.data?.data ?? res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Xác thực OTP thất bại');
    }
  },
);

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
      state.error = null;
      removeToken();
      removeUser();
    },
    clearError: (state) => {
      state.error = null;
    },
    /** Đồng bộ Redux khi localStorage đổi (đăng nhập/xuất ở tab khác). */
    hydrateSession: (state) => {
      state.token = getToken();
      state.user = getUser();
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
        applyAuthSession(state, action.payload);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.payload || 'Đăng nhập thất bại';
      })
      .addCase(loginWithGoogle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.loading = false;
        applyAuthSession(state, action.payload);
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        // Đăng ký chỉ gửi OTP — chưa đăng nhập
        if (action.payload?.token && action.payload?.user) {
          applyAuthSession(state, action.payload);
        }
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(verifyRegisterOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyRegisterOtp.fulfilled, (state, action) => {
        state.loading = false;
        applyAuthSession(state, action.payload);
      })
      .addCase(verifyRegisterOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getMe.fulfilled, (state, action) => {
        const user = mapAuthUser(action.payload);
        state.user = user;
        setUser(user);
      })
      .addCase(getMe.rejected, (state) => {
        state.user = null;
        state.token = null;
        removeToken();
        removeUser();
      });
  },
});

export const { logout, clearError, hydrateSession } = authSlice.actions;
export default authSlice.reducer;

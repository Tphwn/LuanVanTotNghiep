import { createSlice, createAsyncThunk } from'@reduxjs/toolkit';
import adminUserService from'../../services/adminUserService';

export const fetchUsers = createAsyncThunk(
'adminUsers/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const res = await adminUserService.getUsers();
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ||'Lỗi tải dữ liệu'
      );
    }
  }
);

export const fetchUserDetail = createAsyncThunk(
'adminUsers/fetchUserDetail',
  async (id, { rejectWithValue }) => {
    try {
      const res = await adminUserService.getUserById(id);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ||'Không lấy được thông tin'
      );
    }
  }
);

export const lockUser = createAsyncThunk(
'adminUsers/lockUser',
  async (id, { rejectWithValue }) => {
    try {
      await adminUserService.lockUser(id);
      return id;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ||'Lỗi khóa tài khoản'
      );
    }
  }
);

export const unlockUser = createAsyncThunk(
'adminUsers/unlockUser',
  async (id, { rejectWithValue }) => {
    try {
      await adminUserService.unlockUser(id);
      return id;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ||'Lỗi mở khóa tài khoản'
      );
    }
  }
);

export const createPartner = createAsyncThunk(
  'adminUsers/createPartner',
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const res = await adminUserService.createPartner(data);
      await dispatch(fetchUsers());
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Tạo tài khoản đối tác thất bại'
      );
    }
  }
);

export const selectCustomers = (state) =>
  state.adminUsers.users.filter(
    (u) => u.vai_tro ==='khach_hang'
  );

export const selectPartners = (state) =>
  state.adminUsers.users.filter(
    (u) => u.vai_tro ==='doi_tac'
  );

const adminUserSlice = createSlice({
  name:'adminUsers',

  initialState: {
    users: [],
    selectedUser: null,
    loading: false,
    creating: false,
    error: null,
    successMsg: null,
  },

  reducers: {
    clearSelectedUser: (state) => {
      state.selectedUser = null;
    },
    clearUserMsg: (state) => {
      state.error = null;
      state.successMsg = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchUserDetail.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedUser = action.payload;
      })
      .addCase(fetchUserDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(lockUser.fulfilled, (state, action) => {
        const user = state.users.find(
          (u) => u.ma_nguoi_dung === action.payload
        );

        if (user) {
          user.trang_thai ='bi_khoa';
        }

        if (
          state.selectedUser &&
          state.selectedUser.ma_nguoi_dung === action.payload
        ) {
          state.selectedUser.trang_thai ='bi_khoa';
        }
      })
      .addCase(unlockUser.fulfilled, (state, action) => {
        const user = state.users.find(
          (u) => u.ma_nguoi_dung === action.payload
        );

        if (user) {
          user.trang_thai ='hoat_dong';
        }

        if (
          state.selectedUser &&
          state.selectedUser.ma_nguoi_dung === action.payload
        ) {
          state.selectedUser.trang_thai ='hoat_dong';
        }
      })
      .addCase(createPartner.pending, (state) => {
        state.creating = true;
        state.error = null;
        state.successMsg = null;
      })
      .addCase(createPartner.fulfilled, (state, action) => {
        state.creating = false;
        state.successMsg = action.payload?.message || 'Tạo tài khoản đối tác thành công';
      })
      .addCase(createPartner.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
      });
  },
});

export const { clearSelectedUser, clearUserMsg } = adminUserSlice.actions;

export default adminUserSlice.reducer;

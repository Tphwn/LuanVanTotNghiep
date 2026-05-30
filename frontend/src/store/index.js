import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    // Bạn có thể thêm các reducer khác ở đây
  },
});

export default store;
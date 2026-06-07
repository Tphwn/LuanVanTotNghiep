import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import adminUserReducer from '../redux/slices/adminUserSlice';
import amenityReducer from './slices/amenitySlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    adminUsers: adminUserReducer,
    amenities: amenityReducer,
  },
});

export default store;
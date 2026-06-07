import { configureStore } from '@reduxjs/toolkit';
import adminUserReducer from './slices/adminUserSlice';
import adminHotelReducer from './slices/adminHotelSlice';
export const store = configureStore({
  reducer: {
    auth: authReducer,
    adminUsers: adminUserReducer,
    adminHotels: adminHotelReducer,
  },
});
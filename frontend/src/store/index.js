import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import adminUserReducer from './slices/adminUserSlice';
import adminHotelReducer from './slices/adminHotelSlice';
import amenityReducer from './slices/amenitySlice';
import partnerHotelReducer from './slices/partnerHotelSlice';
import partnerBookingReducer from './slices/partnerBookingSlice';
import adminBookingReducer from './slices/adminBookingSlice';
import adminFinanceReducer from './slices/adminFinanceSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    adminUsers: adminUserReducer,
    adminHotels: adminHotelReducer,
    amenities: amenityReducer,
    partnerHotel: partnerHotelReducer,
    partnerBooking: partnerBookingReducer,
    adminBooking: adminBookingReducer,
    adminFinance: adminFinanceReducer,
  },
});

export default store;

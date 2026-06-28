import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/slices/authSlice';
import adminUserReducer from './slices/adminUserSlice';
import adminHotelReducer from './slices/adminHotelSlice';
import partnerBookingReducer from '../store/slices/partnerBookingSlice';
import partnerRoomReducer from '../store/slices/partnerRoomSlice';
import partnerHotelReducer from '../store/slices/partnerHotelSlice';
import amenityReducer from '../store/slices/amenitySlice';
import adminBookingReducer from './slices/adminBookingSlice';
import adminFinanceReducer from '../store/slices/adminFinanceSlice';
export const store = configureStore({
  reducer: {
    auth: authReducer,
    adminUsers: adminUserReducer,
    adminHotels: adminHotelReducer,
    partnerBooking: partnerBookingReducer,
    partnerRooms: partnerRoomReducer,
    partnerHotel: partnerHotelReducer,
    amenities: amenityReducer,
    adminBooking: adminBookingReducer,
    adminFinance: adminFinanceReducer,
  },
});
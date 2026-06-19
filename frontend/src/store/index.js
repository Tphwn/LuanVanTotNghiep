import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import adminUserReducer from './slices/adminUserSlice';
import adminHotelReducer from './slices/adminHotelSlice';
import amenityReducer from './slices/amenitySlice';
import partnerHotelReducer from './slices/partnerHotelSlice';
import partnerRoomReducer from './slices/partnerRoomSlice';
import partnerBookingReducer from './slices/partnerBookingSlice';
import adminBookingReducer from './slices/adminBookingSlice';
import adminPaymentReducer from './slices/adminPaymentSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    adminUsers: adminUserReducer,
    adminHotels: adminHotelReducer,
    amenities: amenityReducer,
    partnerHotel: partnerHotelReducer,
    partnerRooms: partnerRoomReducer,
    partnerBooking: partnerBookingReducer,
    adminBooking: adminBookingReducer,
    adminPayment: adminPaymentReducer,
  },
});

export default store;

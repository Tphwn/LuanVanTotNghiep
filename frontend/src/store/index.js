import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import adminUserReducer from '../redux/slices/adminUserSlice';
import adminHotelReducer from '../redux/slices/adminHotelSlice';
import amenityReducer from './slices/amenitySlice';
import partnerHotelReducer from './slices/partnerHotelSlice';
import partnerRoomReducer from './slices/partnerRoomSlice'; 

const store = configureStore({
  reducer: {
    auth: authReducer,
    adminUsers: adminUserReducer,
    adminHotels: adminHotelReducer,
    amenities: amenityReducer,
    partnerHotel: partnerHotelReducer,
    partnerRooms: partnerRoomReducer, 
  },
});

export default store;
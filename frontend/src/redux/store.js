import adminUserReducer from './slices/adminUserSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    adminUsers: adminUserReducer,
  },
});
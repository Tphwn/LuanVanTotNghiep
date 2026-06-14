import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ROUTES from '../constants/routes';
import ROLES from '../constants/roles';
import getRedirectRoute from '../utils/redirect';

import MainLayout from '../layouts/MainLayout';
import PartnerLayout from '../layouts/PartnerLayout';
import AdminLayout from '../layouts/AdminLayout';

import RoleRoute from './RoleRoute';

import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import HomePage from '../pages/customer/HomePage';

import PartnerDashboardPage from '../pages/partner/DashboardPage';
// Kéo 3 trang của quy trình Quản lý Khách sạn vào
import PartnerHotelsPage from '../pages/partner/hotels/HotelsPage';

import PartnerRoomsPage from '../pages/partner/rooms/RoomTypePage';
import PartnerReviewsPage from '../pages/partner/reviews/ReviewsPage';
import PartnerFinancePage from '../pages/partner/finance/FinancePage';
import PartnerImagesPage from '../pages/partner/images/HotelImagesPage';
import PartnerAccountPage from '../pages/partner/account/ProfilePage';
import PartnerBookingsPage from '../pages/partner/bookings/BookingManagePage';
import PricingPage from '../pages/partner/pricing/PricingPage';

import AdminDashboardPage from '../pages/admin/DashboardPage';
import AdminHotelsPage from '../pages/admin/hotels/HotelsPage';
import AdminBookingsPage from '../pages/admin/bookings/BookingsPage';
import AdminPaymentsPage from '../pages/admin/payment/PaymentsPage';
import AdminFinancePage from "../pages/admin/finance/AdminFinancePage";
import AdminReportsPage from '../pages/admin/reports/RevenueReportPage';
import AdminAmenitiesPage from '../pages/admin/amenities/AmenitiesPage';
import AdminRoomTypesPage from '../pages/admin/rooms/RoomTypesPage';
import AdminRoomDetailPage from '../pages/admin/rooms/RoomDetailPage';
import AdminReviewsPage from '../pages/admin/reviews/ReviewsPage';
import PartnersPage from '../pages/admin/users/PartnersPage';
import UserDetailPage from '../pages/admin/users/UserDetailPage';
import AdminUsersPage from "../pages/admin/users/UsersPage";

const AppRoutes = () => {
  const { token, user } = useSelector((state) => state.auth);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path={ROUTES.LOGIN} element={
          token && user ? <Navigate to={getRedirectRoute(user)} replace /> : <MainLayout><LoginPage /></MainLayout>
        } />
        <Route path={ROUTES.REGISTER} element={
          token && user ? <Navigate to={getRedirectRoute(user)} replace /> : <MainLayout><RegisterPage /></MainLayout>
        } />

        {/* Customer */}
        <Route path={ROUTES.HOME} element={
          <MainLayout><HomePage /></MainLayout>
        } />

        {/* Partner */}
        <Route path="/partner" element={
          <RoleRoute allowedRoles={[ROLES.DOI_TAC, ROLES.ADMIN]}>
            <PartnerLayout />
          </RoleRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<PartnerDashboardPage />} />
          
          {/* ======================= QUẢN LÝ KHÁCH SẠN ======================= */}
          <Route path="hotels" element={<PartnerHotelsPage />} />
          {/* ================================================================= */}

          <Route path="rooms" element={<PartnerRoomsPage />} />
          <Route path="hotels/:hotelId/rooms" element={<PartnerRoomsPage />} />
          <Route path="bookings" element={<PartnerBookingsPage />} />
          <Route path="reviews" element={<PartnerReviewsPage />} />
          <Route path="finance" element={<PartnerFinancePage />} />
          <Route path="images" element={<PartnerImagesPage />} />
          <Route path="account" element={<PartnerAccountPage />} />
          <Route path="pricing" element={<PricingPage />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={
          <RoleRoute allowedRoles={[ROLES.ADMIN]}>
            <AdminLayout />
          </RoleRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="hotels" element={<AdminHotelsPage />} />
          <Route path="bookings" element={<AdminBookingsPage />} />
          <Route path="payments" element={<AdminPaymentsPage />} />
          <Route path="amenities" element={<AdminAmenitiesPage />} />
          <Route path="room-types" element={<AdminRoomTypesPage />} />
          <Route path="room-types/:id" element={<AdminRoomDetailPage />} />
          <Route path="reviews" element={<AdminReviewsPage />} />
          <Route path="finance" element={<AdminFinancePage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="partners" element={<PartnersPage />} />
          <Route path="users/:id" element={<UserDetailPage />} />
        </Route>

        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
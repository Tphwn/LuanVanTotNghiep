import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ROUTES from '../constants/routes';
import ROLES from '../constants/roles';
import getRedirectRoute from '../utils/redirect';

import MainLayout from '../layouts/MainLayout';
import PartnerLayout from '../layouts/PartnerLayout';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import HomePage from '../pages/customer/HomePage';

import PartnerDashboardPage from '../pages/partner/DashboardPage';
import PartnerHotelsPage from '../pages/partner/HotelsPage';
import PartnerRoomsPage from '../pages/partner/RoomsPage';
import PartnerBookingsPage from '../pages/partner/BookingManagePage';
import PartnerAmenitiesPage from '../pages/partner/AmenitiesPage';
import PartnerImagesPage from '../pages/partner/ImagesPage';
import PartnerAccountPage from '../pages/partner/AccountPage';
import AdminDashboardPage from '../pages/admin/DashboardPage';
import AdminUsersPage from '../pages/admin/UsersPage';
import AdminHotelsPage from '../pages/admin/HotelsPage';
import AdminBookingsPage from '../pages/admin/BookingsPage';
import AdminPaymentsPage from '../pages/admin/PaymentsPage';
import AdminCommissionsPage from '../pages/admin/CommissionsPage';
import AdminRefundsPage from '../pages/admin/RefundsPage';
import AdminReportsPage from '../pages/admin/ReportsPage';

const AppRoutes = () => {
  const { token, user } = useSelector((state) => state.auth);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path={ROUTES.LOGIN} element={
          token && user ? <Navigate to={getRedirectRoute(user)} replace /> : <LoginPage />
        } />
        <Route path={ROUTES.REGISTER} element={
          token && user ? <Navigate to={getRedirectRoute(user)} replace /> : <RegisterPage />
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
          <Route path="hotels" element={<PartnerHotelsPage />} />
          <Route path="rooms" element={<PartnerRoomsPage />} />
          <Route path="bookings" element={<PartnerBookingsPage />} />
          <Route path="amenities" element={<PartnerAmenitiesPage />} />
          <Route path="images" element={<PartnerImagesPage />} />
          <Route path="account" element={<PartnerAccountPage />} />
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
          <Route path="commissions" element={<AdminCommissionsPage />} />
          <Route path="refunds" element={<AdminRefundsPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
        </Route>

        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
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
import HotelSearchPage from '../pages/customer/HotelSearchPage';
import CustomerRoomDetailPage from '../pages/customer/CustomerRoomDetailPage';
import CustomerHotelDetailPage from '../pages/customer/CustomerHotelDetailPage';
import CustomerBookingPage from '../pages/customer/CustomerBookingPage';
import MyBookingsPage from '../pages/customer/MyBookingsPage';
import PromotionsPage from '../pages/customer/PromotionsPage';
import ContactPage from '../pages/customer/ContactPage';
import BookingGuidePage from '../pages/customer/BookingGuidePage';
import PartnerContactPage from '../pages/customer/PartnerContactPage';
import ProfilePage from '../pages/customer/ProfilePage';
import PointsPage from '../pages/customer/PointsPage';
import TransactionsPage from '../pages/customer/TransactionsPage';
import RefundsPage from '../pages/customer/RefundsPage';

import PartnerDashboardPage from '../pages/partner/DashboardPage';
import PartnerHotelsPage from '../pages/partner/hotels/HotelsPage';
import PartnerHotelDetailPage from '../pages/partner/hotels/HotelDetailPage';
import PartnerHotelFormPage from '../pages/partner/hotels/HotelFormPage';

import PartnerRoomsPage from '../pages/partner/rooms/RoomTypePage';
import PartnerRoomFormPage from '../pages/partner/rooms/RoomFormPage';
import PartnerReviewsPage from '../pages/partner/reviews/ReviewsPage';
import PartnerReviewDetailPage from '../pages/partner/reviews/ReviewDetailPage';
import PartnerFinancePage from '../pages/partner/finance/FinancePage';
import PartnerImagesPage from '../pages/partner/images/HotelImagesPage';
import PartnerAccountPage from '../pages/partner/account/ProfilePage';
import PartnerBookingsPage from '../pages/partner/bookings/BookingManagePage';
import PartnerBookingDetailPage from '../pages/partner/bookings/PartnerBookingDetailPage';
import PricingPage from '../pages/partner/pricing/PricingPage';
import PartnerPromotionsPage from '../pages/partner/promotions/PromotionsPage';

import PartnerRequestsPage from '../pages/admin/partnerRequests/PartnerRequestsPage';
import AdminDashboardPage from '../pages/admin/DashboardPage';
import AdminHotelsPage from '../pages/admin/hotels/HotelsPage';
import AdminBookingsPage from '../pages/admin/bookings/BookingsPage';
import BookingDetailPage from '../pages/admin/bookings/BookingDetailPage';
import AdminFinancePage from '../pages/admin/finance/AdminFinancePage';
import TransactionDetailPage from '../pages/admin/finance/TransactionDetailPage';
import RefundDetailPage from '../pages/admin/finance/RefundDetailPage';
import AdminReportsPage from '../pages/admin/reports/ReportsPage';
import AdminAmenitiesPage from '../pages/admin/amenities/AmenitiesPage';
import AmenityFormPage from '../pages/admin/amenities/AmenityFormPage';
import AdminRoomTypesPage from '../pages/admin/rooms/RoomTypesPage';
import AdminRoomDetailPage from '../pages/admin/rooms/RoomDetailPage';
import AdminReviewsPage from '../pages/admin/reviews/ReviewsPage';
import PartnersPage from '../pages/admin/users/PartnersPage';
import UserDetailPage from '../pages/admin/users/UserDetailPage';
import AdminUsersPage from "../pages/admin/users/UsersPage";
import CreatePartnerPage from "../pages/admin/users/CreatePartnerPage";
import HotelDetailPage from '../pages/admin/hotels/HotelDetailPage';
import CustomerAccountLayout from '../layouts/CustomerAccountLayout';
import ProtectedRoute from './ProtectedRoute';
const AppRoutes = () => {
  const { token, user } = useSelector((state) => state.auth);

  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.LOGIN} element={
          token && user ? <Navigate to={getRedirectRoute(user)} replace /> : <MainLayout><LoginPage /></MainLayout>
        } />
        <Route path={ROUTES.REGISTER} element={
          token && user ? <Navigate to={getRedirectRoute(user)} replace /> : <MainLayout><RegisterPage /></MainLayout>
        } />

        <Route path={ROUTES.HOME} element={
          <MainLayout fullBleed><HomePage /></MainLayout>
        } />
        <Route path={ROUTES.CUSTOMER.ROOM_SEARCH} element={
          <MainLayout><HotelSearchPage /></MainLayout>
        } />
        <Route path={ROUTES.CUSTOMER.HOTELS} element={
          <MainLayout><HotelSearchPage /></MainLayout>
        } />
        <Route path="/hotels/:hotelId/rooms/:roomId" element={
          <MainLayout><CustomerRoomDetailPage /></MainLayout>
        } />
        <Route path={ROUTES.CUSTOMER.BOOKING} element={
          <MainLayout><CustomerBookingPage /></MainLayout>
        } />
        <Route path="/hotels/:id" element={
          <MainLayout><CustomerHotelDetailPage /></MainLayout>
        } />
        <Route path={ROUTES.CUSTOMER.PROMOTIONS} element={
          <MainLayout><PromotionsPage /></MainLayout>
        } />
        <Route path={ROUTES.CUSTOMER.CONTACT} element={
          <MainLayout><ContactPage /></MainLayout>
        } />
        <Route path={ROUTES.CUSTOMER.BOOKING_GUIDE} element={
          <MainLayout><BookingGuidePage /></MainLayout>
        } />
        <Route path={ROUTES.CUSTOMER.PARTNER_CONTACT} element={
          <MainLayout><PartnerContactPage /></MainLayout>
        } />

        <Route
          element={
            <ProtectedRoute allowedRoles={[ROLES.KHACH_HANG]}>
              <MainLayout><CustomerAccountLayout /></MainLayout>
            </ProtectedRoute>
          }
        >
          <Route path={ROUTES.CUSTOMER.PROFILE} element={<ProfilePage />} />
          <Route path={ROUTES.CUSTOMER.POINTS} element={<PointsPage />} />
          <Route path={ROUTES.CUSTOMER.MY_BOOKINGS} element={<MyBookingsPage />} />
          <Route path={ROUTES.CUSTOMER.TRANSACTIONS} element={<TransactionsPage />} />
          <Route path={ROUTES.CUSTOMER.REFUNDS} element={<RefundsPage />} />
        </Route>
        {/* Partner */}
        <Route path="/partner" element={
          <RoleRoute allowedRoles={[ROLES.DOI_TAC, ROLES.ADMIN]}>
            <PartnerLayout />
          </RoleRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<PartnerDashboardPage />} />
          
          <Route path="hotels" element={<PartnerHotelsPage />} />
          <Route path="hotels/create" element={<PartnerHotelFormPage />} />
          <Route path="hotels/:id" element={<PartnerHotelDetailPage />} />
          <Route path="hotels/:id/edit" element={<PartnerHotelFormPage />} />

          <Route path="rooms" element={<PartnerRoomsPage />} />
          <Route path="hotels/:hotelId/rooms" element={<PartnerRoomsPage />} />
          <Route path="hotels/:hotelId/rooms/create" element={<PartnerRoomFormPage />} />
          <Route path="hotels/:hotelId/rooms/:roomId/edit" element={<PartnerRoomFormPage />} />
          <Route path="bookings" element={<PartnerBookingsPage />} />
          <Route path="bookings/:id" element={<PartnerBookingDetailPage />} />
          <Route path="reviews" element={<PartnerReviewsPage />} />
          <Route path="reviews/:id" element={<PartnerReviewDetailPage />} />
          <Route path="finance" element={<PartnerFinancePage />} />
          <Route path="images" element={<PartnerImagesPage />} />
          <Route path="account" element={<PartnerAccountPage />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="promotions" element={<PartnerPromotionsPage />} />
          <Route path="inventory" element={<Navigate to="/partner/pricing" replace />} />
          <Route path="inventory/:id/edit" element={<Navigate to="/partner/pricing" replace />} />
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
          <Route path="users/create-partner" element={<CreatePartnerPage />} />
          <Route path="users/:id" element={<UserDetailPage />} />
          <Route path="hotels" element={<AdminHotelsPage />} />
          <Route path="hotels/:id" element={<HotelDetailPage />} />
          <Route path="bookings" element={<AdminBookingsPage />} />
          <Route path="bookings/:id" element={<BookingDetailPage />} />
          <Route path="payments" element={<Navigate to="/admin/finance" replace />} />
          <Route path="amenities" element={<AdminAmenitiesPage />} />
          <Route path="amenities/create" element={<AmenityFormPage />} />
          <Route path="amenities/:id/edit" element={<AmenityFormPage />} />
          <Route path="room-types" element={<AdminRoomTypesPage />} />
          <Route path="room-types/:id" element={<AdminRoomDetailPage />} />
          <Route path="reviews" element={<AdminReviewsPage />} />
          <Route path="finance" element={<AdminFinancePage />} />
          <Route path="finance/transactions/:id" element={<TransactionDetailPage />} />
          <Route path="finance/refunds/:id" element={<RefundDetailPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="partner-requests" element={<PartnerRequestsPage />} />
          <Route path="partner-requests/:id" element={<PartnerRequestsPage />} />
          <Route path="partners" element={<PartnersPage />} />
        </Route>

        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
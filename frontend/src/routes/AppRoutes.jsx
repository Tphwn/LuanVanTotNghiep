

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import MainLayout from '../layouts/MainLayout';
import PartnerLayout from '../layouts/PartnerLayout';
import AdminLayout from '../layouts/AdminLayout';

import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

import HomePage from '../pages/customer/HomePage';

import { ROUTES } from '../constants/routes';
import ROLES from '../constants/roles';

const AppRoutes = () => {
  const { token, user } = useSelector((state) => state.auth);

  return (
    <BrowserRouter>
      <Routes>

        <Route path={ROUTES.LOGIN} element={
          token ? <Navigate to={ROUTES.HOME} replace /> : <LoginPage />
        } />
        <Route path={ROUTES.REGISTER} element={
          token ? <Navigate to={ROUTES.HOME} replace /> : <RegisterPage />
        } />

        <Route path={ROUTES.HOME} element={
          <MainLayout>
            <HomePage />
          </MainLayout>
        } />

        <Route path="/partner/*" element={
          <RoleRoute allowedRoles={[ROLES.DOI_TAC, ROLES.ADMIN]}>
            <PartnerLayout />
          </RoleRoute>
        } />

        <Route path="/admin/*" element={
          <RoleRoute allowedRoles={[ROLES.ADMIN]}>
            <AdminLayout />
          </RoleRoute>
        } />
        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />

      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
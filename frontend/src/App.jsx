import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getMe } from './store/slices/authSlice';
import AppRoutes from './routes/AppRoutes';
import AuthSessionSync from './components/common/AuthSessionSync';

const App = () => {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token) {
      dispatch(getMe());
    }
  }, [token, dispatch]);

  return (
    <>
      <AuthSessionSync />
      <AppRoutes />
    </>
  );
};

export default App;
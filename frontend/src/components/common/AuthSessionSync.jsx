import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { hydrateSession, getMe } from '../../store/slices/authSlice';
import { getToken } from '../../utils/storage';

const AuthSessionSync = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const onStorage = (event) => {
      if (event.storageArea !== localStorage) return;
      if (event.key !== 'token' && event.key !== 'user' && event.key != null) return;
      dispatch(hydrateSession());
      const token = getToken();
      if (token) {
        dispatch(getMe());
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [dispatch]);

  return null;
};

export default AuthSessionSync;

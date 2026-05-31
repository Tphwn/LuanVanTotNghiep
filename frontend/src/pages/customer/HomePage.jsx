import { useSelector } from 'react-redux';

const HomePage = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <div style={{ textAlign: 'center', paddingTop: '3rem' }}>
      <h2>Chào mừng đến Hotel Booking 🏨</h2>
      {user && (
        <p style={{ color: '#666', marginTop: '1rem' }}>
          Xin chào <strong>{user.ho_ten || user.email}</strong> — vai trò: <strong>{user.vai_tro}</strong>
        </p>
      )}
    </div>
  );
};

export default HomePage;
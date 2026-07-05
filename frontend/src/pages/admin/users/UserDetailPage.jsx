import { Navigate, useParams } from 'react-router-dom';

const UserDetailPage = () => {
  const { id } = useParams();

  return (
    <Navigate
      to="/admin/users"
      replace
      state={{ detailUserId: id ? Number(id) : null }}
    />
  );
};

export default UserDetailPage;

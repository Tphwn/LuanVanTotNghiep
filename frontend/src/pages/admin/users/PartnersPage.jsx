import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers } from '../../../store/slices/adminUserSlice';

const PartnersPage = () => {
  const dispatch = useDispatch();
  const { users, loading } = useSelector((state) => state.adminUsers);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const partners = users.filter((u) => u.vai_tro === 'doi_tac');

  return (
    <div className="container mt-4">
      <h3>Quản lý đối tác</h3>
      {loading && <p>Đang tải...</p>}
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên công ty</th>
            <th>Email</th>
            <th>SĐT</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {partners.map((p) => (
            <tr key={p.ma_nguoi_dung}>
              <td>{p.ma_nguoi_dung}</td>
              <td>{p.doi_tac?.ten_cong_ty || p.email}</td>
              <td>{p.email}</td>
              <td>{p.so_dien_thoai}</td>
              <td>{p.trang_thai === 'hoat_dong'?'Hoạt động':'Bị khóa'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PartnersPage;

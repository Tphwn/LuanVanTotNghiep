const AdminAmenitiesPage = () => {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Quản lý tiện nghi</h1>
        <p className="page-subtitle">Thêm, sửa, xóa các tiện nghi cho khách sạn và phòng</p>
      </div>

      <div className="content-card">
        <div className="content-card-header">
          <h3 className="content-card-title">🛎️ Danh sách tiện nghi</h3>
          <button style={{
            padding: '8px 16px',
            background: '#3C7363',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
          }}>
            + Thêm tiện nghi
          </button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Tên tiện nghi</th>
              <th>Biểu tượng</th>
              <th>Loại</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', color: '#5a7a72', padding: '32px' }}>
                Chưa có tiện nghi nào
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminAmenitiesPage;
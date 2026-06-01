const BookingManagePage = () => {
  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>Quản lý đặt phòng</h1>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.08)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              <th style={{ textAlign: 'left', padding: '1rem' }}>Khách hàng</th>
              <th style={{ textAlign: 'left', padding: '1rem' }}>Khách sạn</th>
              <th style={{ textAlign: 'left', padding: '1rem' }}>Ngày đến</th>
              <th style={{ textAlign: 'left', padding: '1rem' }}>Trạng thái</th>
              <th style={{ textAlign: 'left', padding: '1rem' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '1rem', borderTop: '1px solid #eee' }}>Nguyễn Văn A</td>
              <td style={{ padding: '1rem', borderTop: '1px solid #eee' }}>Hotel Riverfront</td>
              <td style={{ padding: '1rem', borderTop: '1px solid #eee' }}>2026-06-10</td>
              <td style={{ padding: '1rem', borderTop: '1px solid #eee' }}>Đã xác nhận</td>
              <td style={{ padding: '1rem', borderTop: '1px solid #eee' }}>Xem chi tiết</td>
            </tr>
            <tr>
              <td style={{ padding: '1rem', borderTop: '1px solid #eee' }}>Trần Thị B</td>
              <td style={{ padding: '1rem', borderTop: '1px solid #eee' }}>Garden View Hotel</td>
              <td style={{ padding: '1rem', borderTop: '1px solid #eee' }}>2026-06-15</td>
              <td style={{ padding: '1rem', borderTop: '1px solid #eee' }}>Chờ duyệt</td>
              <td style={{ padding: '1rem', borderTop: '1px solid #eee' }}>Phê duyệt</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BookingManagePage;

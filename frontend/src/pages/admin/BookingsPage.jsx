const BookingsPage = () => {
  const bookings = [
    {
      id: 1,
      khachHang: 'Nguyễn Văn A',
      khachSan: 'Hotel Luxury',
      tongTien: '2.500.000đ',
      trangThai: 'Đã thanh toán',
    },
  ];

  return (
    <div>
      <h1>📅 Quản lý đặt phòng</h1>

      <table style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>Mã</th>
            <th>Khách hàng</th>
            <th>Khách sạn</th>
            <th>Tổng tiền</th>
            <th>Trạng thái</th>
          </tr>
        </thead>

        <tbody>
          {bookings.map((booking) => (
            <tr key={booking.id}>
              <td>{booking.id}</td>
              <td>{booking.khachHang}</td>
              <td>{booking.khachSan}</td>
              <td>{booking.tongTien}</td>
              <td>{booking.trangThai}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BookingsPage;
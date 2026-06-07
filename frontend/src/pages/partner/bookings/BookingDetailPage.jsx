const BookingDetailPage = () => {
  return (
    <div>
      <h1>Chi tiết đặt phòng</h1>
      <div style={{ background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
        <p><strong>Mã đơn:</strong> BK001</p>
        <p><strong>Khách hàng:</strong> Nguyễn Văn A</p>
        <p><strong>Loại phòng:</strong> Deluxe</p>
        <p><strong>Check-in:</strong> 2026-06-10</p>
        <p><strong>Check-out:</strong> 2026-06-12</p>
        <p><strong>Tổng tiền:</strong> 2.400.000đ</p>
        <p><strong>Trạng thái:</strong> Đã thanh toán</p>
      </div>
    </div>
  );
};

export default BookingDetailPage;

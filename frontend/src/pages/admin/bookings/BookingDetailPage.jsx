const BookingDetailPage = () => {
  return (
    <div>
      <h1>Chi tiết đặt phòng</h1>
      <div style={{ background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
        <p><strong>Mã đơn:</strong> 1</p>
        <p><strong>Khách hàng:</strong> Nguyễn Văn A</p>
        <p><strong>Khách sạn:</strong> Hotel Luxury</p>
        <p><strong>Tổng tiền:</strong> 2.500.000đ</p>
        <p><strong>Trạng thái:</strong> Đã thanh toán</p>
      </div>
    </div>
  );
};

export default BookingDetailPage;

const ReviewsPage = () => {
  const reviews = [
    { id: 'RV-P001', customer: 'Trần Thị B', hotel: 'Sunrise Hotel', rating: 4, status: 'Chờ duyệt' },
    { id: 'RV-P002', customer: 'Lê Văn C', hotel: 'Moonlight Hotel', rating: 5, status: 'Đã duyệt' },
    { id: 'RV-P003', customer: 'Nguyễn Văn D', hotel: 'City Hotel', rating: 3, status: 'Từ chối' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1>⭐ Quản lý đánh giá</h1>
          <p style={{ margin: 0, color: '#59616a' }}>Xem và duyệt đánh giá khách hàng cho khách sạn của bạn.</p>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
        <thead>
          <tr style={{ background: '#f4f6f8' }}>
            <th style={{ padding: '12px 14px', textAlign: 'left' }}>Mã</th>
            <th style={{ padding: '12px 14px', textAlign: 'left' }}>Khách hàng</th>
            <th style={{ padding: '12px 14px', textAlign: 'left' }}>Khách sạn</th>
            <th style={{ padding: '12px 14px', textAlign: 'left' }}>Sao</th>
            <th style={{ padding: '12px 14px', textAlign: 'left' }}>Trạng thái</th>
            <th style={{ padding: '12px 14px', textAlign: 'left' }}>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((item) => (
            <tr key={item.id} style={{ borderTop: '1px solid #eee' }}>
              <td style={{ padding: '12px 14px' }}>{item.id}</td>
              <td style={{ padding: '12px 14px' }}>{item.customer}</td>
              <td style={{ padding: '12px 14px' }}>{item.hotel}</td>
              <td style={{ padding: '12px 14px' }}>{item.rating} / 5</td>
              <td style={{ padding: '12px 14px' }}>{item.status}</td>
              <td style={{ padding: '12px 14px' }}>
                <button style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #0958d9', background: '#fff', color: '#0958d9', cursor: 'pointer' }}>
                  Xem chi tiết
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReviewsPage;

const ReviewsPage = () => {
  const reviews = [
    { id: 'RV001', customer: 'Nguyễn Văn A', hotel: 'Hotel Luxury', rating: 5, status: 'Đã duyệt' },
    { id: 'RV002', customer: 'Trần Thị B', hotel: 'Sunrise Hotel', rating: 4, status: 'Chờ duyệt' },
    { id: 'RV003', customer: 'Lê Văn C', hotel: 'City Hotel', rating: 3, status: 'Từ chối' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1>⭐ Quản lý đánh giá</h1>
          <p style={{ margin: 0, color: '#59616a' }}>Duyệt, phản hồi và theo dõi xếp hạng khách hàng.</p>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
        <thead>
          <tr style={{ background: '#f4f6f8' }}>
            <th style={{ padding: '12px 14px', textAlign: 'left' }}>Mã đánh giá</th>
            <th style={{ padding: '12px 14px', textAlign: 'left' }}>Khách hàng</th>
            <th style={{ padding: '12px 14px', textAlign: 'left' }}>Khách sạn</th>
            <th style={{ padding: '12px 14px', textAlign: 'left' }}>Số sao</th>
            <th style={{ padding: '12px 14px', textAlign: 'left' }}>Trạng thái</th>
            <th style={{ padding: '12px 14px', textAlign: 'left' }}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((review) => (
            <tr key={review.id} style={{ borderTop: '1px solid #eee' }}>
              <td style={{ padding: '12px 14px' }}>{review.id}</td>
              <td style={{ padding: '12px 14px' }}>{review.customer}</td>
              <td style={{ padding: '12px 14px' }}>{review.hotel}</td>
              <td style={{ padding: '12px 14px' }}>{review.rating} / 5</td>
              <td style={{ padding: '12px 14px' }}>{review.status}</td>
              <td style={{ padding: '12px 14px' }}>
                <button style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #0958d9', background: '#fff', color: '#0958d9', cursor: 'pointer' }}>
                  Chi tiết
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

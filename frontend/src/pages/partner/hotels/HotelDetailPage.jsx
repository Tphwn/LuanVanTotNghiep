const HotelEditPage = () => {
  return (
    <div>
      <h1>Chỉnh sửa khách sạn</h1>
      <div style={{ maxWidth: 600, background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Tên khách sạn</label>
          <input type="text" defaultValue="Hotel Luxury" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Địa chỉ</label>
          <input type="text" defaultValue="Đà Lạt" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Mô tả</label>
          <textarea defaultValue="Khách sạn 5 sao..." style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', boxSizing: 'border-box', minHeight: 120 }} />
        </div>
        <button style={{ padding: 10, borderRadius: 6, background: '#117d62', color: '#fff', border: 'none', cursor: 'pointer' }}>Cập nhật</button>
      </div>
    </div>
  );
};

export default HotelEditPage;

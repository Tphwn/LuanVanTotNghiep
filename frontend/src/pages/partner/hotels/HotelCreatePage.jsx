const HotelCreatePage = () => {
  return (
    <div>
      <h1>Thêm khách sạn mới</h1>
      <div style={{ maxWidth: 600, background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Tên khách sạn</label>
          <input type="text" placeholder="Nhập tên khách sạn" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Địa chỉ</label>
          <input type="text" placeholder="Nhập địa chỉ" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Mô tả</label>
          <textarea placeholder="Mô tả khách sạn" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', boxSizing: 'border-box', minHeight: 120 }} />
        </div>
        <button style={{ padding: 10, borderRadius: 6, background: '#117d62', color: '#fff', border: 'none', cursor: 'pointer' }}>Tạo khách sạn</button>
      </div>
    </div>
  );
};

export default HotelCreatePage;

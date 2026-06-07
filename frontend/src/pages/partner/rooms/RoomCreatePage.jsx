const RoomCreatePage = () => {
  return (
    <div>
      <h1>Thêm loại phòng mới</h1>
      <div style={{ maxWidth: 600, background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Loại phòng</label>
          <input type="text" placeholder="Deluxe, Suite, Standard..." style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Số khách</label>
          <input type="number" placeholder="2" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Giá/đêm</label>
          <input type="number" placeholder="1.200.000" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', boxSizing: 'border-box' }} />
        </div>
        <button style={{ padding: 10, borderRadius: 6, background: '#117d62', color: '#fff', border: 'none', cursor: 'pointer' }}>Tạo phòng</button>
      </div>
    </div>
  );
};

export default RoomCreatePage;

const PartnerAmenitiesPage = () => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Quản lý tiện nghi</h1>
        <button style={{ padding: '0.75rem 1.25rem', borderRadius: 8, background: '#117d62', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14 }}>Thêm tiện nghi</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {['WiFi', 'Bể bơi', 'Gym', 'Nhà hàng', 'Spa', 'Thể mộc'].map((item) => (
          <div key={item} style={{ padding: '1.25rem', borderRadius: 8, background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', textAlign: 'center' }}>
            <h3 style={{ marginTop: 0 }}>{item}</h3>
            <p style={{ color: '#666', margin: '0.5rem 0', fontSize: 14 }}>Có sẵn tại các phòng</p>
            <button style={{ padding: '0.5rem 1rem', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: 12 }}>Xóa</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PartnerAmenitiesPage;
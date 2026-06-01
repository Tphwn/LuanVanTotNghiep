const PartnerRoomsPage = () => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Quản lý loại phòng</h1>
        <button style={{ padding: '0.75rem 1.25rem', borderRadius: 8, background: '#117d62', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14 }}>Thêm loại phòng</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {['Deluxe', 'Suite', 'Standard'].map((type) => (
          <div key={type} style={{ padding: '1.5rem', borderRadius: 8, background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <h3 style={{ marginTop: 0 }}>Phòng {type}</h3>
            <p style={{ color: '#666', margin: '0.5rem 0' }}>Diện tích: 35m²</p>
            <p style={{ color: '#666', margin: '0.5rem 0' }}>Giường: 1 King</p>
            <p style={{ color: '#117d62', fontWeight: 'bold', margin: '0.5rem 0' }}>1,200,000đ/đêm</p>
            <button style={{ marginTop: '1rem', padding: '0.5rem 1rem', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>Chỉnh sửa</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PartnerRoomsPage;
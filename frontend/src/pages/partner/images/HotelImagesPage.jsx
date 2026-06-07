const PartnerImagesPage = () => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Quản lý hình ảnh</h1>
        <button style={{ padding: '0.75rem 1.25rem', borderRadius: 8, background: '#117d62', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14 }}>Tải lên</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ borderRadius: 8, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <div style={{ height: 150, background: '#ececec', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
              Hình {i + 1}
            </div>
            <div style={{ padding: '0.75rem' }}>
              <p style={{ margin: 0, color: '#666', fontSize: 13 }}>Khách sạn Riverside</p>
              <button style={{ marginTop: '0.5rem', padding: '0.4rem 0.8rem', borderRadius: 4, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: 12 }}>Xóa</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PartnerImagesPage;
const RoomImagesPage = () => {
  return (
    <div>
      <h1>Quản lý hình ảnh phòng</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 20 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)'}}>
            <div style={{ width:'100%', height: 150, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              Hình ảnh phòng {i}
            </div>
            <div style={{ padding: 12 }}>
              <button style={{ width:'100%', padding: 8, borderRadius: 6, background: '#ff4d4f', color: '#fff', border: 'none', cursor: 'pointer' }}>Xóa</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomImagesPage;

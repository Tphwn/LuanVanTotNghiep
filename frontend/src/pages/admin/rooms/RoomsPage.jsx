const RoomsPage = () => {
  const roomTypes = [
    { id: 'RT001', hotel: 'Hotel Luxury', type: 'Deluxe', guests: 2, price: '1.200.000đ' },
    { id: 'RT002', hotel: 'Sunrise Hotel', type: 'Suite', guests: 4, price: '2.500.000đ' },
    { id: 'RT003', hotel: 'City Hotel', type: 'Standard', guests: 2, price: '900.000đ' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1>🛏️ Quản lý loại phòng</h1>
          <p style={{ margin: 0, color: '#59616a' }}>Xem, sửa và thêm các loại phòng trong hệ thống.</p>
        </div>
        <button style={{ padding: '0.85rem 1.25rem', borderRadius: 8, background: '#0958d9', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14 }}>Thêm loại phòng</button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
        <thead>
          <tr style={{ background: '#f4f6f8' }}>
            <th style={{ padding: '12px 14px', textAlign: 'left' }}>Mã loại</th>
            <th style={{ padding: '12px 14px', textAlign: 'left' }}>Khách sạn</th>
            <th style={{ padding: '12px 14px', textAlign: 'left' }}>Loại phòng</th>
            <th style={{ padding: '12px 14px', textAlign: 'left' }}>Số khách</th>
            <th style={{ padding: '12px 14px', textAlign: 'left' }}>Giá/đêm</th>
            <th style={{ padding: '12px 14px', textAlign: 'left' }}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {roomTypes.map((room) => (
            <tr key={room.id} style={{ borderTop: '1px solid #eee' }}>
              <td style={{ padding: '12px 14px' }}>{room.id}</td>
              <td style={{ padding: '12px 14px' }}>{room.hotel}</td>
              <td style={{ padding: '12px 14px' }}>{room.type}</td>
              <td style={{ padding: '12px 14px' }}>{room.guests}</td>
              <td style={{ padding: '12px 14px' }}>{room.price}</td>
              <td style={{ padding: '12px 14px' }}>
                <button style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #0958d9', background: '#fff', color: '#0958d9', cursor: 'pointer' }}>
                  Chỉnh sửa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RoomsPage;

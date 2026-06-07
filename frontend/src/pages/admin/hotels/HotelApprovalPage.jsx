const HotelApprovalPage = () => {
  const pendingHotels = [
    { id: 1, name: 'Beach Resort', location: 'Vũng Tàu', submitted: '2026-06-01' },
    { id: 2, name: 'Mountain View', location: 'Đà Lạt', submitted: '2026-06-03' },
  ];

  return (
    <div>
      <h1>🏨 Duyệt khách sạn</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={headerStyle}>ID</th>
            <th style={headerStyle}>Tên</th>
            <th style={headerStyle}>Vị trí</th>
            <th style={headerStyle}>Ngày gửi</th>
          </tr>
        </thead>
        <tbody>
          {pendingHotels.map((hotel) => (
            <tr key={hotel.id}>
              <td style={cellStyle}>{hotel.id}</td>
              <td style={cellStyle}>{hotel.name}</td>
              <td style={cellStyle}>{hotel.location}</td>
              <td style={cellStyle}>{hotel.submitted}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const headerStyle = { padding: '14px', textAlign: 'left', borderBottom: '1px solid #ddd' };
const cellStyle = { padding: '14px', borderBottom: '1px solid #eee' };

export default HotelApprovalPage;

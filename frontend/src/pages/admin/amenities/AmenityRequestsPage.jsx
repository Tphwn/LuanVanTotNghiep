const AmenityRequestsPage = () => {
  const requests = [
    { id: 1, amenity: 'Spa', hotel: 'Hotel Luxury', requestedBy: 'Đối tác A' },
    { id: 2, amenity: 'Gym', hotel: 'City Hotel', requestedBy: 'Đối tác B' },
  ];

  return (
    <div>
      <h1>Yêu cầu tiện nghi</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={headerStyle}>ID</th>
            <th style={headerStyle}>Tiện nghi</th>
            <th style={headerStyle}>Khách sạn</th>
            <th style={headerStyle}>Người yêu cầu</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((item) => (
            <tr key={item.id}>
              <td style={cellStyle}>{item.id}</td>
              <td style={cellStyle}>{item.amenity}</td>
              <td style={cellStyle}>{item.hotel}</td>
              <td style={cellStyle}>{item.requestedBy}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const headerStyle = { padding: '14px', textAlign: 'left', borderBottom: '1px solid #ddd' };
const cellStyle = { padding: '14px', borderBottom: '1px solid #eee' };

export default AmenityRequestsPage;

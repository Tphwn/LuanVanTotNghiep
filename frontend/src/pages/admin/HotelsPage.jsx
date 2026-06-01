const HotelsPage = () => {
  const hotels = [
    {
      id: 1,
      ten: 'Hotel Luxury',
      diaChi: 'Đà Lạt',
      trangThai: 'Hoạt động',
    },
    {
      id: 2,
      ten: 'Beach Resort',
      diaChi: 'Vũng Tàu',
      trangThai: 'Chờ duyệt',
    },
  ];

  return (
    <div>
      <h1>🏨 Quản lý khách sạn</h1>

      <button
        style={{
          padding: '10px 16px',
          marginBottom: '20px',
        }}
      >
        + Thêm khách sạn
      </button>

      <table style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên</th>
            <th>Địa chỉ</th>
            <th>Trạng thái</th>
          </tr>
        </thead>

        <tbody>
          {hotels.map((hotel) => (
            <tr key={hotel.id}>
              <td>{hotel.id}</td>
              <td>{hotel.ten}</td>
              <td>{hotel.diaChi}</td>
              <td>{hotel.trangThai}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HotelsPage;
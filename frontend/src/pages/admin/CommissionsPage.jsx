const CommissionsPage = () => {
  return (
    <div>
      <h1>💰 Quản lý hoa hồng</h1>

      <table style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>Khách sạn</th>
            <th>Doanh thu</th>
            <th>Tỷ lệ</th>
            <th>Hoa hồng</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>Hotel Luxury</td>
            <td>100.000.000đ</td>
            <td>10%</td>
            <td>10.000.000đ</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default CommissionsPage;
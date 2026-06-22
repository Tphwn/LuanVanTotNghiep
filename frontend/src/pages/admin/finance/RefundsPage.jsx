const RefundsPage = () => {
  return (
    <div>
      <h1> Quản Lý Hoàn Tiền</h1>

      <table style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>Mã đơn</th>
            <th>Khách hàng</th>
            <th>Số tiền</th>
            <th>Trạng thái</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>BK001</td>
            <td>Nguyễn Văn A</td>
            <td>1.000.000đ</td>
            <td>Đang xử lý</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default RefundsPage;
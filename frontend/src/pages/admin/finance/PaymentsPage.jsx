const PaymentsPage = () => {
  return (
    <div>
      <h1> Quản Lý Thanh Toán</h1>

      <table style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>Mã GD</th>
            <th>Khách hàng</th>
            <th>Số tiền</th>
            <th>Phương thức</th>
            <th>Trạng thái</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>PAY001</td>
            <td>Nguyễn Văn A</td>
            <td>2.500.000đ</td>
            <td>VNPay</td>
            <td>Thành công</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default PaymentsPage;
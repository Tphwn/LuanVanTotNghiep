const PaymentsPage = () => {
  const payments = [
    { id: 1, order: 'BK001', amount: '2.400.000đ', status: 'Đã nhận' },
    { id: 2, order: 'BK002', amount: '1.800.000đ', status: 'Đang xử lý' },
  ];

  return (
    <div>
      <h1>Lịch sử thanh toán</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 20 }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={headerStyle}>ID</th>
            <th style={headerStyle}>Đơn hàng</th>
            <th style={headerStyle}>Số tiền</th>
            <th style={headerStyle}>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id}>
              <td style={cellStyle}>{p.id}</td>
              <td style={cellStyle}>{p.order}</td>
              <td style={cellStyle}>{p.amount}</td>
              <td style={cellStyle}>{p.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const headerStyle = { padding: 12, textAlign: 'left', borderBottom: '1px solid #ddd' };
const cellStyle = { padding: 12, borderBottom: '1px solid #eee' };

export default PaymentsPage;

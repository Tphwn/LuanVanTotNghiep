const RevenuePage = () => {
  const metrics = [
    { label: 'Doanh thu', value: '250.000.000đ', color: '#1a7a4a' },
    { label: 'Hoa hồng', value: '18.000.000đ', color: '#d97706' },
    { label: 'Hoàn tiền', value: '4.200.000đ', color: '#b91c1c' },
    { label: 'Thu nhập ròng', value: '227.800.000đ', color: '#0d9488' },
  ];

  const history = [
    { id: 'TX-P001', type: 'Hoa hồng', amount: '8.000.000đ', status: 'Đã thanh toán' },
    { id: 'TX-P002', type: 'Hoàn tiền', amount: '2.000.000đ', status: 'Đang xử lý' },
    { id: 'TX-P003', type: 'Hoa hồng', amount: '10.000.000đ', status: 'Đã thanh toán' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1>💼 Tài chính đối tác</h1>
          <p style={{ margin: 0, color: '#59616a' }}>Theo dõi thu nhập, hoa hồng và hoàn tiền cho đối tác.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {metrics.map((item) => (
          <div key={item.label} style={{ padding: '22px', borderRadius: 14, background: '#fff', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ color: item.color, fontSize: '0.95rem', marginBottom: '12px' }}>{item.label}</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 700 }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 14, padding: '20px', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 16px' }}>Lịch sử giao dịch</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f4f6f8' }}>
              <th style={{ padding: '12px 14px', textAlign: 'left' }}>Mã</th>
              <th style={{ padding: '12px 14px', textAlign: 'left' }}>Loại</th>
              <th style={{ padding: '12px 14px', textAlign: 'left' }}>Số tiền</th>
              <th style={{ padding: '12px 14px', textAlign: 'left' }}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item) => (
              <tr key={item.id} style={{ borderTop: '1px solid #eee' }}>
                <td style={{ padding: '12px 14px' }}>{item.id}</td>
                <td style={{ padding: '12px 14px' }}>{item.type}</td>
                <td style={{ padding: '12px 14px' }}>{item.amount}</td>
                <td style={{ padding: '12px 14px' }}>{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RevenuePage;

const FinancePage = () => {
  const summary = [
    { label: 'Tổng doanh thu', value: '1.250.000.000đ', color: '#1a7a4a' },
    { label: 'Hoa hồng', value: '85.000.000đ', color: '#d97706' },
    { label: 'Hoàn tiền', value: '12.500.000đ', color: '#b91c1c' },
    { label: 'Thu nhập ròng', value: '1.152.500.000đ', color: '#0d9488' },
  ];

  const transactions = [
    { id: 'TX001', type: 'Hoa hồng', hotel: 'Hotel Luxury', amount: '10.000.000đ', status: 'Đã hoàn thành' },
    { id: 'TX002', type: 'Hoàn tiền', hotel: 'Sunrise Hotel', amount: '2.500.000đ', status: 'Đang xử lý' },
    { id: 'TX003', type: 'Hoa hồng', hotel: 'City Hotel', amount: '7.500.000đ', status: 'Đã hoàn thành' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1>💼 Tài chính</h1>
          <p style={{ margin: 0, color: '#59616a' }}>Quản lý dòng tiền, hoa hồng và hoàn tiền trong hệ thống.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {summary.map((item) => (
          <div key={item.label} style={{ padding: '22px', borderRadius: 14, background: '#fff', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ color: item.color, fontSize: '0.95rem', marginBottom: '12px' }}>{item.label}</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 700 }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 14, padding: '20px', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 16px' }}>Giao dịch tài chính gần đây</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f4f6f8' }}>
              <th style={{ padding: '12px 14px', textAlign: 'left' }}>Mã giao dịch</th>
              <th style={{ padding: '12px 14px', textAlign: 'left' }}>Loại</th>
              <th style={{ padding: '12px 14px', textAlign: 'left' }}>Khách sạn</th>
              <th style={{ padding: '12px 14px', textAlign: 'left' }}>Số tiền</th>
              <th style={{ padding: '12px 14px', textAlign: 'left' }}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} style={{ borderTop: '1px solid #eee' }}>
                <td style={{ padding: '12px 14px' }}>{tx.id}</td>
                <td style={{ padding: '12px 14px' }}>{tx.type}</td>
                <td style={{ padding: '12px 14px' }}>{tx.hotel}</td>
                <td style={{ padding: '12px 14px' }}>{tx.amount}</td>
                <td style={{ padding: '12px 14px' }}>{tx.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinancePage;

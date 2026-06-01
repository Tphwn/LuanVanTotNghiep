const ReportsPage = () => {
  return (
    <div>
      <h1>📈 Báo cáo thống kê</h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3,1fr)',
          gap: '20px',
        }}
      >
        <div
          style={{
            background: '#fff',
            padding: '20px',
            borderRadius: '12px',
          }}
        >
          <h3>Tổng doanh thu</h3>
          <h2>500.000.000đ</h2>
        </div>

        <div
          style={{
            background: '#fff',
            padding: '20px',
            borderRadius: '12px',
          }}
        >
          <h3>Tổng đơn</h3>
          <h2>1200</h2>
        </div>

        <div
          style={{
            background: '#fff',
            padding: '20px',
            borderRadius: '12px',
          }}
        >
          <h3>Tổng khách hàng</h3>
          <h2>350</h2>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
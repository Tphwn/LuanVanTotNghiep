const PartnerAccountPage = () => {
  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>Quản lý tài khoản</h1>
      <div style={{ maxWidth: 600, background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '1.5rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: 6, color: '#666', fontWeight: 500 }}>Họ tên</label>
          <input type="text" placeholder="Nhập họ tên" style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ddd', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: 6, color: '#666', fontWeight: 500 }}>Email</label>
          <input type="email" placeholder="email@example.com" style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ddd', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: 6, color: '#666', fontWeight: 500 }}>Số điện thoại</label>
          <input type="tel" placeholder="0987654321" style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ddd', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: 6, color: '#666', fontWeight: 500 }}>Mật khẩu mới</label>
          <input type="password" placeholder="Để trống nếu không đổi" style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #ddd', boxSizing: 'border-box' }} />
        </div>
        <button style={{ padding: '0.75rem 2rem', borderRadius: 8, background: '#117d62', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14 }}>Lưu thay đổi</button>
      </div>
    </div>
  );
};

export default PartnerAccountPage;
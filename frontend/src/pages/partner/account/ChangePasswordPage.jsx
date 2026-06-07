const ChangePasswordPage = () => {
  return (
    <div>
      <h1>Đổi mật khẩu</h1>
      <div style={{ maxWidth: 400, background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.05)', marginTop: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Mật khẩu cũ</label>
          <input type="password" placeholder="Nhập mật khẩu cũ" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Mật khẩu mới</label>
          <input type="password" placeholder="Nhập mật khẩu mới" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Xác nhận mật khẩu</label>
          <input type="password" placeholder="Xác nhận mật khẩu mới" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', boxSizing: 'border-box' }} />
        </div>
        <button style={{ padding: 10, borderRadius: 6, background: '#117d62', color: '#fff', border: 'none', cursor: 'pointer', width: '100%' }}>Đổi mật khẩu</button>
      </div>
    </div>
  );
};

export default ChangePasswordPage;

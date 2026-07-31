/**
 * Layout 50/50: trái ảnh brand, phải form auth (login / register).
 */
const AuthSplitLayout = ({ children }) => (
  <div className="auth-split">
    <aside
      className="auth-split-brand"
      role="img"
      aria-label="Hotel Booking"
    />
    <div className="auth-split-form">
      <div className="auth-split-form-inner">
        {children}
      </div>
    </div>
  </div>
);

export default AuthSplitLayout;

const EditField = ({
  label,
  required,
  error,
  children,
}) => (
  <div style={{ padding: '10px 0', borderBottom: '1px solid #f0f4f3' }}>
    <div style={{ fontSize: 12, color: '#5a7a72', marginBottom: 6 }}>
      {label}
      {required && <span style={{ color: '#e05c5c' }}> *</span>}
    </div>
    {children}
    {error && (
      <p style={{ margin: '6px 0 0', fontSize: 12, color: '#e05c5c' }}>{error}</p>
    )}
  </div>
);

export default EditField;

export default function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', padding: '8px 0', borderBottom: '0.5px solid #f0f0f0', fontSize: 14 }}>
      <span style={{ width: 160, color: '#5a7a72', flexShrink: 0, fontSize: 13 }}>{label}</span>
      <span style={{ color: '#1a2e28', fontWeight: 500 }}>{value || '—'}</span>
    </div>
  );
}

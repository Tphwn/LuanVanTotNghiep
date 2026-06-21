export default function DetailTable({ title, rows }) {
  return (
    <div className="booking-detail-section">
      {title && <h4 className="booking-detail-section-title">{title}</h4>}
      <table className="booking-detail-table">
        <tbody>
          {rows.map(({ label, value }) => (
            <tr key={label}>
              <th>{label}</th>
              <td>{value ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

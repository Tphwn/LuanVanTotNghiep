export default function BookingSectionTable({ title, columns, rows }) {
  if (!rows?.length) return null;

  return (
    <div className="booking-detail-section">
      <h4 className="booking-detail-section-title">{title}</h4>
      <div className="booking-detail-table-scroll">
        <table className="data-table data-table-grid">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                {row.cells.map((cell, index) => (
                  <td key={index} {...(row.cellProps?.[index] || {})}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

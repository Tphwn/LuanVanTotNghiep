const formatTime = (d) => (d ? new Date(d).toLocaleString('vi-VN') : '—');

/** Danh sách đề xuất tiện nghi (từ thông báo admin), không còn duyệt/từ chối */
export const RequestsSection = ({
  proposals = [],
  loading = false,
  onMarkRead,
  onAddAmenity,
}) => (
  <div className="mgmt-table-card mgmt-table-card--grid amenity-requests-card">
    <div className="amenity-requests-toolbar">
      <h3 className="mgmt-table-card-title" style={{ margin: 0 }}>
        Đề xuất từ đối tác ({proposals.length})
      </h3>
      <p style={{ margin: '6px 0 0', fontSize: 13, color: '#5a7a72' }}>
        Đây là thông báo đề xuất. Admin thêm tiện nghi vào danh mục khi phù hợp — không cần duyệt/từ chối.
      </p>
    </div>

    {loading ? (
      <p className="empty-state-text">Đang tải...</p>
    ) : proposals.length === 0 ? (
      <p className="empty-state-text">Chưa có đề xuất tiện nghi từ đối tác</p>
    ) : (
      <div className="table-scroll">
        <table className="data-table data-table-grid admin-mgmt-table amenity-requests-table">
          <thead>
            <tr>
              <th>Tiêu đề</th>
              <th>Nội dung</th>
              <th>Thời gian</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {proposals.map((n) => (
              <tr key={n.ma_thong_bao}>
                <td><strong>{n.tieu_de}</strong></td>
                <td className="admin-review-content">{n.noi_dung}</td>
                <td>{formatTime(n.ngay_gui)}</td>
                <td>
                  <span className={`badge ${n.da_doc ? 'badge-default' : 'badge-warning'}`}>
                    {n.da_doc ? 'Đã xem' : 'Chưa xem'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {!n.da_doc && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => onMarkRead?.(n.ma_thong_bao)}
                      >
                        Đánh dấu đã xem
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => onAddAmenity?.(n)}
                    >
                      Thêm tiện nghi
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

import {
  getAmenityProposalContent,
  isAmenityProposalAdded,
} from '../utils';

const formatTime = (d) => (d ? new Date(d).toLocaleString('vi-VN') : '—');

/** Danh sách đề xuất tiện nghi (từ thông báo admin), không còn duyệt/từ chối */
export const RequestsSection = ({
  proposals = [],
  amenities = [],
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
      <div className="table-scroll mgmt-table-scroll">
        <table className="data-table data-table-grid admin-mgmt-table amenity-requests-table">
          <thead>
            <tr>
              <th className="amenity-req-col-title">Tiêu đề</th>
              <th className="amenity-req-col-content">Nội dung</th>
              <th className="amenity-req-col-time">Thời gian</th>
              <th className="amenity-req-col-status">Trạng thái</th>
              <th className="amenity-req-col-actions">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {proposals.map((n) => {
              const added = isAmenityProposalAdded(n, amenities);
              return (
                <tr key={n.ma_thong_bao}>
                  <td className="amenity-req-col-title">
                    <strong>{n.tieu_de}</strong>
                  </td>
                  <td className="amenity-req-col-content admin-review-content">
                    {getAmenityProposalContent(n)}
                  </td>
                  <td className="amenity-req-col-time">{formatTime(n.ngay_gui)}</td>
                  <td className="amenity-req-col-status">
                    <span className={`badge ${added ? 'badge-success' : n.da_doc ? 'badge-default' : 'badge-warning'}`}>
                      {added ? 'Đã thêm' : n.da_doc ? 'Đã xem' : 'Chưa xem'}
                    </span>
                  </td>
                  <td className="amenity-req-col-actions table-action-cell">
                    <div className="table-actions">
                      {!added && !n.da_doc && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => onMarkRead?.(n.ma_thong_bao)}
                        >
                          Đánh dấu đã xem
                        </button>
                      )}
                      {!added && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => onAddAmenity?.(n)}
                        >
                          Thêm tiện nghi
                        </button>
                      )}
                      {added && (
                        <span className="amenity-req-added-hint">Đã có trong danh mục</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

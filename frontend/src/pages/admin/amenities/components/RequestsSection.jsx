import { RequestCard } from './RequestCard';

const REQUEST_FILTERS = [
  { id: 'cho_xu_ly', label: 'Đang chờ', countKey: 'pendingCount' },
  { id: 'da_tao', label: 'Đã duyệt', countKey: 'approvedCount' },
  { id: 'tu_choi', label: 'Từ chối', countKey: 'rejectedCount' },
  { id: 'all', label: 'Tất cả', countKey: 'totalCount' },
];

export const RequestsSection = ({
  requestFilter,
  onFilterChange,
  pendingCount,
  approvedCount,
  rejectedCount,
  totalCount,
  filteredRequests,
  onApprove,
  onReject,
}) => (
  <div className="content-card" style={{ marginBottom: 0 }}>
    <div className="request-section-header">
      <div>
        <div className="request-section-title">Yêu cầu thêm tiện nghi từ đối tác</div>
        <div className="request-section-sub">Xét duyệt để thêm vào danh mục.</div>
      </div>
      <div className="request-subtabs">
        {REQUEST_FILTERS.map(({ id, label, countKey }) => {
          const counts = { pendingCount, approvedCount, rejectedCount, totalCount };
          const count = counts[countKey];
          return (
            <button
              key={id}
              type="button"
              className={`request-subtab-btn${requestFilter === id ? ' active' : ''}`}
              onClick={() => onFilterChange(id)}
            >
              {label}
              {count > 0 && <span className="request-subtab-count">{count}</span>}
            </button>
          );
        })}
      </div>
    </div>

    <div className="request-list">
      {filteredRequests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#5a7a72' }}>
          Không có yêu cầu nào
        </div>
      ) : (
        filteredRequests.map((req) => (
          <RequestCard
            key={req.ma_yeu_cau}
            req={req}
            onApprove={onApprove}
            onReject={onReject}
          />
        ))
      )}
    </div>
  </div>
);

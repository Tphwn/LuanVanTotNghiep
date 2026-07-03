import { Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import ActionButton, { ActionCell } from '../../../../components/common/ActionButton';
import { inferLoaiDeXuat } from '../utils';

const LOAI_TABS = [
  { id: 'khach_san', label: 'Khách sạn' },
  { id: 'phong', label: 'Loại phòng' },
];

const REQUEST_FILTERS = [
  { id: 'cho_xu_ly', label: 'Đang chờ', countKey: 'pendingCount' },
  { id: 'da_tao', label: 'Đã duyệt', countKey: 'approvedCount' },
  { id: 'tu_choi', label: 'Từ chối', countKey: 'rejectedCount' },
  { id: 'all', label: 'Tất cả', countKey: 'totalCount' },
];

export const RequestsSection = ({
  requestLoaiFilter,
  onLoaiFilterChange,
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
  <div className="mgmt-table-card mgmt-table-card--grid amenity-requests-card">
    <div className="amenity-requests-toolbar">
      <div className="amenity-request-loai-tabs">
        {LOAI_TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`amenity-request-loai-tab${requestLoaiFilter === id ? ' active' : ''}`}
            onClick={() => onLoaiFilterChange(id)}
          >
            {label}
          </button>
        ))}
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

    {filteredRequests.length === 0 ? (
      <div className="empty-state">
        <p className="empty-state-text">Không có yêu cầu nào</p>
      </div>
    ) : (
      <div className="mgmt-table-scroll">
        <table className="data-table data-table-grid mgmt-list-table amenity-requests-table">
          <thead>
            <tr>
              <th style={{ width: 160 }}>Đối tác</th>
              <th style={{ width: 180 }}>Khách sạn</th>
              <th>Mô tả yêu cầu</th>
              <th style={{ width: 100 }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((req) => {
              const isPending = req.trang_thai === 'cho_xu_ly';
              const hotelId = req.doi_tac?.ma_khach_san;
              const hotelName = req.doi_tac?.ten_khach_san;
              const description = req.mo_ta || req.ten_de_xuat || '—';

              return (
                <tr key={req.ma_yeu_cau}>
                  <td>
                    <div className="mgmt-cell-name">{req.doi_tac?.ten_cong_ty || '—'}</div>
                  </td>
                  <td>
                    {hotelId && hotelName ? (
                      <Link to={`/admin/hotels/${hotelId}`} className="amenity-request-hotel-link">
                        {hotelName}
                      </Link>
                    ) : (
                      <span className="mgmt-cell-sub">—</span>
                    )}
                  </td>
                  <td>
                    <div className="amenity-request-desc">{description}</div>
                  </td>
                  <ActionCell>
                    <ActionButton
                      variant="reject"
                      iconOnly
                      icon={X}
                      title="Từ chối"
                      disabled={!isPending}
                      onClick={() => isPending && onReject(req.ma_yeu_cau)}
                    />
                    <ActionButton
                      variant="approve"
                      iconOnly
                      icon={Check}
                      title="Duyệt"
                      disabled={!isPending}
                      onClick={() => isPending && onApprove(req)}
                    />
                  </ActionCell>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

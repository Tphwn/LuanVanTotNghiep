import { Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import ActionButton, { ActionCell } from '../../../../components/common/ActionButton';
import ListPagination from '../../../../components/common/management/ListPagination';
import useListPagination from '../../../../hooks/useListPagination';
import { LOAI_LABEL } from '../constants';
import { getPartnerRequestNote, inferLoaiDeXuat } from '../utils';

const LOAI_TABS = [
  { id: 'all', label: 'Tất cả' },
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
}) => {
  const showRejectReason = requestFilter === 'tu_choi';
  const {
    pagedItems: pagedRequests,
    currentPage,
    totalPages,
    setPage,
    pageNumbers,
    rangeFrom,
    rangeTo,
    showPagination,
  } = useListPagination(filteredRequests, 10, [requestFilter, requestLoaiFilter]);

  return (
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
          <table className="data-table data-table-grid admin-mgmt-table amenity-requests-table">
            <thead>
              <tr>
                <th style={{ width: 150 }}>Đối tác</th>
                <th style={{ width: 160 }}>Khách sạn</th>
                <th style={{ width: 120 }}>Phạm vi</th>
                <th>Nội dung yêu cầu</th>
                {showRejectReason && <th style={{ width: 220 }}>Lý do từ chối</th>}
                <th style={{ width: 100 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {pagedRequests.map((req) => {
                const isPending = req.trang_thai === 'cho_xu_ly';
                const hotelId = req.doi_tac?.ma_khach_san;
                const hotelName = req.doi_tac?.ten_khach_san;
                const loaiDx = inferLoaiDeXuat(req);
                const loaiMeta = LOAI_LABEL[loaiDx];
                const partnerNote = getPartnerRequestNote(req.mo_ta);
                const requestTitle = req.ten_de_xuat || '—';
                const rejectReason = (req.phan_hoi || '').trim();

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
                      {loaiMeta ? (
                        <span className={`badge ${loaiMeta.cls}`}>{loaiMeta.label}</span>
                      ) : (
                        <span className="mgmt-cell-sub">Chưa rõ</span>
                      )}
                    </td>
                    <td>
                      <div className="amenity-request-desc">
                        <strong className="amenity-request-desc-title">{requestTitle}</strong>
                        {partnerNote ? (
                          <span className="amenity-request-desc-note">{partnerNote}</span>
                        ) : (
                          <span className="amenity-request-desc-note">
                            {loaiDx === 'phong'
                              ? 'Đề xuất thêm tiện nghi cho loại phòng'
                              : loaiDx === 'khach_san'
                                ? 'Đề xuất thêm tiện nghi cho khách sạn'
                                : 'Đề xuất thêm tiện nghi'}
                          </span>
                        )}
                      </div>
                    </td>
                    {showRejectReason && (
                      <td>
                        <div className="amenity-reject-reason-cell">
                          {rejectReason || <span className="mgmt-cell-sub">—</span>}
                        </div>
                      </td>
                    )}
                    <ActionCell>
                      <ActionButton
                        variant="reject"
                        iconOnly
                        icon={X}
                        title="Từ chối"
                        disabled={!isPending}
                        onClick={() => isPending && onReject(req)}
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
          {showPagination && (
            <ListPagination
              total={filteredRequests.length}
              currentPage={currentPage}
              totalPages={totalPages}
              rangeFrom={rangeFrom}
              rangeTo={rangeTo}
              pageNumbers={pageNumbers}
              onPageChange={setPage}
            />
          )}
        </div>
      )}
    </div>
  );
};

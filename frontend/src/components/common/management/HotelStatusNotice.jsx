import { getHotelStatusMeta } from '../../../constants/statusConfig';

/**
 * Build notice for rejected / request-edit / locked hotels.
 * Returns null when nothing relevant to show in the hero.
 */
export const getHotelStatusNotice = (hotel) => {
  if (!hotel) return null;
  const status = hotel.trang_thai;

  if (status === 'bi_khoa') {
    const byPartner = Boolean(hotel.khoa_do_doi_tac);
    const meta = getHotelStatusMeta(hotel, { variant: 'badge' });
    return {
      tone: byPartner ? 'warning' : 'danger',
      lockedBy: byPartner ? 'Đối tác' : 'Quản trị viên',
      statusLabel: meta.label,
      reasonLabel: byPartner ? 'Lý do tạm ngưng' : 'Lý do khóa',
      reason: hotel.ly_do_khoa?.trim() || '',
    };
  }

  if (status === 'tu_choi') {
    return {
      tone: 'danger',
      lockedBy: null,
      statusLabel: null,
      reasonLabel: 'Lý do từ chối',
      reason: hotel.ly_do_tu_choi?.trim() || '',
    };
  }

  if (status === 'yeu_cau_sua') {
    return {
      tone: 'warning',
      lockedBy: null,
      statusLabel: null,
      reasonLabel: 'Yêu cầu chỉnh sửa',
      reason: hotel.ly_do_tu_choi?.trim() || '',
    };
  }

  return null;
};

const HotelStatusNotice = ({ hotel }) => {
  const notice = getHotelStatusNotice(hotel);
  if (!notice) return null;
  if (!notice.lockedBy && !notice.reason) return null;

  return (
    <div className={`hotel-detail-status-notice hotel-detail-status-notice--${notice.tone}`}>
      {notice.lockedBy && (
        <p className="hotel-detail-status-notice-row">
          <span className="hotel-detail-status-notice-label">
            {notice.statusLabel === 'Tạm ngừng' ? 'Tạm ngưng bởi' : 'Khóa bởi'}:
          </span>
          {' '}
          {notice.lockedBy}
        </p>
      )}
      {notice.reason ? (
        <p className="hotel-detail-status-notice-row">
          <span className="hotel-detail-status-notice-label">{notice.reasonLabel}:</span>
          {' '}
          {notice.reason}
        </p>
      ) : null}
    </div>
  );
};

export default HotelStatusNotice;

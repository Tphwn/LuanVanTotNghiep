import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Calendar, ChevronLeft, ChevronRight, MapPin, Sparkles, Star, Check, X,
} from 'lucide-react';
import adminHotelService from '../../../services/adminHotelService';
import {
  approveHotel, rejectHotel, lockHotel, unlockHotel,
} from '../../../store/slices/adminHotelSlice';
import { resolveUploadUrl } from '../../../utils/media';
import ActionButton, { TableActions } from '../../../components/common/ActionButton';
import BackButton from '../../../components/common/BackButton';
import DetailTable from '../../../components/booking/DetailTable';
import SummaryStats from '../../../components/common/management/SummaryStats';
import ListPagination from '../../../components/common/management/ListPagination';
import useListPagination from '../../../hooks/useListPagination';
import { HOTEL_CATEGORY_GROUPS } from '../amenities/constants';
import { groupAmenitiesByCategory } from '../amenities/utils';
import { getAdminRoomTypeStatus } from '../../../constants/statuses';
import { TRANG_THAI, formatCurrency, formatDate } from '../../../utils/bookingDisplay';
import { getHotelStatusMeta, REVIEW_BADGE } from '../../../constants/statusConfig';
import HotelLockConfirmModal from './components/HotelLockConfirmModal';
import ConfirmModal from '../../../components/common/ConfirmModal';
import HotelStatusNotice from '../../../components/common/management/HotelStatusNotice';
import {
  buildAdminHotelsListPath,
  hotelStatusToListTab,
} from '../../../utils/adminListReturn';

const PAGE_SIZE = 10;

const HOTEL_TABS = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'images', label: 'Hình ảnh' },
  { id: 'rooms', label: 'Loại phòng' },
  { id: 'amenities', label: 'Tiện nghi' },
  { id: 'bookings', label: 'Đơn đặt phòng' },
  { id: 'reviews', label: 'Đánh giá' },
];

const formatDateTime = (date) => (date ? new Date(date).toLocaleString('vi-VN') : '—');

const formatUpdateTime = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${time} ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
};

const formatTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const getNameInitial = (name) => {
  if (!name) return '?';
  const word = name.trim().split(/\s+/).filter(Boolean)[0];
  return word?.[0]?.toUpperCase() || '?';
};

const DetailTabs = ({ tabs, activeTab, onChange }) => (
  <div className="admin-user-detail-tabs" role="tablist">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        type="button"
        role="tab"
        aria-selected={activeTab === tab.id}
        className={`admin-user-detail-tab${activeTab === tab.id ? ' is-active' : ''}`}
        onClick={() => onChange(tab.id)}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

const HotelDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionError, setActionError] = useState('');
  const [flashMsg, setFlashMsg] = useState('');
  const [pendingAction, setPendingAction] = useState(null);

  const backTo = location.state?.returnTo
    || buildAdminHotelsListPath(hotelStatusToListTab(hotel?.trang_thai));

  const loadHotel = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await adminHotelService.getById(id);
      setHotel(res.data.data || res.data);
      setActiveImg(0);
    } catch {
      setHotel(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadHotel(); }, [loadHotel]);

  useEffect(() => {
    if (!flashMsg) return undefined;
    const t = setTimeout(() => setFlashMsg(''), 4000);
    return () => clearTimeout(t);
  }, [flashMsg]);

  const amenityGroups = useMemo(() => {
    if (!hotel) return [];
    const items = (hotel.khach_san_tien_nghi || []).map((tn) => ({
      ma_tien_nghi: tn.ma_tien_nghi || tn.tien_nghi?.ma_tien_nghi,
      ten: tn.tien_nghi?.ten,
      danh_muc: tn.tien_nghi?.danh_muc,
      bieu_tuong: tn.tien_nghi?.bieu_tuong,
    })).filter((item) => item.ten);
    return groupAmenitiesByCategory(items, HOTEL_CATEGORY_GROUPS).filter((g) => g.items.length > 0);
  }, [hotel]);

  const statItems = useMemo(() => {
    const stats = hotel?.thong_ke_nhanh || {};
    return [
      { label: 'Loại phòng', value: stats.tong_loai_phong ?? 0 },
      { label: 'Đơn đặt', value: stats.tong_don_dat ?? 0 },
      {
        label: 'Doanh thu',
        value: stats.tong_doanh_thu ? formatCurrency(stats.tong_doanh_thu) : formatCurrency(0),
      },
      {
        label: 'Đánh giá TB',
        value: stats.diem_trung_binh != null ? `${stats.diem_trung_binh}/5` : '—',
      },
    ];
  }, [hotel]);

  const resolvedTab = hotel
    ? (HOTEL_TABS.some((t) => t.id === activeTab) ? activeTab : 'overview')
    : 'overview';

  const activeTabList = useMemo(() => {
    if (!hotel) return [];
    if (resolvedTab === 'rooms') return hotel.loai_phong || [];
    if (resolvedTab === 'bookings') return hotel.dat_phong || [];
    if (resolvedTab === 'reviews') return hotel.danh_gia || [];
    return [];
  }, [hotel, resolvedTab]);

  const {
    pagedItems: pagedTabItems,
    currentPage: tabPage,
    totalPages: tabTotalPages,
    setPage: setTabPage,
    pageNumbers: tabPageNumbers,
    rangeFrom: tabRangeFrom,
    rangeTo: tabRangeTo,
    showPagination: showTabPagination,
  } = useListPagination(activeTabList, PAGE_SIZE, [resolvedTab, hotel?.ma_khach_san]);

  const handleAction = (actionType) => {
    if (actionType === 'approve') {
      setPendingAction({ type: 'approve' });
    } else if (actionType === 'reject') {
      setPendingAction({ type: 'reject' });
    } else if (actionType === 'lock') {
      setConfirmAction({ hotel, action: 'lock' });
    } else if (actionType === 'unlock') {
      setConfirmAction({ hotel, action: 'unlock' });
    }
  };

  const handleConfirmAction = async (reason) => {
    if (!pendingAction) return;
    const { type } = pendingAction;
    setActionLoading(true);
    setActionError('');
    try {
      const thunk = type === 'approve'
        ? approveHotel(id)
        : rejectHotel({ id, lyDo: reason });
      const result = await dispatch(thunk);
      if (result.meta?.requestStatus === 'rejected') {
        setActionError(result.payload || 'Thao tác thất bại');
        return;
      }
      setPendingAction(null);
      setFlashMsg(type === 'approve' ? 'Duyệt thành công' : 'Đã gửi lý do từ chối');
      await loadHotel();
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseConfirm = () => {
    if (actionLoading) return;
    setConfirmAction(null);
  };

  const handleConfirmToggle = async (lyDoKhoa) => {
    if (!confirmAction) return;

    const { action } = confirmAction;
    const isLock = action === 'lock';

    setActionLoading(true);
    setActionError('');
    try {
      const thunk = isLock
        ? lockHotel({ id, lyDoKhoa })
        : unlockHotel(id);
      const result = await dispatch(thunk);
      if (result.meta?.requestStatus === 'rejected') {
        setActionError(result.payload || (isLock ? 'Khóa thất bại' : 'Mở khóa thất bại'));
        return;
      }
      setConfirmAction(null);
      setFlashMsg(isLock ? 'Đã khóa thành công' : 'Đã mở khóa thành công');
      await loadHotel();
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mgmt-page admin-hotel-detail-page admin-user-detail-page">
        <div className="admin-user-detail-loading">Đang tải...</div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="mgmt-page admin-hotel-detail-page admin-user-detail-page">
        <BackButton to={backTo} />
        <div className="content-card admin-user-detail-section" style={{ marginTop: 16 }}>
          <p className="empty-state-text">Không tìm thấy khách sạn</p>
        </div>
      </div>
    );
  }

  const st = getHotelStatusMeta(hotel, { variant: 'badge' });
  const partnerLocked = Boolean(hotel.khoa_do_doi_tac);
  const partner = hotel.doi_tac;
  const images = hotel.hinh_anh?.length ? hotel.hinh_anh : [];
  const currentImg = images[activeImg] || images[0];
  const currentTab = resolvedTab;

  const prevImg = () => {
    if (!images.length) return;
    setActiveImg((i) => (i - 1 + images.length) % images.length);
  };

  const nextImg = () => {
    if (!images.length) return;
    setActiveImg((i) => (i + 1) % images.length);
  };

  return (
    <div className="mgmt-page admin-hotel-detail-page admin-user-detail-page">
      <div className="admin-user-detail-top">
        <BackButton to={backTo} />
      </div>

      {(flashMsg || actionError) && (
        <div className={`mgmt-toast ${flashMsg ? 'success' : 'error'}`}>
          {flashMsg || actionError}
        </div>
      )}

      <HotelLockConfirmModal
        hotel={confirmAction?.hotel}
        action={confirmAction?.action}
        loading={actionLoading}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmToggle}
      />

      <ConfirmModal
        open={Boolean(pendingAction)}
        variant={pendingAction?.type === 'reject' ? 'danger' : 'primary'}
        icon={pendingAction?.type === 'reject' ? <X size={20} /> : <Check size={20} />}
        title={pendingAction?.type === 'reject' ? 'Từ chối khách sạn' : 'Duyệt khách sạn'}
        intro={pendingAction?.type === 'reject'
          ? 'Khách sạn sẽ bị từ chối và không hiển thị trên sàn. Vui lòng nhập lý do rõ ràng.'
          : 'Bạn có chắc muốn duyệt khách sạn này hoạt động trên sàn?'}
        infoRows={[
          { label: 'Tên khách sạn', value: hotel?.ten },
          { label: 'Đối tác', value: hotel?.doi_tac?.ten_cong_ty || '—' },
        ]}
        reason={pendingAction?.type === 'reject' ? {
          required: true,
          id: 'hotel-detail-reject-reason',
          label: 'Lý do từ chối',
          placeholder: 'VD: Thông tin không chính xác, chưa đủ điều kiện...',
          hint: 'Lý do sẽ được gửi thông báo cho đối tác.',
        } : undefined}
        confirmText={pendingAction?.type === 'reject' ? 'Xác nhận từ chối' : 'Duyệt hoạt động'}
        loading={actionLoading}
        onClose={() => { if (!actionLoading) setPendingAction(null); }}
        onConfirm={handleConfirmAction}
      />

      <div className="admin-user-detail-hero content-card">
        <div className="admin-user-detail-hero-main">
          <div className="admin-user-detail-avatar" aria-hidden>
            {getNameInitial(hotel.ten)}
          </div>
          <div className="admin-user-detail-hero-body">
            <div className="admin-user-detail-hero-title-row">
              <h1 className="admin-user-detail-name">{hotel.ten}</h1>
              <span className={`badge ${st.cls}`}>{st.label}</span>
            </div>
            <ul className="admin-user-detail-hero-meta">
              <li><MapPin size={14} strokeWidth={2} /><span>{hotel.dia_diem?.ten_dia_diem || '—'}</span></li>
              <li><Star size={14} strokeWidth={2} /><span>{hotel.so_sao ? `${hotel.so_sao} sao` : 'Chưa xếp hạng'}</span></li>
              <li><Calendar size={14} strokeWidth={2} /><span>Đăng ký: {formatDate(hotel.ngay_tao)}</span></li>
            </ul>
            <p className="admin-hotel-detail-hero-address">{hotel.dia_chi || '—'}</p>
            <HotelStatusNotice hotel={hotel} />
          </div>
        </div>
        <div className="admin-user-detail-hero-side">
          <p><span>Mã khách sạn:</span> <strong>#{hotel.ma_khach_san}</strong></p>
          <p><span>Đối tác:</span> <strong>{partner?.ten_cong_ty || '—'}</strong></p>
          <p><span>Ngày duyệt:</span> <strong>{formatUpdateTime(hotel.ngay_duyet)}</strong></p>
        </div>
      </div>

      <SummaryStats items={statItems} />

      <section className="content-card admin-user-detail-panel">
        <DetailTabs tabs={HOTEL_TABS} activeTab={currentTab} onChange={setActiveTab} />

        {currentTab === 'overview' && (
          <div className="admin-user-detail-tab-panel">
            <DetailTable
              rows={[
                { label: 'Mã khách sạn', value: `#${hotel.ma_khach_san}` },
                { label: 'Tên khách sạn', value: hotel.ten },
                { label: 'Địa điểm', value: hotel.dia_diem?.ten_dia_diem || '—' },
                { label: 'Địa chỉ', value: hotel.dia_chi || '—' },
                { label: 'Hạng sao', value: hotel.so_sao ? `${hotel.so_sao} sao` : '—' },
                { label: 'Giờ nhận phòng', value: formatTime(hotel.gio_nhan_phong) },
                { label: 'Giờ trả phòng', value: formatTime(hotel.gio_tra_phong) },
                { label: 'Mô tả', value: hotel.mo_ta?.trim() || '—' },
                { label: 'Ngày đăng ký', value: formatDateTime(hotel.ngay_tao) },
                { label: 'Ngày duyệt', value: formatDateTime(hotel.ngay_duyet) },
                {
                  label: 'Hoa hồng',
                  value: partner?.phan_tram_hoa_hong != null
                    ? `${partner.phan_tram_hoa_hong}%`
                    : '—',
                },
              ]}
            />
          </div>
        )}


        {currentTab === 'status' && (
          <div className="admin-user-detail-tab-panel">
            <DetailTable
              rows={[
                {
                  label: 'Trạng thái khách sạn',
                  value: <span className={`badge ${st.cls}`}>{st.label}</span>,
                },
                {
                  label: 'Khóa do đối tác',
                  value: partnerLocked ? 'Có' : 'Không',
                },
                {
                  label: 'Lý do từ chối / yêu cầu sửa',
                  value: hotel.ly_do_tu_choi?.trim() || '—',
                },
                {
                  label: 'Lý do khóa',
                  value: hotel.ly_do_khoa?.trim() || '—',
                },
                { label: 'Ngày duyệt', value: formatDateTime(hotel.ngay_duyet) },
                { label: 'Ngày cập nhật gần nhất', value: formatDateTime(hotel.ngay_tao) },
              ]}
            />
            <div className="admin-hotel-detail-status-actions">
              <TableActions>
                {hotel.trang_thai === 'cho_duyet' && (
                  <>
                    <ActionButton variant="approve" disabled={actionLoading} onClick={() => handleAction('approve')}>
                      {actionLoading ? '...' : 'Duyệt'}
                    </ActionButton>
                    <ActionButton variant="reject" disabled={actionLoading} onClick={() => handleAction('reject')}>
                      Từ chối
                    </ActionButton>
                  </>
                )}
                {hotel.trang_thai === 'hoat_dong' && (
                  <ActionButton variant="lock" disabled={actionLoading} onClick={() => handleAction('lock')}>
                    Khóa
                  </ActionButton>
                )}
                {hotel.trang_thai === 'bi_khoa' && (
                  <ActionButton
                    variant="unlock"
                    disabled={actionLoading || partnerLocked}
                    title={partnerLocked ? 'Bị khóa do đối tác' : undefined}
                    onClick={() => handleAction('unlock')}
                  >
                    Mở khóa
                  </ActionButton>
                )}
              </TableActions>
            </div>
          </div>
        )}

        {currentTab === 'images' && (
          <div className="admin-user-detail-tab-panel">
            <div className="admin-hotel-detail-gallery">
              <div className="admin-hotel-detail-main-view">
                {currentImg ? (
                  <img src={resolveUploadUrl(currentImg.url)} alt={hotel.ten} />
                ) : (
                  <div className="admin-hotel-detail-main-view--empty">Chưa có ảnh</div>
                )}
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="admin-hotel-detail-nav admin-hotel-detail-nav--prev"
                      onClick={prevImg}
                      aria-label="Ảnh trước"
                    >
                      <ChevronLeft size={22} />
                    </button>
                    <button
                      type="button"
                      className="admin-hotel-detail-nav admin-hotel-detail-nav--next"
                      onClick={nextImg}
                      aria-label="Ảnh sau"
                    >
                      <ChevronRight size={22} />
                    </button>
                  </>
                )}
              </div>
              {images.length > 0 && (
                <div className="admin-hotel-detail-thumb-row">
                  {images.map((img, i) => (
                    <button
                      key={img.ma_hinh_anh || i}
                      type="button"
                      className={`admin-hotel-detail-thumb${i === activeImg ? ' active' : ''}`}
                      onClick={() => setActiveImg(i)}
                    >
                      <img src={resolveUploadUrl(img.url)} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {currentTab === 'rooms' && (
          <div className="admin-user-detail-tab-panel">
            {!hotel.loai_phong?.length ? (
              <p className="empty-state-text">Chưa có loại phòng</p>
            ) : (
              <>
                <div className="mgmt-table-scroll">
                  <table className="data-table data-table-grid admin-mgmt-table">
                    <thead>
                      <tr>
                        <th>Tên loại phòng</th>
                        <th>Giá cơ bản</th>
                        <th>Sức chứa</th>
                        <th>Tổng phòng</th>
                        <th>Đang mở bán</th>
                        <th>Trạng thái</th>
                        <th>Ngày tạo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedTabItems.map((room) => {
                        const roomSt = getAdminRoomTypeStatus(room.trang_thai, { hotelStatus: hotel.trang_thai });
                        return (
                          <tr
                            key={room.ma_loai_phong}
                            className="admin-hotel-detail-row-link"
                            onClick={() => navigate(`/admin/room-types/hotels/${hotel.ma_khach_san}`)}
                          >
                            <td className="admin-cell-name">{room.ten_loai}</td>
                            <td>{formatCurrency(room.gia_co_ban)}</td>
                            <td>{room.suc_chua ?? '—'}</td>
                            <td>{room.so_luong_phong ?? '—'}</td>
                            <td>{room.so_luong_mo_ban ?? '—'}</td>
                            <td><span className={`badge ${roomSt.badgeCls}`}>{roomSt.label}</span></td>
                            <td>{formatDate(room.ngay_tao)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {showTabPagination && (
                  <ListPagination
                    total={activeTabList.length}
                    currentPage={tabPage}
                    totalPages={tabTotalPages}
                    rangeFrom={tabRangeFrom}
                    rangeTo={tabRangeTo}
                    pageNumbers={tabPageNumbers}
                    onPageChange={setTabPage}
                  />
                )}
              </>
            )}
          </div>
        )}

        {currentTab === 'amenities' && (
          <div className="admin-user-detail-tab-panel">
            {amenityGroups.length === 0 ? (
              <p className="empty-state-text">Chưa có tiện nghi</p>
            ) : (
              <div className="admin-hotel-detail-amenities">
                <div className="partner-room-detail-block-title">
                  <Sparkles size={15} strokeWidth={1.75} />
                  Tiện nghi khách sạn
                </div>
                <div className="partner-room-detail-amenity-groups">
                  {amenityGroups.map((group) => (
                    <div key={group.id} className="partner-room-detail-amenity-group">
                      <h4 className="partner-room-detail-amenity-group-title">{group.label}</h4>
                      <div className="partner-room-detail-amenity-list">
                        {group.items.map((item) => (
                          <span key={item.ma_tien_nghi} className="partner-room-detail-amenity-tag">
                            {item.ten}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentTab === 'bookings' && (
          <div className="admin-user-detail-tab-panel">
            {!hotel.dat_phong?.length ? (
              <p className="empty-state-text">Chưa có đơn đặt phòng</p>
            ) : (
              <>
                <div className="mgmt-table-scroll">
                  <table className="data-table data-table-grid admin-mgmt-table">
                    <thead>
                      <tr>
                        <th>Mã đơn</th>
                        <th>Khách hàng</th>
                        <th>Loại phòng</th>
                        <th>Check-in</th>
                        <th>Check-out</th>
                        <th>Tổng tiền</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedTabItems.map((booking) => {
                        const bookingSt = TRANG_THAI[booking.trang_thai]
                          || { label: booking.trang_thai, cls: 'badge-default' };
                        return (
                          <tr key={booking.ma_dat_phong}>
                            <td className="admin-cell-id">{booking.ma_don_hang}</td>
                            <td>{booking.khach_hang?.ho_ten || '—'}</td>
                            <td>{booking.loai_phong?.ten_loai || '—'}</td>
                            <td>{formatDate(booking.ngay_nhan_phong)}</td>
                            <td>{formatDate(booking.ngay_tra_phong)}</td>
                            <td style={{ fontWeight: 600 }}>{formatCurrency(booking.thanh_toan_cuoi)}</td>
                            <td><span className={`badge ${bookingSt.cls}`}>{bookingSt.label}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {showTabPagination && (
                  <ListPagination
                    total={activeTabList.length}
                    currentPage={tabPage}
                    totalPages={tabTotalPages}
                    rangeFrom={tabRangeFrom}
                    rangeTo={tabRangeTo}
                    pageNumbers={tabPageNumbers}
                    onPageChange={setTabPage}
                  />
                )}
              </>
            )}
          </div>
        )}

        {currentTab === 'reviews' && (
          <div className="admin-user-detail-tab-panel">
            {!hotel.danh_gia?.length ? (
              <p className="empty-state-text">Chưa có đánh giá</p>
            ) : (
              <>
                <div className="mgmt-table-scroll">
                  <table className="data-table data-table-grid admin-mgmt-table">
                    <thead>
                      <tr>
                        <th>Mã</th>
                        <th>Khách hàng</th>
                        <th>Loại phòng</th>
                        <th>Điểm</th>
                        <th>Nội dung</th>
                        <th>Phản hồi ĐT</th>
                        <th>Ngày ĐG</th>
                        <th>TT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedTabItems.map((review) => {
                        const reviewSt = REVIEW_BADGE[review.trang_thai]
                          || { label: review.trang_thai, cls: 'badge-default' };
                        return (
                          <tr key={review.ma_danh_gia}>
                            <td className="admin-cell-id">#{review.ma_danh_gia}</td>
                            <td>{review.khach_hang?.ho_ten || '—'}</td>
                            <td>{review.dat_phong?.loai_phong?.ten_loai || '—'}</td>
                            <td><span className="admin-review-score">{review.so_sao}/5</span></td>
                            <td className="admin-review-content">{review.noi_dung?.trim() || '—'}</td>
                            <td className="admin-review-content">{review.phan_hoi_doi_tac?.trim() || '—'}</td>
                            <td className="admin-review-date">{formatDate(review.ngay_danh_gia)}</td>
                            <td><span className={`badge ${reviewSt.cls}`}>{reviewSt.label}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {showTabPagination && (
                  <ListPagination
                    total={activeTabList.length}
                    currentPage={tabPage}
                    totalPages={tabTotalPages}
                    rangeFrom={tabRangeFrom}
                    rangeTo={tabRangeTo}
                    pageNumbers={tabPageNumbers}
                    onPageChange={setTabPage}
                  />
                )}
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default HotelDetailPage;

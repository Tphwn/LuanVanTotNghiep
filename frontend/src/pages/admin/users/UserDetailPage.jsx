import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Mail, Phone } from 'lucide-react';
import adminUserService from '../../../services/adminUserService';
import BackButton from '../../../components/common/BackButton';
import SummaryStats from '../../../components/common/management/SummaryStats';
import ListPagination from '../../../components/common/management/ListPagination';
import useListPagination from '../../../hooks/useListPagination';
import { TRANG_THAI, formatCurrency, formatDate } from '../../../utils/bookingDisplay';
import {
  ACCOUNT_BADGE,
  REVIEW_BADGE,
  HOTEL_BADGE,
} from '../../../constants/statusConfig';

const PAGE_SIZE = 10;

const ROLE_LABEL = {
  khach_hang: { label: 'Khách hàng', cls: 'admin-user-detail-role--customer' },
  doi_tac: { label: 'Đối tác', cls: 'admin-user-detail-role--partner' },
};

const formatUpdateTime = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${time} ${d.toLocaleDateString('vi-VN')}`;
};

const getNameInitial = (name) => {
  if (!name || name === 'Chưa cập nhật') return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const word = parts[parts.length - 1] || parts[0];
  return word[0]?.toUpperCase() || '?';
};

const getPartner = (user) => user?.doi_tac_doi_tac_ma_nguoi_dungTonguoi_dung;

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

export default function UserDetailPage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('');

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await adminUserService.getUserById(id);
        if (isMounted) setUser(res.data.data);
      } catch (err) {
        if (isMounted) {
          setUser(null);
          setError(err.response?.data?.message || 'Không tải được thông tin người dùng');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    if (id) load();
    return () => { isMounted = false; };
  }, [id]);

  const isCustomer = user?.vai_tro === 'khach_hang';
  const isPartner = user?.vai_tro === 'doi_tac';
  const customer = user?.khach_hang;
  const partner = getPartner(user);
  const roleInfo = ROLE_LABEL[user?.vai_tro] || { label: user?.vai_tro, cls: '' };

  const displayName = isCustomer
    ? customer?.ho_ten
    : isPartner
      ? partner?.ten_cong_ty
      : 'Admin';

  const accountStatus = ACCOUNT_BADGE[user?.trang_thai] || { label: user?.trang_thai, cls: 'badge-default' };

  const customerStatItems = useMemo(() => {
    const bookings = customer?.dat_phong || [];
    return [
      { label: 'Tổng đơn', value: bookings.length },
      { label: 'Hoàn thành', value: bookings.filter((b) => b.trang_thai === 'hoan_thanh').length, tone: 'success' },
      {
        label: 'Đang xử lý',
        value: bookings.filter((b) => ['cho_xac_nhan', 'da_xac_nhan', 'da_checkin'].includes(b.trang_thai)).length,
        tone: 'info',
      },
      {
        label: 'Đã hủy',
        value: bookings.filter((b) => ['da_huy', 'tu_choi'].includes(b.trang_thai)).length,
        tone: 'danger',
      },
    ];
  }, [customer]);

  const partnerStatItems = useMemo(() => {
    const hotels = partner?.khach_san || [];
    const choDuyet = hotels.filter((h) => h.trang_thai === 'cho_duyet').length;
    const doanhThu = user?.thong_ke_doi_tac?.tong_doanh_thu ?? 0;
    return [
      { label: 'Đơn', value: user?.thong_ke_doi_tac?.tong_don_dat ?? 0 },
      { label: 'Doanh thu', value: doanhThu ? formatCurrency(doanhThu) : '0 ₫' },
      { label: 'Khách sạn', value: hotels.length },
      { label: 'Khách sạn chờ duyệt', value: choDuyet, tone: 'warning' },
    ];
  }, [partner, user]);

  const customerTabs = useMemo(() => [
    { id: 'bookings', label: 'Đơn đặt phòng' },
    { id: 'reviews', label: 'Đánh giá đã viết' },
  ], []);

  const partnerTabs = useMemo(() => [
    { id: 'hotels', label: 'Khách sạn sở hữu' },
    { id: 'reviews', label: 'Đánh giá về khách sạn' },
  ], []);

  const tabs = isCustomer ? customerTabs : isPartner ? partnerTabs : [];
  const defaultTabId = isCustomer ? 'bookings' : isPartner ? 'hotels' : '';
  const currentTab = tabs.some((t) => t.id === activeTab) ? activeTab : defaultTabId;

  const partnerReviews = useMemo(() => user?.danh_gia_doi_tac || [], [user?.danh_gia_doi_tac]);

  const activeTabList = useMemo(() => {
    if (isCustomer && currentTab === 'bookings') return customer?.dat_phong || [];
    if (isCustomer && currentTab === 'reviews') return customer?.danh_gia || [];
    if (isPartner && currentTab === 'hotels') return partner?.khach_san || [];
    if (isPartner && currentTab === 'reviews') return partnerReviews;
    return [];
  }, [isCustomer, isPartner, currentTab, customer, partner, partnerReviews]);

  const {
    pagedItems: pagedTabItems,
    currentPage: tabPage,
    totalPages: tabTotalPages,
    setPage: setTabPage,
    pageNumbers: tabPageNumbers,
    rangeFrom: tabRangeFrom,
    rangeTo: tabRangeTo,
    showPagination: showTabPagination,
  } = useListPagination(activeTabList, PAGE_SIZE, [currentTab, user?.ma_nguoi_dung]);

  if (loading) {
    return (
      <div className="mgmt-page admin-user-detail-page">
        <div className="admin-user-detail-loading">Đang tải...</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="mgmt-page admin-user-detail-page">
        <BackButton to="/admin/users" />
        <div className="content-card admin-user-detail-section" style={{ marginTop: 16 }}>
          <p className="empty-state-text">{error || 'Không tìm thấy người dùng'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mgmt-page admin-user-detail-page">
      <div className="admin-user-detail-top">
        <BackButton to="/admin/users" />
      </div>

      <div className="admin-user-detail-hero content-card">
        <div className="admin-user-detail-hero-main">
          <div className="admin-user-detail-avatar" aria-hidden>
            {getNameInitial(displayName)}
          </div>
          <div className="admin-user-detail-hero-body">
            <div className="admin-user-detail-hero-title-row">
              <h1 className="admin-user-detail-name">{displayName || 'Chưa cập nhật'}</h1>
              <span className={`admin-user-detail-role ${roleInfo.cls}`}>{roleInfo.label}</span>
              <span className={`badge ${accountStatus.cls}`}>{accountStatus.label}</span>
            </div>
            <ul className="admin-user-detail-hero-meta">
              <li><Mail size={14} strokeWidth={2} /><span>{user.email}</span></li>
              <li><Phone size={14} strokeWidth={2} /><span>{user.so_dien_thoai || '—'}</span></li>
              <li><Calendar size={14} strokeWidth={2} /><span>Tham gia: {formatDate(user.ngay_tao)}</span></li>
            </ul>
          </div>
        </div>
        <div className="admin-user-detail-hero-side">
          <p><span>Mã tài khoản:</span> <strong>#{user.ma_nguoi_dung}</strong></p>
          <p><span>Cập nhật:</span> <strong>{formatUpdateTime(user.dang_nhap_cuoi)}</strong></p>
        </div>
      </div>

      {isCustomer && customer && <SummaryStats items={customerStatItems} />}

      {isPartner && partner && <SummaryStats items={partnerStatItems} />}

      {tabs.length > 0 && (
        <section className="content-card admin-user-detail-panel">
          <DetailTabs tabs={tabs} activeTab={currentTab} onChange={setActiveTab} />

          {isCustomer && currentTab === 'bookings' && (
            <div className="admin-user-detail-tab-panel">
              {!customer.dat_phong?.length ? (
                <p className="empty-state-text">Chưa có đơn đặt phòng</p>
              ) : (
                <>
                  <div className="mgmt-table-scroll">
                    <table className="data-table data-table-grid admin-mgmt-table">
                      <thead>
                        <tr>
                          <th>Mã đơn</th>
                          <th>Khách sạn</th>
                          <th>Loại phòng</th>
                          <th>Check-in</th>
                          <th>Check-out</th>
                          <th>Tổng tiền</th>
                          <th>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedTabItems.map((booking) => {
                          const st = TRANG_THAI[booking.trang_thai] || { label: booking.trang_thai, cls: 'badge-default' };
                          return (
                            <tr key={booking.ma_dat_phong}>
                              <td className="admin-cell-id">{booking.ma_don_hang}</td>
                              <td>{booking.loai_phong?.khach_san?.ten || '—'}</td>
                              <td>{booking.loai_phong?.ten_loai || '—'}</td>
                              <td>{formatDate(booking.ngay_nhan_phong)}</td>
                              <td>{formatDate(booking.ngay_tra_phong)}</td>
                              <td style={{ fontWeight: 600 }}>{formatCurrency(booking.thanh_toan_cuoi)}</td>
                              <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
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

          {isCustomer && currentTab === 'reviews' && (
            <div className="admin-user-detail-tab-panel">
              {!customer.danh_gia?.length ? (
                <p className="empty-state-text">Chưa có đánh giá</p>
              ) : (
                <>
                  <div className="mgmt-table-scroll">
                    <table className="data-table data-table-grid admin-mgmt-table">
                      <thead>
                        <tr>
                          <th>Mã</th>
                          <th>Khách sạn</th>
                          <th>Loại phòng</th>
                          <th>Điểm</th>
                          <th>Nội dung</th>
                          <th>Ngày ĐG</th>
                          <th>TT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedTabItems.map((review) => {
                          const st = REVIEW_BADGE[review.trang_thai] || { label: review.trang_thai, cls: 'badge-default' };
                          return (
                            <tr key={review.ma_danh_gia}>
                              <td className="admin-cell-id">#{review.ma_danh_gia}</td>
                              <td>{review.dat_phong?.loai_phong?.khach_san?.ten || '—'}</td>
                              <td>{review.dat_phong?.loai_phong?.ten_loai || '—'}</td>
                              <td><span className="admin-review-score">{review.so_sao}/5</span></td>
                              <td className="admin-review-content">{review.noi_dung?.trim() || '—'}</td>
                              <td className="admin-review-date">{formatDate(review.ngay_danh_gia)}</td>
                              <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
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

          {isPartner && currentTab === 'hotels' && (
            <div className="admin-user-detail-tab-panel">
              {!partner.khach_san?.length ? (
                <p className="empty-state-text">Chưa có khách sạn</p>
              ) : (
                <>
                  <div className="mgmt-table-scroll">
                    <table className="data-table data-table-grid admin-mgmt-table">
                      <thead>
                        <tr>
                          <th>Tên khách sạn</th>
                          <th>Thành phố</th>
                          <th>Loại hình</th>
                          <th>Trạng thái duyệt</th>
                          <th>Hạng sao</th>
                          <th>Ngày tạo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedTabItems.map((hotel) => {
                          const st = HOTEL_BADGE[hotel.trang_thai]
                            || { label: hotel.trang_thai, cls: 'badge-default' };
                          return (
                            <tr key={hotel.ma_khach_san}>
                              <td className="admin-cell-name">{hotel.ten}</td>
                              <td>{hotel.dia_diem?.ten_dia_diem || '—'}</td>
                              <td>Khách sạn</td>
                              <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                              <td>{hotel.so_sao ? `${hotel.so_sao} sao` : '—'}</td>
                              <td>{formatDate(hotel.ngay_tao)}</td>
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

          {isPartner && currentTab === 'reviews' && (
            <div className="admin-user-detail-tab-panel">
              {!partnerReviews.length ? (
                <p className="empty-state-text">Chưa có đánh giá về khách sạn</p>
              ) : (
                <>
                  <div className="mgmt-table-scroll">
                    <table className="data-table data-table-grid admin-mgmt-table">
                      <thead>
                        <tr>
                          <th>Mã</th>
                          <th>Khách hàng</th>
                          <th>Khách sạn</th>
                          <th>Loại phòng</th>
                          <th>Điểm</th>
                          <th>Nội dung</th>
                          <th>Ngày ĐG</th>
                          <th>TT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedTabItems.map((review) => {
                          const st = REVIEW_BADGE[review.trang_thai] || { label: review.trang_thai, cls: 'badge-default' };
                          return (
                            <tr key={review.ma_danh_gia}>
                              <td className="admin-cell-id">#{review.ma_danh_gia}</td>
                              <td>{review.khach_hang?.ho_ten || '—'}</td>
                              <td>{review.dat_phong?.loai_phong?.khach_san?.ten || '—'}</td>
                              <td>{review.dat_phong?.loai_phong?.ten_loai || '—'}</td>
                              <td><span className="admin-review-score">{review.so_sao}/5</span></td>
                              <td className="admin-review-content">{review.noi_dung?.trim() || '—'}</td>
                              <td className="admin-review-date">{formatDate(review.ngay_danh_gia)}</td>
                              <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
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
      )}
    </div>
  );
}

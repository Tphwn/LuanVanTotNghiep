import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Eye } from 'lucide-react';
import api from '../../../services/api';
import ActionButton, { ActionCell } from '../../../components/common/ActionButton';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import FilterActions from '../../../components/common/management/FilterActions';
import SummaryStats from '../../../components/common/management/SummaryStats';
import ListPagination from '../../../components/common/management/ListPagination';
import useListPagination from '../../../hooks/useListPagination';
import AdminReviewConfirmModal from './components/AdminReviewConfirmModal';
import AdminReviewDetailModal from './components/AdminReviewDetailModal';
import { REVIEW_BADGE } from '../../../constants/statusConfig';

const PAGE_SIZE = 10;

const EMPTY_STATS = {
  diem_trung_binh: 0,
  tong_danh_gia: 0,
  hien_thi: 0,
  an: 0,
  bi_bao_cao: 0,
};

const StarScore = ({ value }) => (
  <span className="admin-review-score">{Math.round(value || 0)}/5</span>
);

const TIME_PRESETS = [
  { value: 'all', label: 'Tất cả thời gian' },
  { value: '7', label: '7 ngày qua' },
  { value: '30', label: '30 ngày qua' },
  { value: 'custom', label: 'Tùy chọn' },
];

const getDateRange = (preset, customFrom, customTo) => {
  if (preset === 'all') return {};
  if (preset === 'custom') {
    const r = {};
    if (customFrom) r.tu_ngay = customFrom;
    if (customTo) r.den_ngay = customTo;
    return r;
  }
  const days = Number(preset);
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { tu_ngay: from.toISOString().slice(0, 10) };
};

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');

const truncate = (text, len = 60) => {
  if (!text) return '—';
  return text.length > len ? `${text.slice(0, len)}...` : text;
};

const formatAvgScore = (score) => {
  if (!score) return '0/5';
  const rounded = Number.isInteger(score) ? score : Number(score.toFixed(1));
  return `${rounded}/5`;
};

const ReviewsPage = () => {
  const [hotels, setHotels] = useState([]);
  const [partners, setPartners] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [danhSach, setDanhSach] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [partnerFilter, setPartnerFilter] = useState('');
  const [hotelFilter, setHotelFilter] = useState('');
  const [starFilter, setStarFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timePreset, setTimePreset] = useState('all');
  const [tuNgay, setTuNgay] = useState('');
  const [denNgay, setDenNgay] = useState('');

  const [detailReview, setDetailReview] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const skipFilterReload = useRef(true);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    let isMounted = true;

    const loadInitial = async () => {
      setLoadingMeta(true);
      setLoading(true);
      try {
        const res = await api.get('/admin/reviews');
        if (!isMounted) return;
        setHotels(res.data.hotels || []);
        setPartners(res.data.partners || []);
        const payload = res.data.data || {};
        setStats(payload.stats || EMPTY_STATS);
        setDanhSach(payload.danh_sach || []);
      } catch (err) {
        if (isMounted) {
          showToast(err.response?.data?.message || 'Không tải được dữ liệu đánh giá', 'error');
        }
      } finally {
        if (isMounted) {
          setLoadingMeta(false);
          setLoading(false);
        }
      }
    };

    loadInitial();
    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hotelOptions = useMemo(() => hotels.filter((hotel) => {
    if (!partnerFilter) return true;
    return String(hotel.ma_doi_tac) === partnerFilter;
  }), [hotels, partnerFilter]);

  const loadReviews = useCallback(async () => {
    if (loadingMeta) return;

    setLoading(true);
    try {
      const params = { ...getDateRange(timePreset, tuNgay, denNgay) };
      if (hotelFilter) params.ma_khach_san = hotelFilter;
      else if (partnerFilter) params.ma_doi_tac = partnerFilter;
      if (starFilter !== 'all') params.so_sao = starFilter;
      if (statusFilter !== 'all') params.trang_thai = statusFilter;

      const res = await api.get('/admin/reviews', { params });
      const payload = res.data.data || {};
      setStats(payload.stats || EMPTY_STATS);
      setDanhSach(payload.danh_sach || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi tải đánh giá', 'error');
      setStats(EMPTY_STATS);
      setDanhSach([]);
    } finally {
      setLoading(false);
    }
  }, [
    partnerFilter,
    hotelFilter,
    starFilter,
    statusFilter,
    timePreset,
    tuNgay,
    denNgay,
    loadingMeta,
  ]);

  useEffect(() => {
    if (loadingMeta) return;
    if (skipFilterReload.current) {
      skipFilterReload.current = false;
      return;
    }
    loadReviews();
  }, [loadReviews, loadingMeta]);

  const handlePartnerChange = (value) => {
    setPartnerFilter(value);
    if (!value || !hotelFilter) return;
    const hotelStillValid = hotels.some(
      (h) => String(h.ma_khach_san) === hotelFilter
        && String(h.ma_doi_tac) === value,
    );
    if (!hotelStillValid) setHotelFilter('');
  };

  const handleRequestAction = (review, action) => {
    setConfirmTarget({ review, action });
  };

  const handleConfirmAction = async (lyDo) => {
    if (!confirmTarget) return;
    const { review, action } = confirmTarget;

    const endpoints = {
      'hide-review': { method: 'patch', url: `/admin/reviews/${review.ma_danh_gia}/hide`, body: { ly_do: lyDo } },
      'show-review': { method: 'patch', url: `/admin/reviews/${review.ma_danh_gia}/show` },
      'hide-response': {
        method: 'patch',
        url: `/admin/reviews/${review.ma_danh_gia}/hide-partner-response`,
        body: { ly_do: lyDo },
      },
      'show-response': {
        method: 'patch',
        url: `/admin/reviews/${review.ma_danh_gia}/show-partner-response`,
      },
    };

    const req = endpoints[action];
    if (!req) return;

    setActionLoading(true);
    try {
      const res = req.body
        ? await api.patch(req.url, req.body)
        : await api.patch(req.url);
      showToast(res.data.message || 'Thành công');
      const updated = res.data.data;
      setDetailReview((prev) => (prev?.ma_danh_gia === review.ma_danh_gia ? updated : prev));
      setConfirmTarget(null);
      await loadReviews();
    } catch (err) {
      showToast(err.response?.data?.message || 'Thao tác thất bại', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const clearFilters = () => {
    setPartnerFilter('');
    setHotelFilter('');
    setStarFilter('all');
    setStatusFilter('all');
    setTimePreset('all');
    setTuNgay('');
    setDenNgay('');
  };

  const hasActiveFilters = Boolean(partnerFilter)
    || Boolean(hotelFilter)
    || starFilter !== 'all'
    || statusFilter !== 'all'
    || timePreset !== 'all';

  const emptyListMessage = (() => {
    if (statusFilter === 'an' && !partnerFilter && !hotelFilter && starFilter === 'all' && timePreset === 'all') {
      return 'Danh sách đánh giá đã ẩn trống';
    }
    if (statusFilter === 'hien_thi' && !partnerFilter && !hotelFilter && starFilter === 'all' && timePreset === 'all') {
      return 'Danh sách đánh giá đang hiển thị trống';
    }
    if (hasActiveFilters) return 'Không tìm thấy đánh giá phù hợp';
    return 'Chưa có đánh giá nào';
  })();

  const statItems = useMemo(() => [
    { label: 'Tổng đánh giá', value: stats.tong_danh_gia ?? 0 },
    { label: 'Điểm trung bình', value: formatAvgScore(stats.diem_trung_binh) },
    { label: 'Đang hiển thị', value: stats.hien_thi ?? 0, tone: 'success' },
    { label: 'Đã ẩn', value: stats.an ?? 0, tone: 'muted' },
  ], [stats]);

  const {
    pagedItems: pagedReviews,
    currentPage,
    totalPages,
    setPage,
    pageNumbers,
    rangeFrom,
    rangeTo,
    showPagination,
  } = useListPagination(danhSach, PAGE_SIZE, [
    partnerFilter, hotelFilter, starFilter, statusFilter, timePreset, tuNgay, denNgay,
  ]);

  if (loadingMeta) {
    return (
      <div className="mgmt-page admin-reviews-page">
        <div className="admin-reviews-loading">Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <div className="mgmt-page admin-reviews-page">
      <ManagementHeader
        title="Quản lý đánh giá"
        subtitle="Danh sách đánh giá của tất cả khách sạn trên hệ thống"
      />

      {toast && (
        <div className={`mgmt-toast ${toast.type === 'success' ? 'success' : 'error'}`}>
          {toast.msg}
        </div>
      )}

      <SummaryStats items={statItems} />

      <div className="mgmt-toolbar mgmt-toolbar--filters admin-reviews-filters">
        <div className="mgmt-filter-field">
          <label className="mgmt-filter-label" htmlFor="review-partner-filter">Đối tác</label>
          <select
            id="review-partner-filter"
            className="mgmt-select-inline"
            value={partnerFilter}
            onChange={(e) => handlePartnerChange(e.target.value)}
          >
            <option value="">Tất cả đối tác</option>
            {partners.map((p) => (
              <option key={p.ma_doi_tac} value={String(p.ma_doi_tac)}>{p.ten_cong_ty}</option>
            ))}
          </select>
        </div>

        <div className="mgmt-filter-field">
          <label className="mgmt-filter-label" htmlFor="review-hotel-filter">Khách sạn</label>
          <select
            id="review-hotel-filter"
            className="mgmt-select-inline"
            value={hotelFilter}
            onChange={(e) => setHotelFilter(e.target.value)}
          >
            <option value="">Tất cả khách sạn</option>
            {hotelOptions.map((h) => (
              <option key={h.ma_khach_san} value={String(h.ma_khach_san)}>{h.ten}</option>
            ))}
          </select>
        </div>

        <div className="mgmt-filter-field">
          <label className="mgmt-filter-label" htmlFor="review-star-filter">Số sao</label>
          <select
            id="review-star-filter"
            className="mgmt-select-inline"
            value={starFilter}
            onChange={(e) => setStarFilter(e.target.value)}
          >
            <option value="all">Tất cả sao</option>
            {[5, 4, 3, 2, 1].map((s) => (
              <option key={s} value={s}>{s} sao</option>
            ))}
          </select>
        </div>

        <div className="mgmt-filter-field">
          <label className="mgmt-filter-label" htmlFor="review-status-filter">Trạng thái</label>
          <select
            id="review-status-filter"
            className="mgmt-select-inline"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="hien_thi">Hiển thị</option>
            <option value="an">Đã ẩn</option>
          </select>
        </div>

        <div className="mgmt-filter-field">
          <label className="mgmt-filter-label" htmlFor="review-time-filter">Thời gian</label>
          <select
            id="review-time-filter"
            className="mgmt-select-inline"
            value={timePreset}
            onChange={(e) => setTimePreset(e.target.value)}
          >
            {TIME_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {timePreset === 'custom' && (
          <>
            <div className="mgmt-filter-field">
              <label className="mgmt-filter-label" htmlFor="review-from-date">Từ ngày</label>
              <input
                id="review-from-date"
                type="date"
                className="mgmt-select-inline"
                value={tuNgay}
                onChange={(e) => setTuNgay(e.target.value)}
              />
            </div>
            <div className="mgmt-filter-field">
              <label className="mgmt-filter-label" htmlFor="review-to-date">Đến ngày</label>
              <input
                id="review-to-date"
                type="date"
                className="mgmt-select-inline"
                value={denNgay}
                min={tuNgay}
                onChange={(e) => setDenNgay(e.target.value)}
              />
            </div>
          </>
        )}

        <div className="mgmt-filter-field mgmt-filter-field--action">
          <FilterActions showApply={false} onClear={clearFilters} />
        </div>
      </div>

      <div className="content-card admin-reviews-table-card">
        <div className="content-card-header">
          <h3 className="content-card-title">
            Danh sách đánh giá ({danhSach.length})
          </h3>
        </div>

        {loading ? (
          <div className="admin-reviews-loading">Đang tải...</div>
        ) : danhSach.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">{emptyListMessage}</p>
          </div>
        ) : (
          <>
            <div className="mgmt-table-scroll">
              <table className="data-table data-table-grid admin-mgmt-table admin-reviews-table">
                <thead>
                  <tr>
                    <th style={{ width: 72 }}>Mã</th>
                    <th className="admin-review-customer">Khách hàng</th>
                    <th className="admin-review-hotel">Khách sạn</th>
                    <th className="admin-review-room">Loại phòng</th>
                    <th style={{ width: 72 }}>Điểm</th>
                    <th>Nội dung</th>
                    <th style={{ width: 108 }}>Ngày ĐG</th>
                    <th style={{ width: 120 }}>Trạng thái</th>
                    <th style={{ width: 96 }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedReviews.map((rv) => {
                    const st = REVIEW_BADGE[rv.trang_thai] || { label: rv.trang_thai, cls: 'badge-default' };
                    return (
                      <tr key={rv.ma_danh_gia}>
                        <td className="admin-review-id">#{rv.ma_danh_gia}</td>
                        <td className="admin-review-customer">{rv.khach_hang?.ho_ten || '—'}</td>
                        <td className="admin-review-hotel">{rv.ten_khach_san}</td>
                        <td className="admin-review-room">{rv.ten_loai}</td>
                        <td><StarScore value={rv.so_sao} /></td>
                        <td className="admin-review-content">{truncate(rv.noi_dung)}</td>
                        <td className="admin-review-date">{formatDate(rv.ngay_danh_gia)}</td>
                        <td>
                          <span className={`badge ${st.cls} admin-review-status-badge`}>{st.label}</span>
                        </td>
                        <ActionCell>
                          <ActionButton
                            variant="view"
                            iconOnly
                            icon={Eye}
                            title="Chi tiết"
                            onClick={() => setDetailReview(rv)}
                          />
                        </ActionCell>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {showPagination && (
              <ListPagination
                total={danhSach.length}
                currentPage={currentPage}
                totalPages={totalPages}
                rangeFrom={rangeFrom}
                rangeTo={rangeTo}
                pageNumbers={pageNumbers}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>

      {detailReview && (
        <AdminReviewDetailModal
          review={detailReview}
          onClose={() => setDetailReview(null)}
          onRequestAction={handleRequestAction}
          actionLoading={actionLoading}
        />
      )}

      <AdminReviewConfirmModal
        review={confirmTarget?.review}
        action={confirmTarget?.action}
        loading={actionLoading}
        onClose={() => !actionLoading && setConfirmTarget(null)}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
};

export default ReviewsPage;

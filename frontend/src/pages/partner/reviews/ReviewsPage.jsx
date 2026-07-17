import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import api from '../../../services/api';
import ActionButton, { ActionCell } from '../../../components/common/ActionButton';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import FilterActions from '../../../components/common/management/FilterActions';
import SummaryStats from '../../../components/common/management/SummaryStats';
import ListPagination from '../../../components/common/management/ListPagination';
import useListPagination from '../../../hooks/useListPagination';
import ReviewDetailModal from './components/ReviewDetailModal';
import RespondModal from './components/RespondModal';

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');

const StarScore = ({ value }) => (
  <span className="review-star-score">{value ?? '—'}/5</span>
);

const ReviewsPage = () => {
  const [hotels, setHotels] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [danhSach, setDanhSach] = useState([]);
  const [stats, setStats] = useState({
    tong_danh_gia: 0,
    diem_trung_binh: 0,
    da_phan_hoi: 0,
    chua_phan_hoi: 0,
  });

  const [hotelFilter, setHotelFilter] = useState('');
  const [roomFilter, setRoomFilter] = useState('');
  const [starFilter, setStarFilter] = useState('');
  const [tuNgay, setTuNgay] = useState('');
  const [denNgay, setDenNgay] = useState('');

  const [draftHotelFilter, setDraftHotelFilter] = useState('');
  const [draftRoomFilter, setDraftRoomFilter] = useState('');
  const [draftStarFilter, setDraftStarFilter] = useState('');
  const [draftTuNgay, setDraftTuNgay] = useState('');
  const [draftDenNgay, setDraftDenNgay] = useState('');

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailReview, setDetailReview] = useState(null);

  const [respondOpen, setRespondOpen] = useState(false);
  const [respondReview, setRespondReview] = useState(null);
  const [saving, setSaving] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    api.get('/partner/reviews/hotels').then((res) => {
      setHotels(res.data.data || []);
    });
  }, []);

  useEffect(() => {
    if (!draftHotelFilter) {
      setRoomTypes([]);
      return;
    }
    api.get('/partner/reviews/room-types', { params: { ma_khach_san: draftHotelFilter } })
      .then((res) => setRoomTypes(res.data.data || []));
  }, [draftHotelFilter]);

  useEffect(() => {
    setDraftRoomFilter('');
  }, [draftHotelFilter]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const params = {};
      if (tuNgay) params.tu_ngay = tuNgay;
      if (denNgay) params.den_ngay = denNgay;
      if (hotelFilter) params.ma_khach_san = hotelFilter;
      if (roomFilter) params.ma_loai_phong = roomFilter;
      if (starFilter) params.so_sao = starFilter;

      const res = await api.get('/partner/reviews', { params });
      const data = res.data.data || {};
      setStats(data.stats || {
        tong_danh_gia: 0,
        diem_trung_binh: 0,
        da_phan_hoi: 0,
        chua_phan_hoi: 0,
      });
      setDanhSach(data.danh_sach || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi tải đánh giá', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [hotelFilter, roomFilter, starFilter, tuNgay, denNgay]);

  const applyFilters = () => {
    setHotelFilter(draftHotelFilter);
    setRoomFilter(draftRoomFilter);
    setStarFilter(draftStarFilter);
    setTuNgay(draftTuNgay);
    setDenNgay(draftDenNgay);
  };

  const clearFilters = () => {
    setHotelFilter('');
    setRoomFilter('');
    setStarFilter('');
    setTuNgay('');
    setDenNgay('');
    setDraftHotelFilter('');
    setDraftRoomFilter('');
    setDraftStarFilter('');
    setDraftTuNgay('');
    setDraftDenNgay('');
  };

  const fetchReviewDetail = async (reviewId) => {
    const res = await api.get(`/partner/reviews/${reviewId}`);
    return res.data.data;
  };

  const openDetail = async (reviewId) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailReview(null);
    try {
      const data = await fetchReviewDetail(reviewId);
      setDetailReview(data);
    } catch (err) {
      setDetailOpen(false);
      showToast(err.response?.data?.message || 'Không thể tải chi tiết đánh giá', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetailReview(null);
  };

  const openRespond = (review) => {
    setRespondReview(review);
    setRespondOpen(true);
  };

  const handleRespond = async (text) => {
    if (!respondReview) return;
    setSaving(true);
    try {
      const res = await api.put(`/partner/reviews/${respondReview.ma_danh_gia}/respond`, {
        phan_hoi_doi_tac: text,
      });
      const updated = res.data.data;
      setRespondReview(updated);
      setRespondOpen(false);
      if (detailOpen && detailReview?.ma_danh_gia === updated.ma_danh_gia) {
        setDetailReview(updated);
      }
      await loadReviews();
      showToast('Đã gửi phản hồi thành công');
    } catch (err) {
      showToast(err.response?.data?.message || 'Gửi phản hồi thất bại', 'error');
    } finally {
      setSaving(false);
    }
  };

  const statItems = [
    { label: 'Tổng đánh giá', value: stats.tong_danh_gia ?? 0 },
    { label: 'Điểm trung bình', value: stats.diem_trung_binh ?? 0 },
    { label: 'Đã phản hồi', value: stats.da_phan_hoi ?? 0, tone: 'success' },
    { label: 'Chưa phản hồi', value: stats.chua_phan_hoi ?? 0, tone: 'warning' },
  ];

  const {
    pagedItems: pagedReviews,
    currentPage,
    totalPages,
    setPage,
    pageNumbers,
    rangeFrom,
    rangeTo,
    showPagination,
  } = useListPagination(danhSach, 10, [hotelFilter, roomFilter, starFilter, tuNgay, denNgay]);

  return (
    <div className="mgmt-page">
      <ManagementHeader title="Quản lý đánh giá" />

      {toast && (
        <div className={`mgmt-toast ${toast.type === 'success' ? 'success' : 'error'}`}>
          {toast.msg}
        </div>
      )}

      <div className="partner-reviews-stats">
        <SummaryStats items={statItems} />
      </div>

      <div className="search-bar partner-reviews-filters">
        <select
          className="search-input"
          value={draftHotelFilter}
          onChange={(e) => setDraftHotelFilter(e.target.value)}
        >
          <option value="">Tất cả khách sạn</option>
          {hotels.map((h) => (
            <option key={h.ma_khach_san} value={h.ma_khach_san}>{h.ten}</option>
          ))}
        </select>
        <select
          className="search-input"
          value={draftRoomFilter}
          onChange={(e) => setDraftRoomFilter(e.target.value)}
          disabled={!draftHotelFilter}
        >
          <option value="">Tất cả loại phòng</option>
          {roomTypes.map((r) => (
            <option key={r.ma_loai_phong} value={r.ma_loai_phong}>{r.ten_loai}</option>
          ))}
        </select>
        <select
          className="search-input"
          value={draftStarFilter}
          onChange={(e) => setDraftStarFilter(e.target.value)}
        >
          <option value="">Tất cả sao</option>
          {[5, 4, 3, 2, 1].map((s) => <option key={s} value={s}>{s} sao</option>)}
        </select>
        <input
          type="date"
          className="search-input"
          value={draftTuNgay}
          onChange={(e) => setDraftTuNgay(e.target.value)}
          title="Từ ngày"
        />
        <input
          type="date"
          className="search-input"
          value={draftDenNgay}
          min={draftTuNgay}
          onChange={(e) => setDraftDenNgay(e.target.value)}
          title="Đến ngày"
        />
        <FilterActions onApply={applyFilters} onClear={clearFilters} />
      </div>

      <div className="mgmt-table-card">
        <div className="mgmt-table-card-header">
          <h3 className="mgmt-table-card-title">Danh sách đánh giá ({danhSach.length})</h3>
        </div>

        {loading ? (
          <div className="partner-reviews-loading">Đang tải...</div>
        ) : danhSach.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">Không có đánh giá phù hợp bộ lọc</p>
          </div>
        ) : (
          <>
          <div className="mgmt-table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tên khách hàng</th>
                  <th>Khách sạn</th>
                  <th>Loại phòng</th>
                  <th>Số sao</th>
                  <th>Ngày đánh giá</th>
                  <th className="table-action-cell table-action-cell--compact">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {pagedReviews.map((review) => (
                  <tr key={review.ma_danh_gia}>
                    <td className="partner-review-customer">{review.khach_hang?.ho_ten || 'Khách hàng'}</td>
                    <td>{review.ten_khach_san || '—'}</td>
                    <td>{review.ten_loai || '—'}</td>
                    <td><StarScore value={review.so_sao} /></td>
                    <td className="partner-review-date">{formatDate(review.ngay_danh_gia)}</td>
                    <ActionCell>
                      <ActionButton
                        variant="view"
                        iconOnly
                        icon={Eye}
                        title="Xem chi tiết"
                        onClick={() => openDetail(review.ma_danh_gia)}
                      />
                    </ActionCell>
                  </tr>
                ))}
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

      {detailOpen && (
        <ReviewDetailModal
          review={detailReview}
          loading={detailLoading}
          onClose={closeDetail}
          onRespond={openRespond}
          respondLoading={saving}
        />
      )}

      {respondOpen && (
        <RespondModal
          review={respondReview}
          onClose={() => {
            setRespondOpen(false);
            setRespondReview(null);
          }}
          onSave={handleRespond}
          saving={saving}
        />
      )}
    </div>
  );
};

export default ReviewsPage;

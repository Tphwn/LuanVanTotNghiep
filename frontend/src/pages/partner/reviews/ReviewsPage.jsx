import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import api from '../../../services/api';
import ActionButton, { ActionCell } from '../../../components/common/ActionButton';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import SummaryStats from '../../../components/common/management/SummaryStats';

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');

const StarScore = ({ value }) => (
  <span className="review-star-score">{value ?? '—'}/5</span>
);

const ReviewsPage = () => {
  const navigate = useNavigate();
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

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

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
    if (!hotelFilter) {
      setRoomTypes([]);
      return;
    }
    api.get('/partner/reviews/room-types', { params: { ma_khach_san: hotelFilter } })
      .then((res) => setRoomTypes(res.data.data || []));
  }, [hotelFilter]);

  useEffect(() => {
    setRoomFilter('');
  }, [hotelFilter]);

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

  const statItems = [
    { label: 'Tổng đánh giá', value: stats.tong_danh_gia ?? 0, color: '#1a2e28' },
    { label: 'Điểm trung bình', value: stats.diem_trung_binh ?? 0, color: '#3C7363' },
    { label: 'Đã phản hồi', value: stats.da_phan_hoi ?? 0, color: '#2d8a5e' },
    { label: 'Chưa phản hồi', value: stats.chua_phan_hoi ?? 0, color: '#b36b00' },
  ];

  return (
    <div className="mgmt-page">
      <ManagementHeader
        title="Quản lý Đánh giá"
        subtitle="Theo dõi phản hồi khách hàng và phản hồi đánh giá"
      />

      {toast && (
        <div className={`mgmt-toast ${toast.type === 'success' ? 'success' : 'error'}`}>
          {toast.msg}
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <SummaryStats items={statItems} />
      </div>

      <div className="search-bar" style={{ margin: '16px 0', flexWrap: 'wrap' }}>
        <select
          className="search-input"
          style={{ flex: 1, minWidth: 140 }}
          value={hotelFilter}
          onChange={(e) => setHotelFilter(e.target.value)}
        >
          <option value="">Tất cả khách sạn</option>
          {hotels.map((h) => (
            <option key={h.ma_khach_san} value={h.ma_khach_san}>{h.ten}</option>
          ))}
        </select>
        <select
          className="search-input"
          style={{ flex: 1, minWidth: 140 }}
          value={roomFilter}
          onChange={(e) => setRoomFilter(e.target.value)}
          disabled={!hotelFilter}
        >
          <option value="">Tất cả loại phòng</option>
          {roomTypes.map((r) => (
            <option key={r.ma_loai_phong} value={r.ma_loai_phong}>{r.ten_loai}</option>
          ))}
        </select>
        <select
          className="search-input"
          style={{ flex: 0.8, minWidth: 110 }}
          value={starFilter}
          onChange={(e) => setStarFilter(e.target.value)}
        >
          <option value="">Tất cả sao</option>
          {[5, 4, 3, 2, 1].map((s) => <option key={s} value={s}>{s} sao</option>)}
        </select>
        <input
          type="date"
          className="search-input"
          style={{ flex: 0.8, minWidth: 130 }}
          value={tuNgay}
          onChange={(e) => setTuNgay(e.target.value)}
          title="Từ ngày"
        />
        <input
          type="date"
          className="search-input"
          style={{ flex: 0.8, minWidth: 130 }}
          value={denNgay}
          min={tuNgay}
          onChange={(e) => setDenNgay(e.target.value)}
          title="Đến ngày"
        />
      </div>

      <div className="mgmt-table-card">
        <div className="mgmt-table-card-header">
          <h3 className="mgmt-table-card-title">Danh sách đánh giá ({danhSach.length})</h3>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#5a7a72' }}>Đang tải...</div>
        ) : danhSach.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">Không có đánh giá phù hợp bộ lọc</p>
          </div>
        ) : (
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
                {danhSach.map((review) => (
                  <tr key={review.ma_danh_gia}>
                    <td style={{ fontWeight: 600 }}>{review.khach_hang?.ho_ten || 'Khách hàng'}</td>
                    <td>{review.ten_khach_san || '—'}</td>
                    <td>{review.ten_loai || '—'}</td>
                    <td><StarScore value={review.so_sao} /></td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(review.ngay_danh_gia)}</td>
                    <ActionCell>
                      <ActionButton
                        variant="view"
                        iconOnly
                        icon={Eye}
                        title="Xem chi tiết"
                        onClick={() => navigate(`/partner/reviews/${review.ma_danh_gia}`)}
                      />
                    </ActionCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewsPage;

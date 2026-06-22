import { useEffect, useState } from 'react';
import api from '../../../services/api';
import { MessageSquare } from 'lucide-react';
import ActionButton from '../../../components/common/ActionButton';
import ManagementHeader from '../../../components/common/management/ManagementHeader';

const StarDisplay = ({ value }) => (
  <span style={{ fontSize: 13, fontWeight: 600, color: '#b36b00' }}>
    {Math.round(value || 0)}/5
  </span>
);

const StarBar = ({ phanBoSao, total }) => {
  if (!total) return null;
  return (
    <div style={{ marginTop: 8 }}>
      {phanBoSao.map(({ so_sao, so_luong }) => {
        const pct = Math.round((so_luong / total) * 100);
        return (
          <div key={so_sao} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 12 }}>
            <span style={{ width: 28, color: '#5a7a72'}}>{so_sao} sao</span>
            <div style={{ flex: 1, height: 8, background:'#e8f5f1', borderRadius: 4, overflow: 'hidden'}}>
              <div style={{ width: `${pct}%`, height:'100%', background: '#3C7363', borderRadius: 4 }} />
            </div>
            <span style={{ width: 32, textAlign: 'right', color: '#888'}}>{so_luong}</span>
          </div>
        );
      })}
    </div>
  );
};

const RespondModal = ({ review, onClose, onSave, saving }) => {
  const [text, setText] = useState(review?.phan_hoi_doi_tac ||'');

  if (!review) return null;

  return (
    <div className="modal-overlay"onClick={onClose}>
      <div className="modal-box"style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Phản hồi đánh giá</h3>
          <button type="button"className="modal-close"onClick={onClose}>×</button>
        </div>

        <div style={{
          padding: 14, background: '#f8fdfb', borderRadius: 8,
          border: '1px solid #d4ede6', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <strong style={{ color: '#1a2e28'}}>{review.khach_hang?.ho_ten}</strong>
            <StarDisplay value={review.so_sao} />
          </div>
          <p style={{ margin: 0, fontSize: 14, color:'#555', lineHeight: 1.5 }}>{review.noi_dung || '—'}</p>
        </div>

        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
          Nội dung phản hồi
        </label>
        <textarea
          className="search-input"rows={4}
          style={{ width: '100%', resize: 'vertical', marginBottom: 16 }}
          placeholder="Cảm ơn quý khách đã lưu trú..."value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end'}}>
          <button type="button"className="btn btn-ghost"onClick={onClose}>Hủy</button>
          <button
            type="button"className="btn btn-primary"disabled={saving || !text.trim()}
            onClick={() => onSave(text.trim())}
          >
            {saving ?'Đang gửi...':'Gửi phản hồi'}
          </button>
        </div>
      </div>
    </div>
  );
};

const TIME_PRESETS = [
  { value: 'all', label: 'Tất cả'},
  { value:'7', label: '7 ngày'},
  { value:'30', label: '30 ngày'},
  { value:'90', label: '90 ngày'},
  { value:'custom', label: 'Tùy chọn'},
];

const getDateRange = (preset, customFrom, customTo) => {
  if (preset ==='all') return {};
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

const ReviewsPage = () => {
  const [hotels, setHotels] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [theoLoaiPhong, setTheoLoaiPhong] = useState([]);
  const [danhSach, setDanhSach] = useState([]);

  const [hotelFilter, setHotelFilter] = useState('');
  const [roomFilter, setRoomFilter] = useState('');
  const [starFilter, setStarFilter] = useState('');
  const [replyFilter, setReplyFilter] = useState('');
  const [timePreset, setTimePreset] = useState('all');
  const [tuNgay, setTuNgay] = useState('');
  const [denNgay, setDenNgay] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [respondReview, setRespondReview] = useState(null);

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

  const loadReviews = async () => {
    setLoading(true);
    try {
      const params = {
        ...getDateRange(timePreset, tuNgay, denNgay),
      };
      if (hotelFilter) params.ma_khach_san = hotelFilter;
      const activeRoom = selectedRoom || roomFilter;
      if (activeRoom) params.ma_loai_phong = activeRoom;
      if (starFilter) params.so_sao = starFilter;
      if (replyFilter) params.phan_hoi = replyFilter;

      const res = await api.get('/partner/reviews', { params });
      const data = res.data.data || {};
      setTheoLoaiPhong(data.theo_loai_phong || []);
      setDanhSach(data.danh_sach || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi tải đánh giá', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [hotelFilter, roomFilter, starFilter, replyFilter, timePreset, tuNgay, denNgay, selectedRoom]);

  useEffect(() => {
    setRoomFilter('');
    setSelectedRoom(null);
  }, [hotelFilter]);

  const handleSelectRoomType = (maLoaiPhong) => {
    if (selectedRoom === maLoaiPhong) {
      setSelectedRoom(null);
      setRoomFilter('');
    } else {
      setSelectedRoom(maLoaiPhong);
      setRoomFilter(String(maLoaiPhong));
    }
  };

  const handleRespond = async (text) => {
    if (!respondReview) return;
    setSaving(true);
    try {
      await api.put(`/partner/reviews/${respondReview.ma_danh_gia}/respond`, {
        phan_hoi_doi_tac: text,
      });
      showToast('Đã gửi phản hồi thành công');
      setRespondReview(null);
      await loadReviews();
    } catch (err) {
      showToast(err.response?.data?.message || 'Gửi phản hồi thất bại', 'error');
    } finally {
      setSaving(false);
    }
  };

  const selectedRoomInfo = theoLoaiPhong.find(
    (r) => r.ma_loai_phong === Number(selectedRoom || roomFilter)
  );

  return (
    <div className="mgmt-page">
      <ManagementHeader
        title="Quản lý Đánh giá"
        subtitle="Theo dõi phản hồi khách hàng và phản hồi đánh giá"
      />

      {toast && (
        <div style={{
          background: toast.type === 'success'?'#e8f5f1':'#fff0f0',
          border: `1px solid ${toast.type === 'success'?'#8FD9C4':'#ffb3b3'}`,
          color: toast.type === 'success'?'#3C7363':'#e05c5c',
          padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14,
        }}>
          {toast.type === 'success'?'':''} {toast.msg}
        </div>
      )}

      {/* Filters */}
      <div className="search-bar"style={{ marginBottom: 16, flexWrap:'wrap'}}>
        <select className="search-input"style={{ flex: 1, minWidth: 140 }} value={hotelFilter} onChange={(e) => setHotelFilter(e.target.value)}>
          <option value="">Tất cả khách sạn</option>
          {hotels.map((h) => (
            <option key={h.ma_khach_san} value={h.ma_khach_san}>{h.ten}</option>
          ))}
        </select>
        <select
          className="search-input"style={{ flex: 1, minWidth: 140 }}
          value={roomFilter}
          onChange={(e) => { setRoomFilter(e.target.value); setSelectedRoom(e.target.value || null); }}
          disabled={!hotelFilter}
        >
          <option value="">Tất cả loại phòng</option>
          {roomTypes.map((r) => (
            <option key={r.ma_loai_phong} value={r.ma_loai_phong}>{r.ten_loai}</option>
          ))}
        </select>
        <select className="search-input"style={{ flex: 0.8, minWidth: 110 }} value={starFilter} onChange={(e) => setStarFilter(e.target.value)}>
          <option value="">Tất cả sao</option>
          {[5, 4, 3, 2, 1].map((s) => <option key={s} value={s}>{s} sao</option>)}
        </select>
        <select className="search-input"style={{ flex: 1, minWidth: 130 }} value={replyFilter} onChange={(e) => setReplyFilter(e.target.value)}>
          <option value="">Trạng thái phản hồi</option>
          <option value="chua_phan_hoi">Chưa phản hồi</option>
          <option value="da_phan_hoi">Đã phản hồi</option>
        </select>
        <select className="search-input"style={{ flex: 0.8, minWidth: 110 }} value={timePreset} onChange={(e) => setTimePreset(e.target.value)}>
          {TIME_PRESETS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        {timePreset ==='custom'&& (
          <>
            <input type="date"className="search-input"style={{ flex: 0.8 }} value={tuNgay} onChange={(e) => setTuNgay(e.target.value)} />
            <input type="date"className="search-input"style={{ flex: 0.8 }} value={denNgay} min={tuNgay} onChange={(e) => setDenNgay(e.target.value)} />
          </>
        )}
      </div>

      <div style={{ display:'grid', gridTemplateColumns: '320px 1fr', gap: 20, alignItems: 'start'}}>

        {/* Thống kê theo loại phòng */}
        <div className="content-card">
          <div className="content-card-header">
            <h3 className="content-card-title">Theo loại phòng</h3>
          </div>
          {theoLoaiPhong.length === 0 ? (
            <div style={{ padding: 24, textAlign:'center', color: '#888', fontSize: 13 }}>
              Chưa có đánh giá
            </div>
          ) : (
            <div style={{ maxHeight: 520, overflowY: 'auto'}}>
              {theoLoaiPhong.map((r) => {
                const active = Number(selectedRoom || roomFilter) === r.ma_loai_phong;
                return (
                  <button
                    key={r.ma_loai_phong}
                    type="button"onClick={() => handleSelectRoomType(r.ma_loai_phong)}
                    style={{
                      width:'100%', textAlign: 'left', padding: '12px 16px',
                      border: 'none', borderBottom: '1px solid #f0f0f0',
                      background: active ? '#e8f5f1':'#fff',
                      cursor: 'pointer', transition: 'background 0.15s',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: active ? '#3C7363':'#1a2e28', marginBottom: 4 }}>
                      {r.ten_loai}
                    </div>
                    {!hotelFilter && (
                      <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>{r.ten_khach_san}</div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <div style={{ display:'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 700, color: '#3C7363', fontSize: 16 }}>{r.diem_trung_binh}</span>
                        <StarDisplay value={Math.round(r.diem_trung_binh)} size={12} />
                      </div>
                      <span className="badge badge-info">{r.so_danh_gia} đánh giá</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Danh sách đánh giá */}
        <div className="content-card">
          <div className="content-card-header">
            <h3 className="content-card-title">
              {selectedRoomInfo
                ? `Đánh giá: ${selectedRoomInfo.ten_loai} (${danhSach.length})`
                : `Tất cả đánh giá (${danhSach.length})`}
            </h3>
            {selectedRoomInfo && (
              <button type="button"className="btn btn-ghost btn-sm"onClick={() => { setSelectedRoom(null); setRoomFilter(''); }}>
                Xem tất cả
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#5a7a72'}}> Đang tải...</div>
          ) : danhSach.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-text">Không có đánh giá phù hợp bộ lọc</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection: 'column', gap: 12, maxHeight: 600, overflowY: 'auto', padding: '0 4px'}}>
              {danhSach.map((review) => (
                <div
                  key={review.ma_danh_gia}
                  style={{
                    padding: 16, borderRadius: 10,
                    border:'1px solid #e8f5f1',
                    background: review.da_phan_hoi ? '#fff':'#fffdf8',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#1a2e28', marginBottom: 2 }}>
                        {review.khach_hang?.ho_ten || 'Khách hàng'}
                      </div>
                      <div style={{ fontSize: 12, color: '#888'}}>
                        {review.ten_loai} · {review.ten_khach_san} · {formatDate(review.ngay_danh_gia)}
                      </div>
                    </div>
                    <div style={{ textAlign:'right'}}>
                      <StarDisplay value={review.so_sao} size={15} />
                      <div style={{ marginTop: 4 }}>
                        <span className={`badge ${review.da_phan_hoi ?'badge-success':'badge-warning'}`}>
                          {review.da_phan_hoi ? 'Đã phản hồi':'Chưa phản hồi'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {review.noi_dung && (
                    <p style={{ margin: '0 0 10px', fontSize: 14, color: '#444', lineHeight: 1.6 }}>
                      "{review.noi_dung}"</p>
                  )}

                  {(review.diem_sach_se || review.diem_dich_vu || review.diem_vi_tri) && (
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#5a7a72', marginBottom: 10 }}>
                      {review.diem_sach_se && <span>Sạch sẽ: {review.diem_sach_se}/5</span>}
                      {review.diem_dich_vu && <span>Dịch vụ: {review.diem_dich_vu}/5</span>}
                      {review.diem_vi_tri && <span>Vị trí: {review.diem_vi_tri}/5</span>}
                    </div>
                  )}

                  {review.phan_hoi_doi_tac && (
                    <div style={{
                      padding: '10px 12px', background: '#e8f5f1', borderRadius: 8,
                      borderLeft: '3px solid #3C7363', marginBottom: 10,
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#3C7363', marginBottom: 4 }}>
                        Phản hồi của bạn · {formatDate(review.ngay_phan_hoi)}
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: '#444'}}>{review.phan_hoi_doi_tac}</p>
                    </div>
                  )}

                  <div style={{ display:'flex', justifyContent: 'flex-end'}}>
                    <ActionButton
                      variant="reply"
                      iconOnly
                      icon={MessageSquare}
                      title={review.da_phan_hoi ? 'Sửa phản hồi' : 'Phản hồi'}
                      onClick={() => setRespondReview(review)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {respondReview && (
        <RespondModal
          review={respondReview}
          onClose={() => setRespondReview(null)}
          onSave={handleRespond}
          saving={saving}
        />
      )}
    </div>
  );
};

export default ReviewsPage;

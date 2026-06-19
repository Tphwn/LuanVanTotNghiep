import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Eye, Pencil } from 'lucide-react';
import {
  fetchMyHotels, fetchDiaDiem, fetchAmenitiesForHotel,
  createHotel, updateHotel, clearMsg,
} from '../../../store/slices/partnerHotelSlice';
import { resolveUploadUrl } from '../../../utils/media';
import ActionButton, { ActionCell } from '../../../components/common/ActionButton';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import SummaryStats from '../../../components/common/management/SummaryStats';
import SearchBar from '../../../components/common/management/SearchBar';
import FilterTabs from '../../../components/common/management/FilterTabs';
import ToggleSwitch from '../../../components/common/management/ToggleSwitch';
import StarRating from '../../../components/common/management/StarRating';
import HotelThumb from '../../../components/common/management/HotelThumb';
import HotelFormModal from './HotelFormModal';

const TRANG_THAI = {
  cho_duyet:   { label: 'Chờ duyệt',    cls: 'badge-warning' },
  da_duyet:    { label: 'Đã duyệt',     cls: 'badge-success' },
  hoat_dong:   { label: 'Đã duyệt',     cls: 'badge-success' },
  tu_choi:     { label: 'Từ chối',      cls: 'badge-danger' },
  yeu_cau_sua: { label: 'Cần sửa',      cls: 'badge-warning' },
  bi_khoa:     { label: 'Tạm ngừng',    cls: 'badge-default' },
};

const getLoaiHinh = (hotel) => {
  const sao = hotel.so_sao || 0;
  if (sao >= 5) return 'Khu nghỉ dưỡng';
  if (sao >= 3) return 'Khách sạn';
  return 'Homestay';
};

const TAB_FILTER = {
  all: () => true,
  da_duyet: (h) => ['hoat_dong', 'da_duyet'].includes(h.trang_thai),
  cho_duyet: (h) => h.trang_thai === 'cho_duyet',
  tu_choi: (h) => ['tu_choi', 'yeu_cau_sua'].includes(h.trang_thai),
};

const InfoRow = ({ label, value }) => (
  <div style={{ display: 'flex', padding: '8px 0', borderBottom: '0.5px solid #f0f0f0', fontSize: 14 }}>
    <span style={{ width: 160, color: '#5a7a72', flexShrink: 0, fontSize: 13 }}>{label}</span>
    <span style={{ color: '#1a2e28', fontWeight: 500 }}>{value || '—'}</span>
  </div>
);

const HotelDetailModal = ({ hotel, onClose, onEdit, onToggle }) => {
  if (!hotel) return null;
  const st = TRANG_THAI[hotel.trang_thai] || { label: hotel.trang_thai, cls: 'badge-default' };
  const mainImg = hotel.hinh_anh?.find((i) => i.la_anh_chinh === 1) || hotel.hinh_anh?.[0];

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
    >
      <div
        className="modal-box"
        style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 className="modal-title" style={{ margin: 0, color: '#1a2e28' }}>{hotel.ten}</h3>
          <button type="button" className="modal-close" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}>×</button>
        </div>

        {mainImg && (
          <div style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 16, aspectRatio: '16/7' }}>
            <img src={resolveUploadUrl(mainImg.url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span className={`badge ${st.cls}`}>{st.label}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <ActionButton variant="edit" icon={Pencil} onClick={onEdit}>Chỉnh sửa</ActionButton>
            {['hoat_dong', 'bi_khoa'].includes(hotel.trang_thai) && (
              <ToggleSwitch
                checked={hotel.trang_thai === 'hoat_dong'}
                onChange={onToggle}
                labelOn="Đang hoạt động"
                labelOff="Tạm ngừng"
              />
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <InfoRow label="Tên khách sạn" value={hotel.ten} />
            <InfoRow label="Địa điểm" value={hotel.dia_diem?.ten_dia_diem} />
            <InfoRow label="Xếp hạng" value={hotel.so_sao ? `${hotel.so_sao} Sao` : '—'} />
          </div>
          <div>
            <InfoRow label="Giờ nhận phòng" value={hotel.gio_nhan_phong ? new Date(hotel.gio_nhan_phong).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'} />
            <InfoRow label="Giờ trả phòng" value={hotel.gio_tra_phong ? new Date(hotel.gio_tra_phong).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'} />
            <InfoRow label="Trạng thái" value={st.label} />
          </div>
        </div>

        <InfoRow label="Địa chỉ cụ thể" value={hotel.dia_chi} />

        {hotel.mo_ta && (
          <div style={{ marginTop: 12, padding: '10px 12px', background: '#f8fdfb', borderRadius: 8, fontSize: 14, color: '#5a7a72' }}>
            {hotel.mo_ta}
          </div>
        )}

        {hotel.khach_san_tien_nghi?.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#3C7363', marginBottom: 8 }}>Tiện nghi chung</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {hotel.khach_san_tien_nghi.map((tn) => (
                <span key={tn.ma_tien_nghi} style={{ padding: '4px 12px', borderRadius: 20, background: '#e8f5f1', color: '#3C7363', fontSize: 13 }}>
                  {tn.tien_nghi?.ten}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const HotelsPage = () => {
  const dispatch = useDispatch();
  const partnerHotelState = useSelector((state) => state.partnerHotel);
  const { list = [], diaDiem = [], amenities = [], defaultCancelPolicies = [], loading, error, successMsg } = partnerHotelState || {};

  const [modal, setModal] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [diaDiemFilter, setDiaDiemFilter] = useState('all');

  useEffect(() => {
    dispatch(fetchMyHotels());
    dispatch(fetchDiaDiem());
    dispatch(fetchAmenitiesForHotel());
  }, [dispatch]);

  useEffect(() => {
    if (successMsg || error) {
      const timer = setTimeout(() => dispatch(clearMsg()), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, error, dispatch]);

  const stats = useMemo(() => ({
    total: list.length,
    daDuyet: list.filter((h) => ['hoat_dong', 'da_duyet'].includes(h.trang_thai)).length,
    choDuyet: list.filter((h) => h.trang_thai === 'cho_duyet').length,
    dangBan: list.filter((h) => h.trang_thai === 'hoat_dong').length,
  }), [list]);

  const filterTabs = useMemo(() => [
    { id: 'all', label: 'Tất cả', count: stats.total },
    { id: 'da_duyet', label: 'Đã duyệt', count: stats.daDuyet },
    { id: 'cho_duyet', label: 'Chờ duyệt', count: stats.choDuyet },
    { id: 'tu_choi', label: 'Từ chối', count: list.filter((h) => ['tu_choi', 'yeu_cau_sua'].includes(h.trang_thai)).length },
  ], [list, stats]);

  const filteredList = useMemo(() => {
    const tabFilter = TAB_FILTER[activeTab] || TAB_FILTER.all;
    const text = keyword.trim().toLowerCase();
    return (list || []).filter((hotel) => {
      if (!tabFilter(hotel)) return false;
      const matchDiaDiem = diaDiemFilter === 'all' || String(hotel.ma_dia_diem) === diaDiemFilter;
      const matchKeyword = !text
        || hotel.ten?.toLowerCase().includes(text)
        || hotel.dia_chi?.toLowerCase().includes(text)
        || hotel.dia_diem?.ten_dia_diem?.toLowerCase().includes(text);
      return matchDiaDiem && matchKeyword;
    });
  }, [list, keyword, activeTab, diaDiemFilter]);

  const handleToggleStatus = (hotel) => {
    const isActivating = hotel.trang_thai === 'bi_khoa';
    const confirmMsg = isActivating
      ? `Bạn muốn MỞ LẠI hoạt động cho khách sạn "${hotel.ten}"?`
      : `Bạn có chắc chắn muốn TẠM NGƯNG khách sạn "${hotel.ten}"? Khách hàng sẽ không thể đặt phòng mới.`;

    if (window.confirm(confirmMsg)) {
      const newStatus = isActivating ? 'hoat_dong' : 'bi_khoa';
      dispatch(updateHotel({ id: hotel.ma_khach_san, data: { trang_thai: newStatus } }));
      setModal(null);
    }
  };

  const handleSubmit = async (formData) => {
    if (modal === 'add') {
      const res = await dispatch(createHotel(formData));
      if (!res.error) setModal(null);
    } else {
      const hotelId = modal.ma_khach_san || modal.detail?.ma_khach_san;
      const res = await dispatch(updateHotel({ id: hotelId, data: formData }));
      if (!res.error) setModal(null);
    }
  };

  const canToggle = (status) => status === 'hoat_dong' || status === 'bi_khoa';

  return (
    <div className="mgmt-page">
      <ManagementHeader
        title="Hồ sơ Khách sạn"
        subtitle="Danh sách cơ sở lưu trú của bạn"
        actionLabel="Thêm Khách sạn"
        onAction={() => setModal('add')}
      />

      {successMsg && <div className="mgmt-toast success">{successMsg}</div>}
      {error && <div className="mgmt-toast error">{error}</div>}

      <SummaryStats
        items={[
          { label: 'Tổng', value: stats.total, color: '#1a2e28' },
          { label: 'Đã duyệt', value: stats.daDuyet, color: '#1a7a4a' },
          { label: 'Chờ duyệt', value: stats.choDuyet, color: '#b36b00' },
          { label: 'Đang bán', value: stats.dangBan, color: '#3C7363' },
        ]}
      />

      <div className="mgmt-toolbar">
        <SearchBar
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm theo tên hoặc địa chỉ..."
        />
        <select
          className="mgmt-select-inline"
          value={diaDiemFilter}
          onChange={(e) => setDiaDiemFilter(e.target.value)}
        >
          <option value="all">Tất cả địa điểm</option>
          {diaDiem.map((d) => (
            <option key={d.ma_dia_diem} value={String(d.ma_dia_diem)}>{d.ten_dia_diem}</option>
          ))}
        </select>
      </div>

      <FilterTabs tabs={filterTabs} active={activeTab} onChange={setActiveTab} />

      <div className="mgmt-table-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#5a7a72' }}>Đang tải dữ liệu...</div>
        ) : filteredList.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">
              {list.length ? 'Không có khách sạn phù hợp bộ lọc' : 'Chưa có khách sạn nào. Hãy thêm cơ sở đầu tiên!'}
            </p>
          </div>
        ) : (
          <div className="mgmt-table-scroll">
            <table className="data-table">
              <colgroup>
                <col className="mgmt-col-img" />
                <col />
                <col />
                <col className="mgmt-col-type" />
                <col className="mgmt-col-star" />
                <col className="mgmt-col-status" />
                <col className="mgmt-col-toggle" />
                <col style={{ width: 96 }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Ảnh</th>
                  <th>Tên khách sạn</th>
                  <th>Địa chỉ</th>
                  <th>Loại hình</th>
                  <th>Sao</th>
                  <th>Trạng thái</th>
                  <th>Hoạt động</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((hotel) => {
                  const st = TRANG_THAI[hotel.trang_thai] || { label: hotel.trang_thai, cls: 'badge-default' };
                  const isActive = hotel.trang_thai === 'hoat_dong';
                  return (
                    <tr key={hotel.ma_khach_san} style={{ opacity: hotel.trang_thai === 'bi_khoa' ? 0.75 : 1 }}>
                      <td><HotelThumb hotel={hotel} /></td>
                      <td>
                        <div
                          className="mgmt-cell-name"
                          style={{ cursor: 'pointer' }}
                          onClick={() => setModal({ detail: hotel })}
                          onKeyDown={(e) => e.key === 'Enter' && setModal({ detail: hotel })}
                          role="button"
                          tabIndex={0}
                        >
                          {hotel.ten}
                        </div>
                      </td>
                      <td>
                        <div className="mgmt-cell-address" title={hotel.dia_chi}>
                          {hotel.dia_chi || '—'}
                        </div>
                      </td>
                      <td><span className="mgmt-type-tag">{getLoaiHinh(hotel)}</span></td>
                      <td><StarRating value={hotel.so_sao} /></td>
                      <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                      <td>
                        <ToggleSwitch
                          compact
                          checked={isActive}
                          onChange={() => handleToggleStatus(hotel)}
                          disabled={!canToggle(hotel.trang_thai)}
                          labelOn="Đang hoạt động"
                          labelOff="Tạm ngừng"
                        />
                      </td>
                      <ActionCell>
                        <ActionButton
                          variant="view"
                          iconOnly
                          icon={Eye}
                          title="Chi tiết"
                          onClick={() => setModal({ detail: hotel })}
                        />
                        <ActionButton
                          variant="edit"
                          iconOnly
                          icon={Pencil}
                          title="Sửa"
                          onClick={() => setModal(hotel)}
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

      {modal === 'add' && (
        <HotelFormModal
          hotel={null}
          diaDiem={diaDiem}
          amenities={amenities}
          defaultCancelPolicies={defaultCancelPolicies}
          onClose={() => setModal(null)}
          onSubmit={handleSubmit}
          loading={loading}
        />
      )}

      {modal && modal !== 'add' && !modal.detail && (
        <HotelFormModal
          hotel={modal}
          diaDiem={diaDiem}
          amenities={amenities}
          defaultCancelPolicies={defaultCancelPolicies}
          onClose={() => setModal(null)}
          onSubmit={handleSubmit}
          loading={loading}
        />
      )}

      {modal?.detail && (
        <HotelDetailModal
          hotel={modal.detail}
          onClose={() => setModal(null)}
          onEdit={() => setModal(modal.detail)}
          onToggle={() => handleToggleStatus(modal.detail)}
        />
      )}
    </div>
  );
};

export default HotelsPage;

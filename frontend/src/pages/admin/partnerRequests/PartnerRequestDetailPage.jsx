import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import BackButton from '../../../components/common/BackButton';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import adminPartnerRequestService from '../../../services/adminPartnerRequestService';
import ROUTES from '../../../constants/routes';

const STATUS_MAP = {
  cho_xu_ly: { label: 'Chờ xử lý', cls: 'badge-warning' },
  da_lien_he: { label: 'Đã liên hệ', cls: 'badge-info' },
  tu_choi: { label: 'Từ chối', cls: 'badge-danger' },
  da_hop_tac: { label: 'Đã hợp tác', cls: 'badge-success' },
};

const STATUS_OPTIONS = [
  { value: 'cho_xu_ly', label: 'Chờ xử lý' },
  { value: 'da_lien_he', label: 'Đã liên hệ' },
  { value: 'da_hop_tac', label: 'Đã hợp tác' },
  { value: 'tu_choi', label: 'Từ chối' },
];

const formatDateTime = (value) => (
  value ? new Date(value).toLocaleString('vi-VN') : '—'
);

const InfoRow = ({ label, value }) => (
  <div style={{ display: 'flex', padding: '8px 0', borderBottom: '1px solid #f0f4f3', fontSize: 14 }}>
    <span style={{ width: 180, color: '#5a7a72', flexShrink: 0, fontSize: 13 }}>{label}</span>
    <span style={{ color: '#1a2e28', fontWeight: 500 }}>{value ?? '—'}</span>
  </div>
);

const PartnerRequestDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [trangThai, setTrangThai] = useState('cho_xu_ly');
  const [phanHoi, setPhanHoi] = useState('');

  const loadDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminPartnerRequestService.getById(id);
      const data = res.data?.data;
      setDetail(data);
      setTrangThai(data?.trang_thai || 'cho_xu_ly');
      setPhanHoi(data?.phan_hoi || '');
    } catch (err) {
      setDetail(null);
      setError(err.response?.data?.message || 'Không thể tải chi tiết yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadDetail();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await adminPartnerRequestService.updateStatus(id, {
        trang_thai: trangThai,
        phan_hoi: phanHoi.trim() || undefined,
      });
      setDetail(res.data?.data);
      setSuccessMsg(res.data?.message || 'Đã cập nhật trạng thái');
    } catch (err) {
      setError(err.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 48, color: '#5a7a72' }}>
        Đang tải chi tiết...
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="mgmt-page">
        <BackButton onClick={() => navigate(ROUTES.ADMIN.PARTNER_REQUESTS)} />
        <div className="empty-state" style={{ marginTop: 24 }}>
          <p className="empty-state-text">{error || 'Không tìm thấy yêu cầu'}</p>
          <Link to={ROUTES.ADMIN.PARTNER_REQUESTS} className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  const st = STATUS_MAP[detail.trang_thai] || { label: detail.trang_thai, cls: 'badge-default' };

  return (
    <div className="mgmt-page">
      <BackButton onClick={() => navigate(ROUTES.ADMIN.PARTNER_REQUESTS)} />

      <ManagementHeader
        title={`Yêu cầu hợp tác #${detail.ma_yeu_cau}`}
        subtitle={`Gửi lúc ${formatDateTime(detail.ngay_yeu_cau)}`}
      />

      {(successMsg || error) && (
        <div className={`mgmt-toast ${successMsg ? 'success' : 'error'}`}>
          {successMsg || error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <span className={`badge ${st.cls}`}>{st.label}</span>
      </div>

      <div className="content-card" style={{ marginBottom: 16 }}>
        <h3 className="content-card-title">Thông tin người đại diện</h3>
        <InfoRow label="Họ và tên" value={detail.ho_ten} />
        <InfoRow label="Số điện thoại" value={detail.so_dien_thoai} />
        <InfoRow label="Email" value={detail.email} />
      </div>

      <div className="content-card" style={{ marginBottom: 16 }}>
        <h3 className="content-card-title">Thông tin cơ sở lưu trú</h3>
        <InfoRow label="Tên khách sạn" value={detail.ten_co_so} />
        <InfoRow label="Quy mô số phòng" value={detail.quy_mo} />
        <InfoRow label="Tỉnh / Thành phố" value={detail.tinh_thanh} />
        <InfoRow label="Ghi chú" value={detail.ghi_chu || '—'} />
      </div>

      <div className="content-card" style={{ marginBottom: 16 }}>
        <h3 className="content-card-title">Xử lý yêu cầu</h3>
        <InfoRow label="Ngày xử lý" value={formatDateTime(detail.ngay_xu_ly)} />
        <InfoRow label="Admin xử lý" value={detail.nguoi_dung?.email || '—'} />

        <div style={{ marginTop: 16 }}>
          <label className="mgmt-filter-label" htmlFor="trang-thai">Trạng thái</label>
          <select
            id="trang-thai"
            className="mgmt-select-inline"
            value={trangThai}
            onChange={(e) => setTrangThai(e.target.value)}
            style={{ width: '100%', maxWidth: 280, marginTop: 6 }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: 16 }}>
          <label className="mgmt-filter-label" htmlFor="phan-hoi">Phản hồi / ghi chú nội bộ</label>
          <textarea
            id="phan-hoi"
            className="search-input"
            rows={4}
            value={phanHoi}
            onChange={(e) => setPhanHoi(e.target.value)}
            placeholder="Ghi chú khi liên hệ hoặc lý do từ chối..."
            style={{ width: '100%', marginTop: 6, resize: 'vertical' }}
          />
        </div>

        {detail.phan_hoi && (
          <div style={{
            marginTop: 16,
            padding: '12px 14px',
            background: '#f0f7f5',
            borderRadius: 8,
            fontSize: 14,
            color: '#444',
          }}
          >
            <strong style={{ color: '#3C7363' }}>Phản hồi đã lưu:</strong>
            <div style={{ marginTop: 6 }}>{detail.phan_hoi}</div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Đang lưu...' : 'Lưu cập nhật'}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => navigate(ROUTES.ADMIN.PARTNER_REQUESTS)}
          >
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartnerRequestDetailPage;

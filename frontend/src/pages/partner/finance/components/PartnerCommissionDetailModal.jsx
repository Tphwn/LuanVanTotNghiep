import { useEffect, useMemo, useState } from 'react';
import api from '../../../../services/api';
import { formatCurrency } from '../../../../utils/bookingDisplay';

const COMM_STATUS = {
  chua_thu: { label: 'Chờ đối soát', cls: 'badge-warning' },
  da_thu: { label: 'Đã đối soát', cls: 'badge-success' },
  tam_giu: { label: 'Tạm giữ', cls: 'badge-danger' },
  da_thanh_toan: { label: 'Đã thanh toán', cls: 'badge-info' },
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');

const getCustomerLabel = (dp) => {
  const name = dp?.khach_hang?.ho_ten || dp?.ten_nguoi_nhan;
  const phone = dp?.khach_hang?.nguoi_dung?.so_dien_thoai || dp?.sdt_nguoi_nhan;
  if (!name) return '—';
  return phone ? `${name} (${phone})` : name;
};

const MetaRow = ({ label, value }) => (
  <div className="comm-receipt-meta-row">
    <span className="comm-receipt-meta-label">{label}</span>
    <span className="comm-receipt-meta-value">{value ?? '—'}</span>
  </div>
);

const MoneyLine = ({ label, value, tone, strong }) => (
  <div className={`comm-receipt-money-line${strong ? ' is-strong' : ''}${tone ? ` is-${tone}` : ''}`}>
    <span>{label}</span>
    <span>{value}</span>
  </div>
);

const PartnerCommissionDetailModal = ({ commissionId, onClose }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!commissionId) return undefined;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      setDetail(null);
      try {
        const res = await api.get(`/partner/finance/commissions/${commissionId}`);
        if (!cancelled) setDetail(res.data?.data || null);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Không tải được chi tiết hoa hồng');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [commissionId]);

  const st = useMemo(() => {
    if (!detail) return { label: '—', cls: 'badge-default' };
    return COMM_STATUS[detail.trang_thai] || { label: detail.trang_thai, cls: 'badge-default' };
  }, [detail]);

  const money = useMemo(() => {
    if (!detail) return null;
    const dp = detail.dat_phong;
    const tongTruocGiam = Number(dp?.tong_tien_goc) || 0;
    const khuyenMai = Number(dp?.tien_giam) || 0;
    const tongThanhToan = Number(detail.tien_khach_tra ?? dp?.thanh_toan_cuoi) || 0;
    const afterDiscount = Math.max(0, tongTruocGiam - khuyenMai);
    const vat = Math.max(0, tongThanhToan - afterDiscount);
    const tyLe = Number(detail.ty_le_hoa_hong) || 0;
    const tienHh = Number(detail.so_tien_hoa_hong) || 0;
    const tienTroGia = Number(detail.tien_tro_gia_san) || 0;
    const tienDoiTac = Number(detail.tien_doi_tac_nhan) || 0;
    return {
      tongTruocGiam, khuyenMai, vat, tongThanhToan, tyLe, tienHh, tienTroGia, tienDoiTac,
    };
  }, [detail]);

  if (!commissionId) return null;

  const dp = detail?.dat_phong;
  const orderCode = dp?.ma_don_hang;
  const stayLabel = `${fmtDate(dp?.ngay_nhan_phong)} - ${fmtDate(dp?.ngay_tra_phong)}`;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-box finance-detail-modal comm-receipt-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <h3 className="modal-title">Chi tiết hoa hồng</h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="finance-detail-modal-body">
          {loading && !detail ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#5a7a72' }}>
              Đang tải chi tiết hoa hồng...
            </div>
          ) : error || !detail || !money ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#e05c5c' }}>
              {error || 'Không tìm thấy dữ liệu'}
            </div>
          ) : (
            <div className="comm-receipt">
              <header className="comm-receipt-header">
                <div className="comm-receipt-header-main">
                  <span className="comm-receipt-header-label">Mã đơn</span>
                  <strong className="comm-receipt-order">{orderCode || '—'}</strong>
                </div>
                <div className="comm-receipt-header-side">
                  <span className={`badge ${st.cls}`}>{st.label}</span>
                  <span className="comm-receipt-header-date">
                    Hoàn thành: {fmtDate(detail.ngay_hoan_thanh || detail.ngay_tinh)}
                  </span>
                </div>
              </header>

              <div className="comm-receipt-highlight">
                <div className="comm-receipt-card comm-receipt-card--dark">
                  <span className="comm-receipt-card-label">Tổng tiền thanh toán</span>
                  <strong className="comm-receipt-card-value">
                    {formatCurrency(money.tongThanhToan)}
                  </strong>
                </div>
                <div className="comm-receipt-card comm-receipt-card--green">
                  <span className="comm-receipt-card-label">Thực nhận của đối tác</span>
                  <strong className="comm-receipt-card-value">
                    {formatCurrency(money.tienDoiTac)}
                  </strong>
                </div>
              </div>

              <section className="comm-receipt-section">
                <h4 className="comm-receipt-section-title">Dòng tiền</h4>
                <div className="comm-receipt-money">
                  <MoneyLine
                    label="Tổng tiền trước giảm"
                    value={formatCurrency(money.tongTruocGiam)}
                  />
                  <MoneyLine
                    label="Khuyến mãi"
                    value={`- ${formatCurrency(money.khuyenMai)}`}
                    tone="muted"
                  />
                  {money.vat > 0 && (
                    <MoneyLine
                      label="VAT"
                      value={`+ ${formatCurrency(money.vat)}`}
                      tone="muted"
                    />
                  )}
                  <MoneyLine
                    label="Tổng khách thanh toán"
                    value={formatCurrency(money.tongThanhToan)}
                    strong
                  />
                  <MoneyLine
                    label={`Tỷ lệ hoa hồng (${money.tyLe}%)`}
                    value={`- ${formatCurrency(money.tienHh)}`}
                    tone="deduct"
                  />
                  {money.tienTroGia > 0 && (
                    <MoneyLine
                      label="Trợ giá sàn"
                      value={`+ ${formatCurrency(money.tienTroGia)}`}
                      tone="muted"
                    />
                  )}
                  <div className="comm-receipt-money-divider" />
                  <div className="comm-receipt-partner-total">
                    <span>Tiền đối tác nhận</span>
                    <strong>{formatCurrency(money.tienDoiTac)}</strong>
                  </div>
                </div>
              </section>

              <section className="comm-receipt-section">
                <h4 className="comm-receipt-section-title">Thông tin đơn</h4>
                <div className="comm-receipt-meta">
                  <MetaRow label="Khách hàng" value={getCustomerLabel(dp)} />
                  <MetaRow label="Khách sạn" value={dp?.loai_phong?.khach_san?.ten || '—'} />
                  <MetaRow label="Loại phòng" value={dp?.loai_phong?.ten_loai || '—'} />
                  <MetaRow label="Lưu trú" value={stayLabel} />
                  {detail.ghi_chu?.trim() ? (
                    <MetaRow label="Ghi chú" value={detail.ghi_chu.trim()} />
                  ) : null}
                </div>
              </section>
            </div>
          )}
        </div>

        <div className="finance-detail-modal-footer">
          <span />
          <button type="button" className="btn btn-ghost" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
};

export default PartnerCommissionDetailModal;

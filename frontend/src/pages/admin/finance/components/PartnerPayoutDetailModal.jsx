import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DetailTable from '../../../../components/booking/DetailTable';
import {
  fetchPartnerPayoutById,
  clearPartnerPayoutDetail,
} from '../../../../store/slices/adminFinanceSlice';
import { formatCurrency } from '../../../../utils/bookingDisplay';

const PAYOUT_STATUS = {
  cho_thanh_toan: { label: 'Chờ thanh toán', cls: 'badge-warning' },
  da_thanh_toan: { label: 'Đã thanh toán', cls: 'badge-success' },
  tam_giu: { label: 'Tạm giữ', cls: 'badge-danger' },
};

const COMM_STATUS = {
  da_thu: { label: 'Chờ thanh toán', cls: 'badge-warning' },
  da_thanh_toan: { label: 'Đã thanh toán', cls: 'badge-success' },
  tam_giu: { label: 'Tạm giữ', cls: 'badge-danger' },
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');

const fmtDateTime = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  const time = date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${date.toLocaleDateString('vi-VN')} ${time}`;
};

/** Gộp đơn theo từng đợt thanh toán (cùng ngày TT) / chờ TT / tạm giữ */
const groupCommissionsByBatch = (commissions = []) => {
  const pending = [];
  const held = [];
  const paidMap = new Map();

  for (const c of commissions) {
    if (c.trang_thai === 'da_thu') {
      pending.push(c);
      continue;
    }
    if (c.trang_thai === 'tam_giu') {
      held.push(c);
      continue;
    }
    if (c.trang_thai === 'da_thanh_toan') {
      const key = c.ngay_thanh_toan_doi_tac
        ? new Date(c.ngay_thanh_toan_doi_tac).toISOString()
        : `paid-${c.ma_hoa_hong}`;
      if (!paidMap.has(key)) {
        paidMap.set(key, {
          key,
          ngay: c.ngay_thanh_toan_doi_tac,
          phuong_thuc: c.phuong_thuc_tt_doi_tac,
          ghi_chu: c.ghi_chu,
          items: [],
        });
      }
      paidMap.get(key).items.push(c);
    }
  }

  const batches = [];

  if (pending.length) {
    batches.push({
      key: 'pending',
      title: 'Đợt chờ thanh toán',
      subtitle: `${pending.length} đơn chưa thanh toán`,
      tone: 'warning',
      items: pending,
    });
  }

  if (held.length) {
    batches.push({
      key: 'held',
      title: 'Đợt tạm giữ',
      subtitle: `${held.length} đơn đang tạm giữ`,
      tone: 'danger',
      items: held,
    });
  }

  const paidBatches = [...paidMap.values()].sort((a, b) => {
    const ta = a.ngay ? new Date(a.ngay).getTime() : 0;
    const tb = b.ngay ? new Date(b.ngay).getTime() : 0;
    return tb - ta;
  });

  paidBatches.forEach((b, idx) => {
    const tongNhan = b.items.reduce(
      (s, c) => s + (Number(c.tien_doi_tac_nhan) || 0),
      0,
    );
    batches.push({
      key: b.key,
      title: `Đợt thanh toán #${paidBatches.length - idx}`,
      subtitle: [
        b.ngay ? `Ngày TT: ${fmtDateTime(b.ngay)}` : null,
        b.phuong_thuc || null,
        `${b.items.length} đơn`,
        `Đối tác nhận: ${formatCurrency(tongNhan)}`,
      ].filter(Boolean).join(' · '),
      tone: 'success',
      items: b.items,
      ghi_chu: b.ghi_chu,
    });
  });

  return batches;
};

const BatchTable = ({ items }) => (
  <div className="mgmt-table-scroll">
    <table className="data-table data-table-grid admin-mgmt-table">
      <thead>
        <tr>
          <th>Mã đơn</th>
          <th>Khách sạn</th>
          <th>Ngày trả</th>
          <th>Doanh thu</th>
          <th>Hoa hồng</th>
          <th>Đối tác nhận</th>
          <th>Trạng thái</th>
        </tr>
      </thead>
      <tbody>
        {items.map((c) => {
          const cst = COMM_STATUS[c.trang_thai] || {
            label: c.trang_thai,
            cls: 'badge-default',
          };
          return (
            <tr key={c.ma_hoa_hong}>
              <td className="mgmt-table-cell-code">#{c.dat_phong?.ma_don_hang}</td>
              <td>{c.dat_phong?.loai_phong?.khach_san?.ten || '—'}</td>
              <td>{fmtDate(c.dat_phong?.ngay_tra_phong)}</td>
              <td>{formatCurrency(c.doanh_thu_don ?? c.dat_phong?.thanh_toan_cuoi)}</td>
              <td>{formatCurrency(c.so_tien_hoa_hong)}</td>
              <td>{formatCurrency(c.tien_doi_tac_nhan)}</td>
              <td><span className={`badge ${cst.cls}`}>{cst.label}</span></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const PartnerPayoutDetailModal = ({ maDoiTac, onClose }) => {
  const dispatch = useDispatch();
  const { partnerPayoutDetail: detail, partnerPayoutDetailLoading: loading } = useSelector(
    (s) => s.adminFinance || {},
  );

  useEffect(() => {
    if (maDoiTac) dispatch(fetchPartnerPayoutById(maDoiTac));
    return () => { dispatch(clearPartnerPayoutDetail()); };
  }, [maDoiTac, dispatch]);

  const batches = useMemo(
    () => groupCommissionsByBatch(detail?.commissions || []),
    [detail?.commissions],
  );

  if (!maDoiTac) return null;

  const st = PAYOUT_STATUS[detail?.trang_thai] || {
    label: detail?.trang_thai || '—',
    cls: 'badge-default',
  };

  const summaryRows = detail
    ? [
      { label: 'Mã đối tác', value: `#${detail.ma_doi_tac}` },
      { label: 'Tên đối tác', value: detail.ten_cong_ty || '—' },
      { label: 'Số khách sạn', value: detail.so_khach_san ?? 0 },
      { label: 'Số đơn đã đối soát', value: detail.so_don_da_doi_soat ?? 0 },
      { label: 'Tổng doanh thu', value: formatCurrency(detail.tong_doanh_thu) },
      { label: 'Tổng hoa hồng hệ thống', value: formatCurrency(detail.tong_hoa_hong) },
      { label: 'Số tiền cần thanh toán', value: formatCurrency(detail.so_tien_can_thanh_toan) },
      {
        label: 'Trạng thái',
        value: <span className={`badge ${st.cls}`}>{st.label}</span>,
      },
    ]
    : [];

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-box finance-detail-modal"
        style={{ maxWidth: 760 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <h3 className="modal-title">
            Chi tiết thanh toán đối tác
            {detail?.ten_cong_ty ? ` — ${detail.ten_cong_ty}` : ''}
          </h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="finance-detail-modal-body">
          {loading && !detail ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#5a7a72' }}>Đang tải...</div>
          ) : !detail ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#e05c5c' }}>Không có dữ liệu</div>
          ) : (
            <>
              <DetailTable title="Tổng quan đối tác" rows={summaryRows} />
              <div style={{ marginTop: 16 }}>
                <h4 className="booking-detail-section-title" style={{ marginBottom: 12 }}>
                  Đơn đã đối soát theo đợt thanh toán ({detail.commissions?.length || 0} đơn)
                </h4>
                {!batches.length ? (
                  <p className="empty-state-text">Chưa có đơn</p>
                ) : (
                  batches.map((batch) => (
                    <div
                      key={batch.key}
                      style={{
                        marginBottom: 16,
                        border: '1px solid #d4ede6',
                        borderRadius: 10,
                        overflow: 'hidden',
                      }}
                    >
                      <div style={{
                        padding: '10px 14px',
                        background: batch.tone === 'success'
                          ? '#f0faf6'
                          : batch.tone === 'danger'
                            ? '#fff5f5'
                            : '#fffbeb',
                        borderBottom: '1px solid #d4ede6',
                      }}
                      >
                        <div style={{ fontWeight: 700, color: '#1a2e28', fontSize: 14 }}>
                          {batch.title}
                        </div>
                        <div style={{ fontSize: 12, color: '#5a7a72', marginTop: 2 }}>
                          {batch.subtitle}
                        </div>
                        {batch.ghi_chu && (
                          <div style={{ fontSize: 12, color: '#5a7a72', marginTop: 4 }}>
                            Ghi chú: {batch.ghi_chu}
                          </div>
                        )}
                      </div>
                      <BatchTable items={batch.items} />
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
};

export default PartnerPayoutDetailModal;

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import ManagementToolbar from '../../../components/common/management/ManagementToolbar';
import ActionButton, { ActionCell } from '../../../components/common/ActionButton';
import adminPartnerRequestService from '../../../services/adminPartnerRequestService';
import ROUTES from '../../../constants/routes';

const STATUS_MAP = {
  cho_xu_ly: { label: 'Chờ xử lý', cls: 'badge-warning' },
  da_lien_he: { label: 'Đã liên hệ', cls: 'badge-info' },
  tu_choi: { label: 'Từ chối', cls: 'badge-danger' },
  da_hop_tac: { label: 'Đã hợp tác', cls: 'badge-success' },
};

const formatDateTime = (value) => (
  value ? new Date(value).toLocaleString('vi-VN') : '—'
);

const PartnerRequestsPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword.trim()), 350);
    return () => clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    adminPartnerRequestService.getStats()
      .then((res) => setStats(res.data?.data || null))
      .catch(() => setStats(null));
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const params = { limit: 100 };
        if (statusFilter !== 'all') params.trang_thai = statusFilter;
        if (debouncedKeyword) params.keyword = debouncedKeyword;

        const res = await adminPartnerRequestService.getList(params);
        setItems(res.data?.data?.items || []);
      } catch (err) {
        setItems([]);
        setError(err.response?.data?.message || 'Không thể tải danh sách yêu cầu');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [statusFilter, debouncedKeyword]);

  const filterTabs = useMemo(() => [
    { id: 'all', label: 'Tất cả', count: stats?.total ?? items.length },
    { id: 'cho_xu_ly', label: 'Chờ xử lý', count: stats?.cho_xu_ly ?? 0 },
    { id: 'da_lien_he', label: 'Đã liên hệ', count: stats?.da_lien_he ?? 0 },
    { id: 'da_hop_tac', label: 'Đã hợp tác', count: stats?.da_hop_tac ?? 0 },
    { id: 'tu_choi', label: 'Từ chối', count: stats?.tu_choi ?? 0 },
  ], [stats, items.length]);

  return (
    <div className="mgmt-page">
      <ManagementHeader
        title="Yêu Cầu Hợp Tác"
        subtitle="Quản lý đăng ký hợp tác từ đối tác khách sạn"
      />

      {error && (
        <div className="mgmt-toast error">{error}</div>
      )}

      <ManagementToolbar
        searchValue={keyword}
        onSearchChange={(e) => setKeyword(e.target.value)}
        searchPlaceholder="Tìm mã, tên, SĐT, khách sạn, email..."
        tabs={filterTabs}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
      />

      <div className="mgmt-table-card mgmt-table-card--grid">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#5a7a72' }}>
            Đang tải dữ liệu...
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">Chưa có yêu cầu hợp tác nào</p>
          </div>
        ) : (
          <div className="mgmt-table-scroll">
            <table className="data-table data-table-grid">
              <thead>
                <tr>
                  <th style={{ width: 160 }}>Mã yêu cầu &amp; ngày gửi</th>
                  <th>Tên &amp; số điện thoại</th>
                  <th>Tên khách sạn</th>
                  <th style={{ width: 130 }}>Trạng thái</th>
                  <th style={{ width: 72 }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const st = STATUS_MAP[item.trang_thai] || {
                    label: item.trang_thai,
                    cls: 'badge-default',
                  };

                  return (
                    <tr key={item.ma_yeu_cau}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#1a2e28' }}>
                          #{item.ma_yeu_cau}
                        </div>
                        <div style={{ fontSize: 12, color: '#5a7a72', marginTop: 4 }}>
                          {formatDateTime(item.ngay_yeu_cau)}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{item.ho_ten}</div>
                        <div style={{ fontSize: 13, color: '#5a7a72', marginTop: 4 }}>
                          {item.so_dien_thoai}
                        </div>
                      </td>
                      <td>{item.ten_co_so}</td>
                      <td>
                        <span className={`badge ${st.cls}`}>{st.label}</span>
                      </td>
                      <ActionCell>
                        <ActionButton
                          variant="view"
                          icon={Eye}
                          iconOnly
                          title="Xem chi tiết"
                          onClick={() => navigate(`${ROUTES.ADMIN.PARTNER_REQUESTS}/${item.ma_yeu_cau}`)}
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
    </div>
  );
};

export default PartnerRequestsPage;

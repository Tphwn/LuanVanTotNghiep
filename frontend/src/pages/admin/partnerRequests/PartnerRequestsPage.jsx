import { useEffect, useMemo, useState } from 'react';
import { Eye } from 'lucide-react';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import ManagementToolbar from '../../../components/common/management/ManagementToolbar';
import FilterActions from '../../../components/common/management/FilterActions';
import ListPagination from '../../../components/common/management/ListPagination';
import ActionButton, { ActionCell } from '../../../components/common/ActionButton';
import adminPartnerRequestService from '../../../services/adminPartnerRequestService';
import useListPagination from '../../../hooks/useListPagination';
import PartnerRequestDetailModal from './components/PartnerRequestDetailModal';
import DownSelect from '../../../components/common/management/DownSelect';

const PAGE_SIZE = 10;

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
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    adminPartnerRequestService.getStats()
      .then((res) => setStats(res.data?.data || null))
      .catch(() => setStats(null));
  }, [refreshTick]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const params = { limit: 100 };
        if (statusFilter !== 'all') params.trang_thai = statusFilter;
        if (keyword.trim()) params.keyword = keyword.trim();

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
  }, [statusFilter, keyword, refreshTick]);

  useEffect(() => {
    if (!successMsg) return undefined;
    const t = setTimeout(() => setSuccessMsg(''), 4000);
    return () => clearTimeout(t);
  }, [successMsg]);

  const filterTabs = useMemo(() => [
    { id: 'all', label: 'Tất cả', count: stats?.total ?? items.length, tone: 'neutral' },
    { id: 'cho_xu_ly', label: 'Chờ xử lý', count: stats?.cho_xu_ly ?? 0, tone: 'warning' },
    { id: 'da_lien_he', label: 'Đã liên hệ', count: stats?.da_lien_he ?? 0, tone: 'info' },
    { id: 'da_hop_tac', label: 'Đã hợp tác', count: stats?.da_hop_tac ?? 0, tone: 'success' },
    { id: 'tu_choi', label: 'Từ chối', count: stats?.tu_choi ?? 0, tone: 'danger' },
  ], [stats, items.length]);

  const clearFilters = () => {
    setKeyword('');
    setStatusFilter('all');
  };

  const {
    pagedItems,
    currentPage,
    totalPages,
    setPage,
    pageNumbers,
    rangeFrom,
    rangeTo,
    showPagination,
  } = useListPagination(items, PAGE_SIZE, [statusFilter, keyword]);

  const emptyListMessage = useMemo(() => {
    if (keyword.trim()) return 'Không tìm thấy yêu cầu hợp tác phù hợp';
    if (statusFilter === 'cho_xu_ly') {
      return 'Hiện tại không có yêu cầu hợp tác nào chờ duyệt';
    }
    if (statusFilter === 'da_lien_he') return 'Danh sách yêu cầu đã liên hệ trống';
    if (statusFilter === 'da_hop_tac') return 'Danh sách yêu cầu đã hợp tác trống';
    if (statusFilter === 'tu_choi') return 'Danh sách yêu cầu từ chối trống';
    return 'Chưa có yêu cầu hợp tác nào';
  }, [statusFilter, keyword]);

  return (
    <div className="mgmt-page admin-partner-requests-page">
      <ManagementHeader
        title="Yêu Cầu Hợp Tác"
        subtitle="Quản lý đăng ký hợp tác từ đối tác khách sạn"
      />

      {(successMsg || error) && (
        <div className={`mgmt-toast ${successMsg ? 'success' : 'error'}`}>
          {successMsg || error}
        </div>
      )}

      <PartnerRequestDetailModal
        isOpen={selectedId !== null}
        requestId={selectedId}
        onClose={() => setSelectedId(null)}
        onUpdated={(msg) => {
          setSelectedId(null);
          setSuccessMsg(msg);
          setRefreshTick((t) => t + 1);
        }}
      />

      <ManagementToolbar
        searchValue={keyword}
        onSearchChange={(e) => setKeyword(e.target.value)}
        searchPlaceholder="Tìm mã, tên, SĐT, khách sạn, email..."
        tabs={filterTabs}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
      >
        <DownSelect
          className="mgmt-select-inline"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Lọc theo trạng thái"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="cho_xu_ly">Chờ xử lý</option>
          <option value="da_lien_he">Đã liên hệ</option>
          <option value="da_hop_tac">Đã hợp tác</option>
          <option value="tu_choi">Từ chối</option>
        </DownSelect>
        <FilterActions showApply={false} onClear={clearFilters} />
      </ManagementToolbar>

      <div className="mgmt-table-card mgmt-table-card--grid">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#5a7a72' }}>
            Đang tải dữ liệu...
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">{emptyListMessage}</p>
          </div>
        ) : (
          <>
            <div className="mgmt-table-scroll">
              <table className="data-table data-table-grid admin-mgmt-table">
                <thead>
                  <tr>
                    <th style={{ width: 160 }}>Mã yêu</th>
                    <th>Ngày gửi</th>
                    <th>Tên </th>
                    <th>Số điện thoại</th>
                    <th>Tên khách sạn</th>
                    <th style={{ width: 130 }}>Trạng thái</th>
                    <th style={{ width: 72 }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedItems.map((item) => {
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
                        </td>
                        <td>
                          <div style={{ fontSize: 12, color: '#5a7a72', marginTop: 4 }}>
                            {formatDateTime(item.ngay_yeu_cau)}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{item.ho_ten}</div>
                        </td>
                        <td>
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
                            onClick={() => setSelectedId(item.ma_yeu_cau)}
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
                total={items.length}
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
    </div>
  );
};

export default PartnerRequestsPage;

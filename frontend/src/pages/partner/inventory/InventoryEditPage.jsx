import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../../../services/api';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import BackButton from '../../../components/common/BackButton';
import EditField from '../../admin/users/components/EditField';

export default function InventoryEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [item, setItem] = useState(location.state?.item || null);
  const [qty, setQty] = useState(item?.mo_ban ?? 0);
  const [loading, setLoading] = useState(!item);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (item) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/partner/inventory');
        const items = res.data.data?.items || [];
        const found = items.find((i) => String(i.ma_loai_phong) === String(id));
        if (found) {
          setItem(found);
          setQty(found.mo_ban ?? 0);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Không tải được dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, item]);

  const handleSave = async () => {
    if (!item) return;
    setSaving(true);
    try {
      await api.put(`/partner/inventory/${item.ma_loai_phong}/open-sale`, {
        so_luong_mo_ban: Number(qty),
      });
      navigate('/partner/inventory', { state: { toast: 'Đã cập nhật số lượng mở bán' } });
    } catch (err) {
      alert(err.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80, color: '#5a7a72' }}>Đang tải...</div>;
  }

  if (!item) {
    return (
      <div className="content-card" style={{ textAlign: 'center', padding: 48 }}>
        <p style={{ color: '#e05c5c', marginBottom: 16 }}>{error || 'Không tìm thấy dữ liệu kho phòng'}</p>
        <BackButton variant="outline" onClick={() => navigate('/partner/inventory')} />
      </div>
    );
  }

  const max = item.tong_phong;
  const min = item.da_dat;

  return (
    <div>
      <ManagementHeader
        title="Quản lý Kho phòng"
        subtitle={`Điều chỉnh mở bán — ${item.ten_loai}`}
        onBack={() => navigate('/partner/inventory')}
      />

      <div className="content-card" style={{ maxWidth: 520 }}>
        <p style={{ fontSize: 14, color: '#5a7a72', marginBottom: 16 }}>
          <strong>{item.ten_loai}</strong> — {item.ten_khach_san}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20, fontSize: 13 }}>
          <div style={{ padding: 10, background: '#f8fdfb', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ color: '#888' }}>Tổng phòng</div>
            <div style={{ fontWeight: 700, color: '#3C7363' }}>{item.tong_phong}</div>
          </div>
          <div style={{ padding: 10, background: '#fff8e6', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ color: '#888' }}>Đã đặt</div>
            <div style={{ fontWeight: 700, color: '#b36b00' }}>{item.da_dat}</div>
          </div>
          <div style={{ padding: 10, background: '#e8f5f1', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ color: '#888' }}>Còn lại</div>
            <div style={{ fontWeight: 700, color: '#1a7a4a' }}>{item.con_lai}</div>
          </div>
        </div>

        <EditField label="Số lượng mở bán" required>
          <input
            type="number"
            className="search-input"
            style={{ width: '100%', boxSizing: 'border-box' }}
            min={min}
            max={max}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
          <p style={{ margin: '8px 0 0', fontSize: 12, color: '#888' }}>
            Tối thiểu {min} (đã đặt), tối đa {max} (tổng phòng)
          </p>
        </EditField>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/partner/inventory')} disabled={saving}>
            Hủy
          </button>
          <button type="button" className="btn btn-primary" disabled={saving} onClick={handleSave}>
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
}

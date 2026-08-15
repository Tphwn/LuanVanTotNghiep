import { useEffect, useRef, useState } from 'react';
import {
  Bell,
  Building2,
  Handshake,
  Sparkles,
  TicketPercent,
  Wallet,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import NotifyListItem from '../common/NotifyListItem';

const LOAI_LABEL = {
  tien_nghi: 'Tiện nghi',
  he_thong: 'Hệ thống',
  dat_phong: 'Đặt phòng',
  thanh_toan: 'Tài chính',
  danh_gia: 'Đánh giá',
  khuyen_mai: 'Khuyến mãi',
};
// Lấy thông tin thông báo từ admin
const getAdminNotifyMeta = (n) => {
  const title = String(n.tieu_de || '').toLowerCase();
  const loai = n.loai;

  if (loai === 'thanh_toan' || title.includes('hoàn tiền')) {
    return {
      kind: 'finance',
      Icon: Wallet,
      badge: 'Tài chính',
      path: '/admin/finance?tab=refunds',
    };
  }
  if (loai === 'khuyen_mai' || title.includes('khuyến mãi')) {
    return {
      kind: 'promo',
      Icon: TicketPercent,
      badge: 'Khuyến mãi',
      path: '/admin/promotions',
    };
  }
  if (loai === 'tien_nghi' || title.includes('tiện nghi')) {
    return {
      kind: 'amenity',
      Icon: Sparkles,
      badge: 'Tiện nghi',
      path: '/admin/amenities',
      state: { tab: 'requests' },
    };
  }
  if (title.includes('hợp tác')) {
    return {
      kind: 'partner',
      Icon: Handshake,
      badge: 'Hợp tác',
      path: '/admin/partner-requests',
    };
  }
  if (title.includes('khách sạn')) {
    return {
      kind: 'hotel',
      Icon: Building2,
      badge: 'Khách sạn',
      path: '/admin/hotels?tab=cho_duyet',
    };
  }

  return {
    kind: 'system',
    Icon: Bell,
    badge: LOAI_LABEL[loai] || 'Hệ thống',
    path: null,
  };
};

const AdminNotificationBell = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState([]);
  const ref = useRef(null);

  const load = async () => {
    try {
      const res = await api.get('/admin/notifications');
      setItems(res.data.data?.items || []);
      setUnreadCount(res.data.data?.unreadCount || 0);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    if (!open) setExpandedIds([]);
  }, [open]);

  const handleOpen = async () => {
    setOpen((v) => !v);
    if (!open) await load();
  };

  const markRead = async (id) => {
    await api.patch(`/admin/notifications/${id}/read`);
    await load();
  };

  const markAllRead = async () => {
    setLoading(true);
    try {
      await api.patch('/admin/notifications/read-all');
      await load();
    } finally {
      setLoading(false);
    }
  };

  const handleClickItem = async (n) => {
    if (!n.da_doc) await markRead(n.ma_thong_bao);
    const meta = getAdminNotifyMeta(n);
    if (meta.path) {
      setOpen(false);
      setExpandedIds([]);
      navigate(meta.path, meta.state ? { state: meta.state } : undefined);
    }
  };

  const toggleDetail = async (n) => {
    const id = n.ma_thong_bao;
    const willExpand = !expandedIds.includes(id);
    setExpandedIds((prev) => (
      willExpand ? [...prev, id] : prev.filter((itemId) => itemId !== id)
    ));
    if (willExpand && !n.da_doc) await markRead(id);
  };

  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <div ref={ref} className="partner-notify-wrap">
      <button
        type="button"
        className="admin-notify-btn"
        onClick={handleOpen}
        title="Thông báo"
        aria-label={`Thông báo${unreadCount > 0 ? `, ${unreadCount} chưa đọc` : ''}`}
      >
        <Bell size={20} strokeWidth={1.8} />
        {unreadCount > 0 && (
          <span className="admin-notify-badge" aria-hidden>
            {badgeLabel}
          </span>
        )}
      </button>

      {open && (
        <div className="partner-notify-dropdown">
          <div className="partner-notify-dropdown-header">
            <strong>Thông báo</strong>
            {unreadCount > 0 && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={loading}
                onClick={markAllRead}
              >
                Đánh dấu đã đọc
              </button>
            )}
          </div>

          <div className="partner-notify-dropdown-body">
            {items.length === 0 ? (
              <div className="partner-notify-empty">Chưa có thông báo</div>
            ) : items.map((n) => (
              <NotifyListItem
                key={n.ma_thong_bao}
                item={n}
                meta={getAdminNotifyMeta(n)}
                expanded={expandedIds.includes(n.ma_thong_bao)}
                onToggleDetail={toggleDetail}
                onOpenRelated={handleClickItem}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotificationBell;

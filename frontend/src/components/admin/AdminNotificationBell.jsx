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
import { formatNotifyDateTime, formatRelativeTime } from '../../utils/formatRelativeTime';

const LOAI_LABEL = {
  tien_nghi: 'Tiện nghi',
  he_thong: 'Hệ thống',
  dat_phong: 'Đặt phòng',
  thanh_toan: 'Tài chính',
  danh_gia: 'Đánh giá',
  khuyen_mai: 'Khuyến mãi',
};

/**
 * Icon + tone theo nhóm nghiệp vụ admin (không dùng màu nền để phân loại sự kiện).
 * Nền item chỉ phản ánh đã đọc / chưa đọc.
 */
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
      navigate(meta.path, meta.state ? { state: meta.state } : undefined);
    }
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
            ) : items.map((n) => {
              const meta = getAdminNotifyMeta(n);
              const Icon = meta.Icon;
              const unread = !n.da_doc;

              return (
                <button
                  key={n.ma_thong_bao}
                  type="button"
                  onClick={() => handleClickItem(n)}
                  className={`partner-notify-item${unread ? ' is-unread' : ''}`}
                >
                  <span className={`partner-notify-icon partner-notify-icon--${meta.kind}`} aria-hidden>
                    <Icon size={14} strokeWidth={2.4} />
                  </span>

                  <div className="partner-notify-item-main">
                    <div className="partner-notify-item-title-row">
                      <div className="partner-notify-item-title">
                        {n.tieu_de}
                        {meta.badge && (
                          <span className="partner-notify-type">{meta.badge}</span>
                        )}
                      </div>
                      {unread && <span className="partner-notify-unread-dot" aria-label="Chưa đọc" />}
                    </div>
                    <div className="partner-notify-item-content">{n.noi_dung}</div>
                    <div className="partner-notify-item-time" title={formatNotifyDateTime(n.ngay_gui)}>
                      {formatRelativeTime(n.ngay_gui)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotificationBell;

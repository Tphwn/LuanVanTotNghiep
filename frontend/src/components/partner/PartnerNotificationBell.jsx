import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Building2,
  CalendarCheck,
  Check,
  DoorOpen,
  Sparkles,
  Star,
  TicketPercent,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { formatNotifyDateTime, formatRelativeTime } from '../../utils/formatRelativeTime';

const LOAI_LABEL = {
  tien_nghi: 'Tiện nghi',
  he_thong: 'Hệ thống',
  dat_phong: 'Đặt phòng',
  thanh_toan: 'Thanh toán',
  danh_gia: 'Đánh giá',
  khuyen_mai: 'Khuyến mãi',
};
const getPartnerNotifyMeta = (n) => {
  const title = String(n.tieu_de || '').toLowerCase();
  const loai = n.loai;
  const isWarning = (
    title.includes('bị ẩn')
    || title.includes('bị khóa')
    || title.includes('bị từ chối')
    || title.includes('tạm ngưng')
    || title.includes('từ chối')
    || title.includes('bị hủy')
    || title.includes('đã bị hủy')
  );
  const isSuccess = (
    title.includes('mở khóa')
    || title.includes('hiện lại')
    || title.includes('được hiện')
    || title.includes('được duyệt')
    || title.includes('đã được duyệt')
    || title.includes('khôi phục')
    || title.includes('mở lại')
    || title.includes('đã được thêm')
  );

  if (loai === 'khuyen_mai' || title.includes('khuyến mãi')) {
    return {
      kind: isWarning ? 'warning' : (isSuccess ? 'success' : 'promo'),
      Icon: TicketPercent,
      badge: 'Khuyến mãi',
      path: '/partner/promotions',
    };
  }

  if (loai === 'danh_gia' || title.includes('đánh giá') || title.includes('phản hồi')) {
    return {
      kind: isWarning ? 'warning' : (isSuccess ? 'success' : 'system'),
      Icon: Star,
      badge: 'Đánh giá',
      path: '/partner/reviews',
    };
  }

  if (
    loai === 'dat_phong'
    || title.includes('đặt phòng')
    || title.includes('đơn đặt')
    || title.includes('bị hủy')
  ) {
    const isCancel = title.includes('hủy');
    return {
      kind: isCancel ? 'warning' : 'success',
      Icon: isCancel ? AlertTriangle : CalendarCheck,
      badge: 'Đặt phòng',
      path: '/partner/bookings',
      state: { statusFilter: isCancel ? 'da_huy' : 'cho_nhan_phong' },
    };
  }

  if (loai === 'tien_nghi' || title.includes('tiện nghi')) {
    return {
      kind: isWarning ? 'warning' : (isSuccess ? 'success' : 'amenity'),
      Icon: Sparkles,
      badge: 'Tiện nghi',
      path: '/partner/hotels',
    };
  }

  if (title.includes('loại phòng') || title.includes('phòng bị ẩn') || title.includes('phòng đã được mở')) {
    const roomStatus = title.includes('ẩn') ? 'an' : (title.includes('mở') ? 'hoat_dong' : null);
    return {
      kind: isWarning ? 'warning' : (isSuccess ? 'success' : 'system'),
      Icon: DoorOpen,
      badge: 'Loại phòng',
      path: '/partner/rooms',
      state: roomStatus ? { roomStatusFilter: roomStatus } : undefined,
    };
  }

  if (title.includes('khách sạn')) {
    let tab = 'all';
    if (title.includes('bị khóa') || title.includes('không hoạt động')) tab = 'khong_hoat_dong';
    else if (title.includes('mở khóa')) tab = 'da_duyet';
    else if (title.includes('từ chối')) tab = 'tu_choi';
    else if (title.includes('duyệt')) tab = 'da_duyet';
    else if (title.includes('chờ')) tab = 'cho_duyet';

    return {
      kind: isWarning ? 'warning' : (isSuccess ? 'success' : 'hotel'),
      Icon: Building2,
      badge: 'Khách sạn',
      path: tab === 'all' ? '/partner/hotels' : `/partner/hotels?tab=${tab}`,
    };
  }

  return {
    kind: isWarning ? 'warning' : (isSuccess ? 'success' : 'system'),
    Icon: isWarning ? AlertTriangle : (isSuccess ? Check : Bell),
    badge: LOAI_LABEL[loai] || 'Hệ thống',
    path: '/partner/dashboard',
  };
};

const PartnerNotificationBell = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const load = async () => {
    try {
      const res = await api.get('/partner/notifications');
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
    await api.patch(`/partner/notifications/${id}/read`);
    await load();
  };

  const markAllRead = async () => {
    setLoading(true);
    try {
      await api.patch('/partner/notifications/read-all');
      await load();
    } finally {
      setLoading(false);
    }
  };

  const handleClickItem = async (n) => {
    if (!n.da_doc) await markRead(n.ma_thong_bao);
    const meta = getPartnerNotifyMeta(n);
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
              const meta = getPartnerNotifyMeta(n);
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

export default PartnerNotificationBell;

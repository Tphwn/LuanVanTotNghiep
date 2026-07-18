import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const formatTime = (d) => new Date(d).toLocaleString('vi-VN');

const LOAI_LABEL = {
  tien_nghi: 'Tiện nghi',
  he_thong: 'Hệ thống',
  dat_phong: 'Đặt phòng',
  thanh_toan: 'Thanh toán',
  danh_gia: 'Đánh giá',
  khuyen_mai: 'Khuyến mãi',
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
    if (n.loai === 'tien_nghi') {
      setOpen(false);
      navigate('/admin/amenities', { state: { tab: 'requests' } });
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
            ) : items.map((n) => (
              <button
                key={n.ma_thong_bao}
                type="button"
                onClick={() => handleClickItem(n)}
                className={`partner-notify-item${n.da_doc ? '' : ' is-unread'}`}
              >
                <div className="partner-notify-item-title">
                  {!n.da_doc && <span className="partner-notify-unread-dot">●</span>}
                  {n.tieu_de}
                  {LOAI_LABEL[n.loai] && (
                    <span className="partner-notify-type">{LOAI_LABEL[n.loai]}</span>
                  )}
                </div>
                <div className="partner-notify-item-content">{n.noi_dung}</div>
                <div className="partner-notify-item-time">{formatTime(n.ngay_gui)}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotificationBell;

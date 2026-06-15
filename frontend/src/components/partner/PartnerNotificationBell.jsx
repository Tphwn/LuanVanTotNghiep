import { useEffect, useRef, useState } from 'react';
import api from '../../services/api';

const formatTime = (d) => new Date(d).toLocaleString('vi-VN');

const PartnerNotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const load = async () => {
    try {
      const res = await api.get('/partner/notifications', { params: { loai: 'tien_nghi' } });
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
      await api.patch('/partner/notifications/read-all', null, { params: { loai: 'tien_nghi' } });
      await load();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={handleOpen}
        style={{
          position: 'relative', background: '#f0f7f5', border: '1px solid #d4ede6',
          borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontSize: 18,
        }}
        title="Thông báo tiện nghi"
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: '#e05c5c', color: '#fff', borderRadius: '50%',
            minWidth: 18, height: 18, fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 360,
          background: '#fff', border: '1px solid #d4ede6', borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 300, overflow: 'hidden',
        }}>
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid #f0f0f0',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <strong style={{ fontSize: 14, color: '#1a2e28' }}>Thông báo tiện nghi</strong>
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

          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {items.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#5a7a72', fontSize: 13 }}>
                Chưa có thông báo
              </div>
            ) : items.map((n) => (
              <button
                key={n.ma_thong_bao}
                type="button"
                onClick={() => !n.da_doc && markRead(n.ma_thong_bao)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '12px 16px', border: 'none', borderBottom: '1px solid #f5f5f5',
                  background: n.da_doc ? '#fff' : '#f8fdfb', cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13, color: '#1a2e28', marginBottom: 4 }}>
                  {!n.da_doc && <span style={{ color: '#3C7363', marginRight: 6 }}>●</span>}
                  {n.tieu_de}
                </div>
                <div style={{ fontSize: 12, color: '#5a7a72', lineHeight: 1.5 }}>{n.noi_dung}</div>
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 6 }}>{formatTime(n.ngay_gui)}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerNotificationBell;

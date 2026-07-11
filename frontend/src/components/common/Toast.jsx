/**
 * Toast dùng chung cho toàn hệ thống — thống nhất màu, hình dạng, vị trí.
 * Nhận vào một object { message, type } (type: 'success' | 'error') hoặc null.
 */
const Toast = ({ toast, inline = false }) => {
  if (!toast || !toast.message) return null;

  const type = toast.type === 'error' ? 'error' : 'success';
  const style = inline ? { position: 'static', marginBottom: 16 } : undefined;

  return (
    <div className={`mgmt-toast ${type}`} style={style} role="status" aria-live="polite">
      {toast.message}
    </div>
  );
};

export default Toast;

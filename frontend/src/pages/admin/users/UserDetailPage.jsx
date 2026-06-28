import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { lockUser, unlockUser } from "../../../store/slices/adminUserSlice";
import adminUserService from "../../../services/adminUserService";
import { resolveUploadUrl } from "../../../utils/media";
import ActionButton, { TableActions } from "../../../components/common/ActionButton";
import BackButton from "../../../components/common/BackButton";
import ManagementHeader from "../../../components/common/management/ManagementHeader";
import { TRANG_THAI as BOOKING_STATUS } from "../../../utils/bookingDisplay";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(amount) || 0);

const formatDate = (date) => (date ? new Date(date).toLocaleDateString("vi-VN") : "—");
const formatDateTime = (date) => (date ? new Date(date).toLocaleString("vi-VN") : "—");

const ACCOUNT_STATUS = {
  hoat_dong: { label: "Hoạt động", cls: "badge-success" },
  bi_khoa: { label: "Bị khóa", cls: "badge-danger" },
};

const PARTNER_STATUS = {
  hoat_dong: { label: "Đang hợp tác", cls: "badge-success" },
  bi_khoa: { label: "Ngưng hợp tác", cls: "badge-danger" },
};

const GENDER_LABEL = { nam: "Nam", nu: "Nữ", khac: "Khác" };

const InfoRow = ({ label, value }) => (
  <div style={{ padding: "10px 0", borderBottom: "1px solid #f0f4f3" }}>
    <div style={{ fontSize: 12, color: "#5a7a72", marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 14, fontWeight: 500, color: "#1a2e28" }}>{value ?? "—"}</div>
  </div>
);

const UserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadUser = async () => {
    try {
      setLoading(true);
      const res = await adminUserService.getUserById(id);
      setUser(res.data.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUser(); }, [id]);

  const handleLockToggle = async () => {
    const isActive = user.trang_thai === "hoat_dong";
    const msg = isActive
      ? `Khóa tài khoản ${user.email}? Người dùng sẽ không thể đăng nhập.`
      : `Mở khóa tài khoản ${user.email}?`;
    if (!window.confirm(msg)) return;

    setActionLoading(true);
    try {
      if (isActive) await dispatch(lockUser(user.ma_nguoi_dung));
      else await dispatch(unlockUser(user.ma_nguoi_dung));
      await loadUser();
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: 80, color: "#5a7a72" }}>Đang tải...</div>;
  }

  if (!user) {
    return (
      <div className="content-card" style={{ textAlign: "center", padding: 48 }}>
        <p style={{ color: "#e05c5c", marginBottom: 16 }}>Không tìm thấy người dùng</p>
        <BackButton variant="outline" onClick={() => navigate("/admin/users")} />
      </div>
    );
  }

  const isCustomer = user.vai_tro === "khach_hang";
  const isPartner = user.vai_tro === "doi_tac";
  const customer = user.khach_hang;
  const partner = user.doi_tac_doi_tac_ma_nguoi_dungTonguoi_dung;
  const accountSt = ACCOUNT_STATUS[user.trang_thai] || { label: user.trang_thai, cls: "badge-default" };

  const displayName = isCustomer
    ? customer?.ho_ten
    : isPartner
      ? partner?.ten_cong_ty
      : "Admin";

  const avatarUrl = isCustomer
    ? resolveUploadUrl(customer?.anh_dai_dien)
    : resolveUploadUrl(partner?.anh_dai_dien);

  const bookings = customer?.dat_phong || [];

  return (
    <div className="mgmt-page">
      <ManagementHeader
        title="Chi Tiết Người Dùng"
        onBack={() => navigate("/admin/users")}
      />

      <div className="content-card" style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ padding: "24px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", flex: 1, minWidth: 0 }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%", overflow: "hidden",
              background: "#e8f5f1", border: "2px solid #d4ede6", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28,
            }}>
              {avatarUrl && (
                <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
            </div>

            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                <h1 className="page-title" style={{ margin: 0, fontSize: 22 }}>{displayName || "Chưa cập nhật"}</h1>
                <span className={`badge ${isCustomer ? "badge-info" : "badge-success"}`}>
                  {isCustomer ? "Khách hàng" : isPartner ? "Đối tác" : "Admin"}
                </span>
                <span className={`badge ${accountSt.cls}`}>{accountSt.label}</span>
              </div>
              <p style={{ margin: 0, fontSize: 14, color: "#5a7a72" }}>
                Email: {user.email}
                <br />
                Số điện thoại: {user.so_dien_thoai}
              </p>
            </div>
          </div>

          <TableActions style={{ flexShrink: 0, justifyContent: "flex-end" }}>
            <ActionButton
              variant={user.trang_thai === "hoat_dong" ? "lock" : "unlock"}
              onClick={handleLockToggle}
              disabled={actionLoading}
            >
              {actionLoading ? "Đang xử lý..." : user.trang_thai === "hoat_dong" ? "Khóa tài khoản" : "Mở khóa"}
            </ActionButton>
          </TableActions>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div className="content-card">
          <h3 className="content-card-title" style={{ marginBottom: 12 }}>Tài khoản đăng nhập</h3>
          <InfoRow label="Mã người dùng" value={`${user.ma_nguoi_dung}`} />
          <InfoRow label="Email đăng nhập" value={user.email} />
          <InfoRow label="Số điện thoại" value={user.so_dien_thoai} />
          <InfoRow label="Vai trò hệ thống" value={isCustomer ? "Khách hàng" : isPartner ? "Đối tác" : "Admin"} />
          <InfoRow label="Trạng thái tài khoản" value={accountSt.label} />
          <InfoRow label="Ngày tạo" value={formatDateTime(user.ngay_tao)} />
          <InfoRow label="Đăng nhập gần nhất" value={formatDateTime(user.dang_nhap_cuoi)} />
        </div>

        {isCustomer && customer && (
          <div className="content-card">
            <h3 className="content-card-title" style={{ marginBottom: 12 }}>Hồ sơ khách hàng</h3>
            <InfoRow label="Họ tên" value={customer.ho_ten} />
            <InfoRow label="Ngày sinh" value={formatDate(customer.ngay_sinh)} />
            <InfoRow label="Giới tính" value={GENDER_LABEL[customer.gioi_tinh] || "—"} />
            <InfoRow label="Tổng lượt đặt" value={`${customer.tong_lan_dat || 0} lần`} />
            <InfoRow label="Tổng chi tiêu" value={formatCurrency(customer.tong_tien_da_chi)} />
          </div>
        )}

        {isPartner && partner && (
          <div className="content-card">
            <h3 className="content-card-title" style={{ marginBottom: 12 }}>Hồ sơ đối tác</h3>
            <InfoRow label="Tên công ty" value={partner.ten_cong_ty} />
            <InfoRow label="Mã đối tác" value={`${partner.ma_doi_tac}`} />
            <InfoRow label="Email liên hệ" value={partner.email_lien_he || user.email} />
            <InfoRow label="SĐT công ty" value={partner.so_dien_thoai || user.so_dien_thoai} />
            <InfoRow label="Địa chỉ" value={partner.dia_chi} />
            <InfoRow label="Mã số thuế" value={partner.ma_so_thue} />
            <InfoRow label="Tỷ lệ hoa hồng" value={partner.phan_tram_hoa_hong != null ? `${partner.phan_tram_hoa_hong}%` : "Mặc định hệ thống"} />
            <InfoRow label="Trạng thái hợp tác" value={PARTNER_STATUS[partner.trang_thai]?.label || partner.trang_thai} />
            <InfoRow label="Ngày cấp tài khoản" value={formatDateTime(partner.ngay_cap_tai_khoan)} />
          </div>
        )}
      </div>

      {isCustomer && (
        <div className="content-card">
          <div className="content-card-header">
            <h3 className="content-card-title">Lịch sử đặt phòng</h3>
            <span className="badge badge-info">{bookings.length} đơn</span>
          </div>
          {bookings.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-text">Chưa có lịch sử đặt phòng</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Khách sạn</th>
                    <th>Loại phòng</th>
                    <th>Nhận phòng</th>
                    <th>Trả phòng</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((dp) => {
                    const st = BOOKING_STATUS[dp.trang_thai] || { label: dp.trang_thai, cls: "badge-default" };
                    return (
                      <tr key={dp.ma_dat_phong}>
                        <td style={{ fontWeight: 600, color: "#3C7363" }}>{dp.ma_don_hang}</td>
                        <td>{dp.loai_phong?.khach_san?.ten || "—"}</td>
                        <td style={{ fontSize: 13 }}>{dp.loai_phong?.ten_loai || "—"}</td>
                        <td style={{ fontSize: 13 }}>{formatDate(dp.ngay_nhan_phong)}</td>
                        <td style={{ fontSize: 13 }}>{formatDate(dp.ngay_tra_phong)}</td>
                        <td style={{ fontWeight: 600, color: "#b36b00", whiteSpace: "nowrap" }}>
                          {formatCurrency(dp.thanh_toan_cuoi)}
                        </td>
                        <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserDetailPage;

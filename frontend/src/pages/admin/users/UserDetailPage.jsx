import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { lockUser, unlockUser } from "../../../redux/slices/adminUserSlice";
import adminUserService from "../../../services/adminUserService";

// ===== HELPERS =====
const formatCurrency = (amount) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount || 0);

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString("vi-VN") : "—";

const formatDateTime = (date) =>
  date ? new Date(date).toLocaleString("vi-VN") : "—";

const BOOKING_STATUS = {
  cho_xac_nhan: { label: "Chờ xác nhận", cls: "badge-warning" },
  da_xac_nhan: { label: "Đã xác nhận", cls: "badge-info" },
  hoan_thanh: { label: "Hoàn thành", cls: "badge-success" },
  da_huy: { label: "Đã hủy", cls: "badge-danger" },
  tu_choi: { label: "Từ chối", cls: "badge-danger" },
};

const HOTEL_STATUS = {
  cho_duyet: { label: "Chờ duyệt", cls: "badge-warning" },
  da_duyet: { label: "Đã duyệt", cls: "badge-info" },
  hoat_dong: { label: "Hoạt động", cls: "badge-success" },
  tu_choi: { label: "Từ chối", cls: "badge-danger" },
  bi_khoa: { label: "Bị khóa", cls: "badge-danger" },
  yeu_cau_sua: { label: "Yêu cầu sửa", cls: "badge-warning" },
};

// ===== COMPONENT PHỤ =====
const InfoRow = ({ label, value }) => (
  <div
    style={{
      display: "flex",
      padding: "10px 0",
      borderBottom: "0.5px solid #f0f0f0",
      fontSize: 14,
      gap: 12,
    }}
  >
    <span style={{ width: 180, color: "#5a7a72", flexShrink: 0, fontSize: 13 }}>
      {label}
    </span>
    <span style={{ color: "#1a2e28", fontWeight: 500, flex: 1 }}>
      {value || "—"}
    </span>
  </div>
);

// ===== MAIN COMPONENT =====
const UserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info");

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const res = await adminUserService.getUserById(id);
      setUser(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLockToggle = async () => {
    const isActive = user.trang_thai === "hoat_dong";
    const msg = isActive
      ? `Khóa tài khoản ${user.email}?`
      : `Mở khóa tài khoản ${user.email}?`;
    if (!window.confirm(msg)) return;
    if (isActive) await dispatch(lockUser(user.ma_nguoi_dung));
    else await dispatch(unlockUser(user.ma_nguoi_dung));
    loadUser();
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: 60, color: "#5a7a72" }}>
        ⏳ Đang tải dữ liệu...
      </div>
    );

  if (!user)
    return (
      <div style={{ textAlign: "center", padding: 60, color: "#5a7a72" }}>
        Không tìm thấy người dùng
      </div>
    );

  const isCustomer = user.vai_tro === "khach_hang";
  const isPartner = user.vai_tro === "doi_tac";
  const customer = user.khach_hang;
  const partner = user.doi_tac_doi_tac_ma_nguoi_dungTonguoi_dung;

  const displayName = isCustomer
    ? customer?.ho_ten
    : isPartner
    ? partner?.ten_cong_ty
    : "Admin";

  const tabs = [
    { id: "info", label: "👤 Thông tin" },
    isCustomer && {
      id: "booking",
      label: `📅 Đặt phòng (${customer?.dat_phong?.length || 0})`,
    },
    isPartner && {
      id: "hotel",
      label: `🏨 Khách sạn (${partner?.khach_san?.length || 0})`,
    },
  ].filter(Boolean);

  return (
    <div>
      {/* ===== HEADER ===== */}
      <div className="page-header">
        <div className="page-header-left">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate("/admin/users")}
            style={{ marginBottom: 8 }}
          >
            ← Quay lại danh sách
          </button>
          <h1 className="page-title">Chi tiết người dùng</h1>
          <p className="page-subtitle">
            #{user.ma_nguoi_dung} · {user.email}
          </p>
        </div>
        <button
          className={`btn ${
            user.trang_thai === "hoat_dong" ? "btn-danger" : "btn-outline"
          }`}
          onClick={handleLockToggle}
        >
          {user.trang_thai === "hoat_dong"
            ? "🔒 Khóa tài khoản"
            : "🔓 Mở khóa"}
        </button>
      </div>

      {/* ===== PROFILE CARD ===== */}
      <div
        className="content-card"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          marginBottom: 16,
          padding: "16px 24px",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "#e8f5f1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 26,
            flexShrink: 0,
          }}
        >
          {isPartner ? "🏢" : "👤"}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "#1a2e28",
              marginBottom: 3,
            }}
          >
            {displayName || "Chưa cập nhật"}
          </div>
          <div style={{ fontSize: 13, color: "#5a7a72" }}>
            {user.email} &nbsp;·&nbsp; {user.so_dien_thoai}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          <span
            className={`badge ${
              isCustomer ? "badge-info" : "badge-success"
            }`}
          >
            {isCustomer ? "Khách hàng" : isPartner ? "Đối tác" : "Admin"}
          </span>
          <span
            className={`badge ${
              user.trang_thai === "hoat_dong"
                ? "badge-success"
                : "badge-danger"
            }`}
          >
            {user.trang_thai === "hoat_dong" ? "● Hoạt động" : "● Bị khóa"}
          </span>
        </div>
      </div>

      {/* ===== TABS ===== */}
      <div
        style={{
          display: "flex",
          borderBottom: "0.5px solid #d4ede6",
          marginBottom: 16,
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "10px 20px",
              background: "none",
              border: "none",
              borderBottom:
                activeTab === tab.id
                  ? "2px solid #3C7363"
                  : "2px solid transparent",
              color: activeTab === tab.id ? "#3C7363" : "#5a7a72",
              fontWeight: activeTab === tab.id ? 600 : 400,
              cursor: "pointer",
              fontSize: 14,
              marginBottom: -1,
              transition: "all .15s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== TAB: THÔNG TIN ===== */}
      {activeTab === "info" && (
        <div className="form-grid">

          {/* Tài khoản */}
          <div className="content-card">
            <h3 className="content-card-title" style={{ marginBottom: 12 }}>
              🔑 Thông tin tài khoản
            </h3>
            <InfoRow label="Mã người dùng" value={`#${user.ma_nguoi_dung}`} />
            <InfoRow label="Email" value={user.email} />
            <InfoRow label="Số điện thoại" value={user.so_dien_thoai} />
            <InfoRow
              label="Vai trò"
              value={
                isCustomer ? "Khách hàng" : isPartner ? "Đối tác" : "Admin"
              }
            />
            <InfoRow
              label="Trạng thái"
              value={
                user.trang_thai === "hoat_dong"
                  ? "● Hoạt động"
                  : "● Bị khóa"
              }
            />
            <InfoRow label="Ngày tạo" value={formatDateTime(user.ngay_tao)} />
            <InfoRow
              label="Đăng nhập cuối"
              value={formatDateTime(user.dang_nhap_cuoi)}
            />
          </div>

          {/* Khách hàng */}
          {isCustomer && customer && (
            <div className="content-card">
              <h3 className="content-card-title" style={{ marginBottom: 12 }}>
                👤 Hồ sơ khách hàng
              </h3>
              <InfoRow label="Họ tên" value={customer.ho_ten} />
              <InfoRow
                label="Ngày sinh"
                value={formatDate(customer.ngay_sinh)}
              />
              <InfoRow
                label="Giới tính"
                value={
                  customer.gioi_tinh === "nam"
                    ? "♂ Nam"
                    : customer.gioi_tinh === "nu"
                    ? "♀ Nữ"
                    : customer.gioi_tinh === "khac"
                    ? "Khác"
                    : "—"
                }
              />
              <InfoRow
                label="Tổng lượt đặt"
                value={`${customer.tong_lan_dat || 0} lần`}
              />
              <InfoRow
                label="Tổng chi tiêu"
                value={formatCurrency(customer.tong_tien_da_chi)}
              />
            </div>
          )}

          {/* Đối tác */}
          {isPartner && partner && (
            <div className="content-card">
              <h3 className="content-card-title" style={{ marginBottom: 12 }}>
                🏢 Thông tin đối tác
              </h3>
              <InfoRow label="Tên công ty" value={partner.ten_cong_ty} />
              <InfoRow label="Mã số thuế" value={partner.ma_so_thue} />
              <InfoRow label="SĐT công ty" value={partner.so_dien_thoai} />
              <InfoRow label="Địa chỉ" value={partner.dia_chi} />
              <InfoRow
                label="Trạng thái"
                value={
                  partner.trang_thai === "hoat_dong"
                    ? "● Hoạt động"
                    : "● Bị khóa"
                }
              />
              <InfoRow
                label="Ngày cấp TK"
                value={formatDateTime(partner.ngay_cap_tai_khoan)}
              />
              <InfoRow
                label="Số khách sạn"
                value={`${partner.khach_san?.length || 0} KS`}
              />
            </div>
          )}
        </div>
      )}

      {/* ===== TAB: ĐẶT PHÒNG ===== */}
      {activeTab === "booking" && isCustomer && (
        <div className="content-card">
          <div className="content-card-header">
            <h3 className="content-card-title">📅 Lịch sử đặt phòng</h3>
            <span className="badge badge-info">
              {customer?.dat_phong?.length || 0} đơn
            </span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách sạn</th>
                <th>Loại phòng</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {customer?.dat_phong?.length > 0 ? (
                customer.dat_phong.map((dp) => {
                  const st =
                    BOOKING_STATUS[dp.trang_thai] || {
                      label: dp.trang_thai,
                      cls: "badge-default",
                    };
                  return (
                    <tr key={dp.ma_dat_phong}>
                      <td style={{ fontWeight: 500, color: "#3C7363" }}>
                        #{dp.ma_don_hang}
                      </td>
                      <td>{dp.loai_phong?.khach_san?.ten || "—"}</td>
                      <td>{dp.loai_phong?.ten_loai || "—"}</td>
                      <td>{formatDate(dp.ngay_nhan_phong)}</td>
                      <td>{formatDate(dp.ngay_tra_phong)}</td>
                      <td style={{ fontWeight: 500 }}>
                        {formatCurrency(dp.thanh_toan_cuoi)}
                      </td>
                      <td>
                        <span className={`badge ${st.cls}`}>{st.label}</span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📋</div>
                      <p className="empty-state-text">
                        Chưa có lịch sử đặt phòng
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== TAB: KHÁCH SẠN ===== */}
      {activeTab === "hotel" && isPartner && (
        <div className="content-card">
          <div className="content-card-header">
            <h3 className="content-card-title">🏨 Danh sách khách sạn</h3>
            <span className="badge badge-info">
              {partner?.khach_san?.length || 0} KS
            </span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Tên khách sạn</th>
                <th>Địa chỉ</th>
                <th>Số sao</th>
                <th>Ngày tạo</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {partner?.khach_san?.length > 0 ? (
                partner.khach_san.map((ks) => {
                  const st =
                    HOTEL_STATUS[ks.trang_thai] || {
                      label: ks.trang_thai,
                      cls: "badge-default",
                    };
                  return (
                    <tr key={ks.ma_khach_san}>
                      <td style={{ fontWeight: 500 }}>{ks.ten}</td>
                      <td style={{ color: "#5a7a72", fontSize: 13 }}>
                        {ks.dia_chi}
                      </td>
                      <td>{"⭐".repeat(ks.so_sao || 0)}</td>
                      <td style={{ color: "#5a7a72", fontSize: 13 }}>
                        {formatDate(ks.ngay_tao)}
                      </td>
                      <td>
                        <span className={`badge ${st.cls}`}>{st.label}</span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <div className="empty-state-icon">🏨</div>
                      <p className="empty-state-text">Chưa có khách sạn nào</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserDetailPage;
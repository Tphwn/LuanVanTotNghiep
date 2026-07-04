# Cấu trúc dự án — Hotel Booking System

Tài liệu tham chiếu nhanh: **file nào thuộc role nào**, module backend map với frontend.

---

## Vai trò (Roles)

| Role | Mô tả | API prefix | Frontend layout |
|------|--------|------------|-----------------|
| **Admin** | Quản trị toàn hệ thống | `/api/admin/*` | `AdminLayout` + `pages/admin/` |
| **Partner** | Chủ khách sạn / đối tác | `/api/partner/*` | `PartnerLayout` + `pages/partner/` |
| **Customer** | Khách đặt phòng | `/api/customer/*` | `MainLayout` + `pages/customer/` |
| **Public** | Không đăng nhập (tìm KS, đăng ký HT) | `/api/public/*` | `pages/customer/` (một số trang) |
| **Shared** | Auth, tiện nghi (admin CRUD) | `/api/auth`, `/api/amenities` | `pages/auth/` |

---

## Backend (`backend/src/`)

### Luồng chuẩn mỗi feature

```
modules/[tên]/[tên].routes.js  →  [tên].controller.js  →  [tên].service.js  →  Prisma
```

Admin thường **gọi lại service** của partner (vd: `admin/hotel` → `hotel/hotel.service.js`).

### Module theo role

#### Admin — `modules/admin/`

| Thư mục | API | Chức năng |
|---------|-----|-----------|
| `user/` | `/api/admin/users` | Người dùng, khóa/mở đối tác, tạo đối tác |
| `hotel/` | `/api/admin/hotels` | Duyệt/khóa KS (logic trong `hotel/hotel.service.js`) |
| `roomType/` | `/api/admin/room-types` | Danh sách loại phòng toàn hệ thống, ẩn/mở |
| `booking/` | `/api/admin/bookings` | Tất cả đơn đặt phòng |
| `payment/` | `/api/admin/payments` | Giao dịch, hoàn tiền |
| `finance/` | `/api/admin/finance` | Hoa hồng, đối soát |
| `review/` | `/api/admin/reviews` | Kiểm duyệt đánh giá |
| `report/` | `/api/admin/reports` | Báo cáo vi phạm từ user |
| `partnerRequest/` | `/api/admin/partner-requests` | Yêu cầu hợp tác (dùng `partnerContact` controller) |

#### Partner — `modules/` (mount dưới `/api/partner/`)

| Thư mục | API | Chức năng |
|---------|-----|-----------|
| `hotel/` | `/api/partner/hotels` | CRUD khách sạn của đối tác |
| `roomType/` | `/api/partner/rooms` | Loại phòng |
| `booking/` | `/api/partner/bookings` | Đơn đặt phòng |
| `pricing/` | `/api/partner/pricing` | Bảng giá / tồn phòng |
| `promotion/` | `/api/partner/promotions` | Khuyến mãi |
| `review/` | `/api/partner/reviews` | Đánh giá & phản hồi |
| `account/` | `/api/partner/account` | Hồ sơ đối tác |
| `finance/` | `/api/partner/finance` | Doanh thu (controller trực tiếp Prisma) |
| `notification/` | `/api/partner/notifications` | Thông báo |
| `amenity/amenityRequest.routes.js` | `/api/amenities/requests` | Đối tác gửi yêu cầu tiện nghi mới |

#### Customer — `modules/customer/` + `account/`

| Thư mục | API | Chức năng |
|---------|-----|-----------|
| `customer/` | `/api/customer/bookings` | Đặt phòng, hủy, lịch sử |
| `account/customerAccount.*` | `/api/customer/account` | Hồ sơ khách hàng |

#### Public — `modules/public/`

| API | Chức năng |
|-----|-----------|
| `/api/public/hotels` | Tìm KS, chi tiết, phòng (trang chủ khách) |
| `/api/public/locations` | Địa điểm |
| `partnerContact/` | Form “Hợp tác với chúng tôi” |

#### Shared

| Thư mục | API |
|---------|-----|
| `auth/` | `/api/auth` — đăng nhập, đăng ký |
| `amenity/` | `/api/amenities` — CRUD tiện nghi (admin) + duyệt yêu cầu |

### Utils (`backend/src/utils/`)

Xem `backend/src/utils/README.md` — mỗi file ghi rõ dùng cho module nào.

### Database (`backend/prisma/schema.prisma`)

**Đang dùng:** hầu hết 24 model (nguoi_dung, khach_san, loai_phong, dat_phong, thanh_toan, …).

**Chưa có API (giữ lại cho tương lai, không xóa):**

- `cau_hinh_he_thong` — cấu hình key/value hệ thống
- `khach_hang_khuyen_mai` — theo dõi KM đã gán cho từng khách

---

## Frontend (`frontend/src/`)

### Redux — chỉ dùng `store/` (không dùng `redux/`)

| Slice | Role | Dùng ở |
|-------|------|--------|
| `authSlice` | All | Login, guard route |
| `adminUserSlice` | Admin | UsersPage, UserDetailPage |
| `adminHotelSlice` | Admin | HotelsPage, HotelDetailPage |
| `adminBookingSlice` | Admin | BookingsPage |
| `adminFinanceSlice` | Admin | AdminFinancePage |
| `amenitySlice` | Admin | AmenitiesPage |
| `partnerHotelSlice` | Partner | HotelsPage partner |
| `partnerBookingSlice` | Partner | BookingManagePage |

Các trang còn lại gọi trực tiếp `services/api.js`.

### Services

| File | Role |
|------|------|
| `authService.js` | Đăng nhập/đăng ký |
| `publicHotelService.js` | Customer — tìm KS, chi tiết |
| `customerBookingService.js` | Customer — đặt/hủy phòng |
| `customerAccountService.js` | Customer — tài khoản |
| `partnerContactService.js` | Public — form hợp tác |
| `adminUserService.js` | Admin — users |
| `adminHotelService.js` | Admin — hotels (một số API) |
| `adminPartnerRequestService.js` | Admin — yêu cầu hợp tác |
| `api.js` | Axios chung — admin & partner pages |

### Pages theo role

#### `pages/admin/`

| Thư mục / file | Route | Mô tả |
|----------------|-------|--------|
| `DashboardPage` | `/admin/dashboard` | Tổng quan (placeholder) |
| `users/UsersPage` | `/admin/users` | Danh sách người dùng |
| `users/UserDetailPage` | `/admin/users/:id` | Chi tiết + khóa/mở |
| `users/CreatePartnerPage` | `/admin/users/create-partner` | Tạo đối tác |
| `users/PartnersPage` | `/admin/partners` | Lọc nhanh danh sách đối tác |
| `hotels/HotelsPage` | `/admin/hotels` | Quản lý KS |
| `hotels/HotelDetailPage` | `/admin/hotels/:id` | Chi tiết KS |
| `rooms/RoomTypesPage` | `/admin/room-types` | Loại phòng toàn hệ thống |
| `rooms/RoomDetailPage` | `/admin/room-types/:id` | Chi tiết loại phòng |
| `bookings/BookingsPage` | `/admin/bookings` | Đặt phòng |
| `bookings/BookingDetailPage` | `/admin/bookings/:id` | Chi tiết đơn |
| `amenities/AmenitiesPage` | `/admin/amenities` | Tiện nghi + yêu cầu đối tác |
| `amenities/AmenityFormPage` | `/admin/amenities/create`, `/:id/edit` | Thêm/sửa tiện nghi |
| `finance/AdminFinancePage` | `/admin/finance` | Tài chính |
| `finance/TransactionDetailPage` | `/admin/finance/transactions/:id` | Chi tiết GD |
| `finance/RefundDetailPage` | `/admin/finance/refunds/:id` | Chi tiết hoàn tiền |
| `reviews/ReviewsPage` | `/admin/reviews` | Đánh giá |
| `reports/ReportsPage` | `/admin/reports` | Báo cáo vi phạm |
| `partnerRequests/PartnerRequestsPage` | `/admin/partner-requests` | Yêu cầu hợp tác |
| `partnerRequests/PartnerRequestDetailPage` | `/admin/partner-requests/:id` | Chi tiết yêu cầu |

#### `pages/partner/`

| Thư mục | Route chính | Mô tả |
|---------|-------------|--------|
| `DashboardPage` | `/partner/dashboard` | Tổng quan |
| `hotels/` | `/partner/hotels` | KS của đối tác |
| `rooms/` | `/partner/rooms`, `/partner/hotels/:id/rooms` | Loại phòng |
| `pricing/` | `/partner/pricing` | Giá & tồn (thay inventory cũ) |
| `bookings/` | `/partner/bookings` | Đơn đặt phòng |
| `promotions/` | `/partner/promotions` | Khuyến mãi |
| `reviews/` | `/partner/reviews` | Đánh giá |
| `finance/` | `/partner/finance` | Doanh thu |
| `account/ProfilePage` | `/partner/account` | Hồ sơ |
| `images/HotelImagesPage` | `/partner/hotels/:id/images` | Ảnh KS |

`HotelFormModal.jsx` / `RoomFormModal.jsx` — **không phải popup**, là form dùng chung cho trang create/edit.

#### `pages/customer/`

| File | Route | Mô tả |
|------|-------|--------|
| `HomePage` | `/` | Trang chủ |
| `HotelSearchPage` | `/hotels/search` | Kết quả tìm kiếm |
| `CustomerHotelDetailPage` | `/hotels/:id` | Chi tiết KS |
| `CustomerRoomDetailPage` | `/hotels/:hotelId/rooms/:roomId` | Chi tiết phòng |
| `CustomerBookingPage` | `/booking` | Thanh toán |
| `MyBookingsPage` | `/my-bookings` | Đơn của tôi |
| `ProfilePage` | `/account/profile` | Hồ sơ |
| `PointsPage`, `TransactionsPage`, `RefundsPage` | `/account/*` | Placeholder tài khoản |
| `PartnerContactPage` | `/partner-contact` | Đăng ký hợp tác |
| `ContactPage`, `BookingGuidePage`, `PromotionsPage` | tương ứng | Nội dung tĩnh / placeholder |

#### `pages/auth/`

`LoginPage`, `RegisterPage` — `/login`, `/register`

### Components dùng chung

- `components/common/` — nút, bảng, header quản lý
- `components/layout/` — sidebar admin/partner
- `components/booking/BookingTable.jsx` — bảng đơn (admin + partner)
- `components/customer/` — UI trang khách

---

## Scripts hữu ích

| Script | Mô tả |
|--------|--------|
| `backend/scripts/syncPartnerLocks.js` | Đồng bộ khóa KS/loại phòng khi đối tác bị khóa |

---

## Quy ước khi thêm code mới

1. Backend: tạo module trong `modules/` đúng role; admin wrapper mỏng nếu logic trùng partner.
2. Frontend: page mới trong `pages/{admin|partner|customer}/`; đăng ký route trong `AppRoutes.jsx`.
3. API customer → `publicHotelService` / `customerBookingService`; admin → slice hoặc `api.js`.
4. Không tạo thư mục `redux/` — chỉ `store/slices/`.
5. Form full-page ưu tiên hơn modal (theo pattern Users/Hotels).

# Backend Utils

| File | Dùng cho | Mô tả |
|------|----------|--------|
| `response.js` | Auth, public, customer, middlewares | `success()` / `error()` JSON chuẩn |
| `jwt.js` | Auth | Tạo/verify JWT |
| `hashPassword.js` | Auth, account | Bcrypt hash/compare |
| `user.js` | Hotel controller | `getUserId(req.user)` |
| `parseJson.js` | Hotel controller | Parse field JSON từ body |
| `hotelRules.js` | Hotel controller | Parse quy tắc/chính sách KS từ form |
| `images.js` | Hotel, public, admin roomType | Gắn `hinh_anh` vào KS/loại phòng |
| `bookingHelpers.js` | Booking, customer, public, pricing | Giá, availability, overlap booking |
| `refundHelpers.js` | Booking, customer | Tính hoàn tiền khi hủy |
| `refundMapper.js` | Admin payment | DTO hoàn tiền cho admin |
| `paymentMapper.js` | Admin payment | DTO giao dịch cho admin |
| `partnerBookingMapper.js` | Admin + partner booking | Thêm thông tin hoàn vào response |
| `partnerNotify.js` | Amenity | Thông báo khi duyệt/từ chối tiện nghi |
| `partnerLockHelpers.js` | Admin user, hotel, roomType, public | Khóa cascade KS/loại phòng khi khóa đối tác |

# Q&A Bảo vệ luận văn — Hệ thống Đặt phòng Khách sạn

Tài liệu ôn tập nhanh trước hội đồng.  
Mỗi mục: **Câu hỏi → Gợi ý trả lời ngắn → File code tham chiếu → Ví dụ số (nếu có)**.

> Mẹo: Khi thầy bảo “mở code”, ưu tiên các file trong cột *Code*. Không cần thuộc từng dòng — thuộc **ý tưởng + vị trí**.

---

## A. Mở đầu / Tổng quan đề tài

### A1. Em làm hệ thống gì? Giải quyết bài toán nào?

**Trả lời:**  
Hệ thống đặt phòng khách sạn nhiều bên (marketplace): khách tìm và đặt phòng online; đối tác (chủ KS) quản lý khách sạn, loại phòng, giá theo ngày, khuyến mãi, đơn đặt; admin duyệt nội dung và đối soát tài chính (hoa hồng, hoàn tiền, thanh toán đối tác).  
Giải quyết: thiếu minh bạch giá/tồn kho theo ngày, khó quản lý đơn đa kênh, và cần chia doanh thu sàn–đối tác.

### A2. Công nghệ sử dụng? Vì sao chọn stack này?

**Trả lời:**  
- Frontend: React + Vite + Redux Toolkit + Axios  
- Backend: Node.js + Express  
- DB: MySQL + Prisma ORM  
- Auth: JWT (+ Google OAuth cho khách, tùy cấu hình)  
- Thanh toán: VNPay sandbox (thật); một số cổng khác mô phỏng UI  

Chọn vì phù hợp web realtime quản trị, Prisma giúp schema/migration rõ ràng cho đồ án, tách FE/BE dễ demo và bảo trì.

### A3. Vì sao tách 3 cổng đăng nhập?

**Trả lời:**  
Ba vai trò khác nhau về quyền và UI. Login kèm kiểm tra `vai_tro`; vào sai portal sẽ báo lỗi / chuyển đúng khu vực.  
- Khách: `/login`  
- Đối tác: `/partner/login`  
- Admin: `/admin/login`

**Code:** `backend/src/modules/auth/auth.service.js`, `frontend/src/routes/ProtectedRoute.jsx`, `frontend/src/constants/routes.js`

---

## B. Kiến trúc & kỹ thuật

### B1. Backend tổ chức thế nào?

**Trả lời:**  
Theo module 3 lớp: **Routes → Controller → Service → Prisma**.  
Controller nhận request/validate tham số; Service chứa nghiệp vụ và truy vấn DB. Không query DB trực tiếp từ controller.

**Code:** `backend/src/modules/*`, `docs/PROJECT_STRUCTURE.md`

### B2. JWT lưu gì? Bảo vệ API ra sao?

**Trả lời:**  
Token mang `{ id, vai_tro }`, gửi qua header `Authorization: Bearer …`. Middleware auth giải mã; middleware/role hoặc kiểm tra trong service giới hạn tài nguyên (ví dụ đối tác chỉ thấy KS của mình).

**Code:** `backend/src/utils/jwt.js`, `backend/src/middlewares/auth.middleware.js`

### B3. Mật khẩu quy định thế nào?

**Trả lời:**  
Tối thiểu có chữ và số (theo validation hiện tại). Hash bằng bcrypt trước khi lưu. Có luồng quên mật khẩu / OTP email (cần cấu hình SMTP).

**Code:** `backend/src/utils/authValidation.js`, `backend/src/modules/auth/auth.service.js`

### B4. Database quan hệ chính?

**Trả lời (nêu 5–7 quan hệ):**  
`nguoi_dung` → `doi_tac` / khách hàng; `khach_san` thuộc đối tác; `loai_phong` thuộc KS; `dat_phong` gắn loại phòng + (tuỳ chọn) khách; `thanh_toan`, `hoan_tien`, `hoa_hong`, `khuyen_mai`, `bang_gia_phong`, `danh_gia`…

**Code:** `backend/prisma/schema.prisma`

---

## C. Đặt phòng & tồn kho (hay hỏi)

### C1. Luồng đặt phòng từ đầu đến cuối?

**Trả lời:**  
1. Tìm KS theo địa điểm + ngày + số khách/phòng  
2. Chọn KS → chọn loại phòng  
3. Xác nhận thông tin → tạo `dat_phong` (giữ chỗ)  
4. Thanh toán trong cửa sổ giữ chỗ  
5. Admin/đối tác theo dõi; đến ngày → check-in/out; sau trả phòng có thể tự hoàn thành  
6. Khách đánh giá (nếu đủ điều kiện)

### C2. Đặt không đăng nhập khác đặt đã login chỗ nào?

**Trả lời:**  
- **Đã login:** gắn `ma_khach_hang`, có thể tự áp KM lần đặt đầu nếu đủ điều kiện.  
- **Guest:** `ma_khach_hang = null`, nhận guest pay token để thanh toán; tra cứu đơn bằng OTP email.  
- Muốn áp KM: bắt đăng nhập → **claim** đơn vào tài khoản rồi mới áp mã.

**Code:** `customerBooking.service.js`, `guestBooking.service.js`, `CustomerPaymentPage.jsx` (+ `LoginForPromoModal`)

### C3. Giữ phòng bao lâu nếu chưa thanh toán?

**Trả lời:**  
**30 phút** với đơn thanh toán trực tuyến chưa thanh toán. Hết hạn: hệ thống dọn đơn (xóa giữ chỗ), hoàn lại lượt dùng KM nếu đã gắn mã.

**Code:** `backend/src/utils/unpaidBookingCleanup.js` (`PAY_HOLD_MS = 30 * 60 * 1000`)

### C4. Kiểm tra còn phòng thế nào?

**Trả lời:**  
Đếm số phòng đã được các đơn còn hiệu lực chiếm trong khoảng ngày chồng chéo, so với `so_luong_mo_ban` của loại phòng. Trước khi check còn gọi dọn đơn hết hạn để không “ảo” tồn kho.

**Code:** `bookingHelpers.js` (đếm overlap), `customerBooking.service.js` (create)

### C5. Claim guest booking là gì?

**Trả lời:**  
Gắn đơn guest vào tài khoản khách vừa đăng nhập (xác thực bằng guest pay token). Dùng khi guest muốn áp KM hoặc quản lý đơn trong “Đặt chỗ của tôi”.

**Code:** API claim-guest trong customer booking; UI ở trang thanh toán.

---

## D. Giá tiền & VAT (rất hay hỏi sâu)

### D1. Giá nhiều đêm tính thế nào?

**Trả lời:**  
Với mỗi đêm trong khoảng nhận–trả phòng: lấy đơn giá từ `bang_gia_phong` nếu có, không thì dùng `gia_co_ban`. Cộng các đêm → `tong_luong_tru`.

**Code:** `backend/src/utils/bookingHelpers.js` → `calcStayPrice`

### D2. Thứ tự tính hóa đơn?

**Trả lời:**  
1. Tiền phòng (đã × số phòng)  
2. \+ Phụ thu trẻ em (trẻ vượt tuổi miễn phí × phụ thu/đêm × số đêm)  
3. − Tiền giảm KM  
4. VAT trên phần **sau giảm**  
5. = `thanh_toan_cuoi`

**Code:** `backend/src/utils/stayPricing.js` → `buildStayInvoice`

### D3. Giá hiển thị trên list khác tổng lúc thanh toán?

**Trả lời:**  
Giá trên tìm kiếm/chi tiết KS/phòng: **tổng 1 phòng cho cả kỳ + VAT**, chưa gồm phụ thu trẻ em / nhiều phòng.  
Tổng thanh toán lúc book: đủ phụ thu trẻ, số phòng, KM.

**Code:** `publicHotel.service.js` → `mapRoomWithInvoice`

### D4. Ví dụ số (nên thuộc)

**Giả sử:**  
- Giá 300.000 VNĐ/đêm, ở 2 đêm → tiền phòng = 600.000  
- Không trẻ em, không KM, VAT 10%  

```
tam_tinh = 600.000
sau_giam = 600.000
VAT = 60.000
thanh_toan_cuoi = 660.000
```

**Thêm KM giảm 100.000:**  

```
sau_giam = 500.000
VAT = 50.000
thanh_toan_cuoi = 550.000
```

**Thêm 1 trẻ tính phụ thu 50.000/đêm × 2 đêm = 100.000 (trước KM):**  

```
tam_tinh = 600.000 + 100.000 = 700.000
```

---

## E. Khuyến mãi

### E1. KM hệ thống và KM đối tác khác nhau?

**Trả lời:**  
- **Hệ thống (`he_thong`):** admin tạo, áp rộng (theo rule), ảnh hưởng hoa hồng theo hướng sàn trợ giá.  
- **Đối tác (`doi_tac`):** gắn KS của đối tác; đối tác tạo/sửa; có thể bị admin khóa.

**Code:** `promotionRules.js`, `partnerPromotion.service.js`, admin promotions

### E2. KM lần đặt đầu?

**Trả lời:**  
Cờ `lan_dat_dau`; khi khách đã login tạo đơn và đủ điều kiện, hệ thống có thể tự gắn. Guest chưa có lịch sử theo tài khoản nên rule áp dụng theo ngữ cảnh đăng nhập.

**Code:** `promotionRules.js` (`FIRST_BOOKING_PROMO_END`), logic auto-apply trong `customerBooking.service.js`

### E3. Vì sao guest phải login mới áp mã?

**Trả lời (sản phẩm):**  
Tránh lạm dụng mã (1 tài khoản / 1 lượt), gắn lịch sử sử dụng KM với user, và thống nhất quản lý đơn sau thanh toán. Guest vẫn **xem** danh sách mã được; khi bấm áp → bắt login → claim → apply.

### E4. Admin khóa KM thì sao?

**Trả lời:**  
KM không còn áp dụng cho khách. Đối tác có thể vẫn sửa nội dung nhưng không tự mở khóa nếu admin đã khóa.

---

## F. Hủy đơn & hoàn tiền

### F1. Chính sách hoàn mặc định?

**Trả lời (nếu KS không cấu hình riêng):**  

| Hủy trước nhận phòng | % hoàn |
|----------------------|--------|
| ≥ 7 ngày | 100% |
| ≥ 3 ngày | 75% |
| ≥ 1 ngày | 50% |
| < 1 ngày / không khớp | 0% |

KS có thể cấu hình `chinh_sach_huy` riêng.

**Code:** `backend/src/utils/refundHelpers.js` → `DEFAULT_POLICIES`, `calcRefundFromPolicy`

### F2. Chưa thanh toán mà hủy?

**Trả lời:**  
Không phát sinh hoàn tiền; đơn/giữ chỗ được dọn, phòng trả về tồn kho.

### F3. Admin hủy thì hoàn bao nhiêu?

**Trả lời:**  
Đơn đã thanh toán bị admin hủy → hoàn **100%** (đánh dấu ghi chú `[Admin hủy]`).

### F4. Ai xử lý hoàn tiền trên hệ thống?

**Trả lời:**  
Sau hủy có bản ghi `hoan_tien` trạng thái chờ xử lý; **admin** xác nhận đã hoàn trên module tài chính/thanh toán.

---

## G. Tài chính / hoa hồng (điểm cộng nếu nắm)

### G1. Hoa hồng mặc định bao nhiêu?

**Trả lời:**  
Mặc định **15%**, hoặc theo `phan_tram_hoa_hong` của từng đối tác.

**Code:** `commissionHelpers.js` → `DEFAULT_COMMISSION_RATE = 15`

### G2. Công thức chia tiền (tóm tắt)?

**Trả lời:**  
- **Không KM / KM đối tác:** hoa hồng trên phần doanh thu sau khi trừ KM đối tác (theo breakdown trong code).  
- **KM hệ thống (admin):** hoa hồng trên **giá gốc**; sàn ghi nhận **trợ giá** = tiền giảm; đối tác vẫn nhận theo hướng không bị “gánh” hết KM sàn.  
- **Hủy có phạt (giữ lại một phần):** hoa hồng tính trên phần bị giữ lại.

**Code:** `calculateCommissionBreakdown` trong `commissionHelpers.js`

### G3. Luồng đối soát – thanh toán đối tác?

**Trả lời:**  
Trạng thái hoa hồng trong DB:  
`chua_thu` (chờ đối soát) → `da_thu` (đã đối soát) → `da_thanh_toan` (đã trả đối tác).  
Có thêm `tam_giu` khi cần tạm dừng (tranh chấp / nghi ngờ).  
Admin xác nhận đối soát trên UI “Tài chính”, sau đó xác nhận thanh toán đợt cho đối tác (cần đối tác có thông tin nhận tiền).

**Lưu ý trả lời:** tên cột DB là `chua_thu`/`da_thu` nhưng trên UI gọi là **đối soát**.

**Code:** `adminPayment.service.js`, Admin Finance pages

### G4. Ví dụ hoa hồng đơn giản

Đơn gốc 1.000.000, không KM, rate 15%:  
- Hoa hồng sàn ≈ 150.000  
- Đối tác nhận ≈ 850.000 (+ phần VAT tùy rule hiển thị trên phiếu)

*(Khi bảo vệ, nói “em lấy ví dụ làm tròn theo công thức trong `calculateCommissionBreakdown`”.)*

---

## H. Đối tác & Admin vận hành

### H1. Đối tác tạo khách sạn — có bán ngay không?

**Trả lời:**  
Không. Tạo xong ở trạng thái **chờ duyệt** (`cho_duyet`). Admin duyệt → `hoat_dong` mới hiện cho khách đặt. Admin có thể từ chối kèm lý do, hoặc khóa KS.

**Code:** `hotel.service.js` (create / approve / reject / lock)

### H2. Đối tác quản lý những gì?

**Trả lời:**  
Dashboard, KS, loại phòng, đơn đặt, **Giá & Kho** theo ngày, khuyến mãi, tài chính (xem kỳ thanh toán), đánh giá & phản hồi, tài khoản.

### H3. Admin quản lý những gì?

**Trả lời:**  
Người dùng/đối tác, duyệt KS, đơn toàn hệ thống, tiện nghi, loại phòng, đánh giá, khuyến mãi, tài chính (GD, hoàn, hoa hồng, payout), báo cáo, yêu cầu hợp tác.

### H4. Yêu cầu hợp tác từ đâu?

**Trả lời:**  
Form công khai “Hợp tác với chúng tôi” → admin xem/duyệt tại menu Hợp tác; có thể tạo tài khoản đối tác.

---

## I. Đánh giá

### I1. Khi nào khách được đánh giá?

**Trả lời:**  
Đơn ở trạng thái hoàn thành / đã lưu trú hợp lệ; mỗi đơn một đánh giá. Đơn auto-complete kiểu no-show có thể bị chặn đánh giá (theo rule trong service).

### I2. Có duyệt đánh giá trước khi hiện không?

**Trả lời thành thật:**  
Hiện tại đánh giá **hiển thị ngay** (`hien_thi`); admin có thể **ẩn** sau nếu vi phạm. Đây là mô hình hậu kiểm, không phải pre-moderation queue.

**Code:** create review + `adminReview.service.js`

---

## J. Thanh toán (câu “bẫy” — trả lời thẳng)

### J1. Hệ thống tích hợp cổng nào?

**Trả lời:**  
- **VNPay:** tích hợp redirect + kiểm tra chữ ký return (sandbox).  
- **MoMo / thẻ tín dụng (UI):** mô phỏng xác nhận thành công để demo đủ luồng; **chưa gọi cổng thật**.

### J2. VNPay an toàn thế nào?

**Trả lời:**  
Tạo URL thanh toán với tham số chuẩn; khi return, backend verify checksum/hash bằng `VNP_HASH_SECRET`, cập nhật trạng thái thanh toán/đơn tương ứng.

**Code:** `backend/src/utils/vnpay.js`

---

## K. Câu hỏi “điểm yếu / hướng phát triển”

### K1. Hạn chế của đồ án?

**Trả lời gợi ý (chọn 2–3):**  
1. MoMo/thẻ mới mô phỏng.  
2. OTP tra cứu guest lưu in-memory → restart server mất (chưa Redis).  
3. Đánh giá hậu kiểm, chưa hàng đợi duyệt trước.  
4. Chưa app mobile / thông báo realtime đầy đủ (WebSocket).  
5. Chưa đa tiền tệ / đa ngôn ngữ.

### K2. Hướng phát triển?

**Trả lời:**  
Tích hợp đủ cổng thanh toán; lưu OTP/session Redis; pre-moderation đánh giá; gợi ý KS bằng ML; báo cáo BI nâng cao; CI/CD + deploy cloud; giám sát lỗi (Sentry).

### K3. Bảo mật đã làm gì?

**Trả lời:**  
JWT + phân quyền; hash mật khẩu; validate input; tách portal; không commit `.env`; verify chữ ký VNPay; CORS theo `FRONTEND_URL`.

---

## L. Nếu thầy bảo “code giúp em phần …”

| Yêu cầu thường gặp | Mở file | Hàm / ý chính |
|--------------------|---------|----------------|
| Tính giá theo đêm | `bookingHelpers.js` | `calcStayPrice` |
| Hóa đơn VAT + trẻ + KM | `stayPricing.js` | `buildStayInvoice` |
| Giữ chỗ 30 phút | `unpaidBookingCleanup.js` | `expireUnpaidOnlineHolds` |
| % hoàn tiền | `refundHelpers.js` | `calcRefundFromPolicy` |
| Hoa hồng | `commissionHelpers.js` | `calculateCommissionBreakdown` |
| Rule KM | `promotionRules.js` | validate + first booking |
| Duyệt KS | `hotel.service.js` | `approveHotel` / `rejectHotel` |
| VNPay | `vnpay.js` | build URL + verify |
| Tạo đơn | `customerBooking.service.js` | `createBooking` |

**Cách trình bày khi code:**  
1. Nêu input/output  
2. Nói các bước (pseudo)  
3. Chỉ đúng hàm trong project  
4. Nêu edge case (hết phòng, hết hạn TT, KM hết lượt…)

---

## M. Kịch bản demo nên luyện (checklist)

- [ ] Tìm 1 đêm vs 2 đêm — giá nhân theo kỳ, nhãn `/ phòng / n đêm`  
- [ ] Đặt guest → thanh toán (ưu tiên VNPay sandbox)  
- [ ] Guest áp KM → login → claim → apply  
- [ ] Để đơn > 30 phút — mất giữ chỗ  
- [ ] Hủy đơn đã TT — xem % hoàn theo ngày  
- [ ] Partner tạo KS → Admin duyệt → hiện search  
- [ ] Partner đổi giá ngày → khách thấy đổi  
- [ ] Admin đối soát hoa hồng → (tuỳ chọn) tạm giữ / thanh toán đối tác  
- [ ] Đánh giá → Admin ẩn  

---

## N. Câu mở đầu 30 giây (học thuộc)

> Em xin trình bày hệ thống đặt phòng khách sạn nhiều bên. Khách tìm phòng theo ngày, đặt được cả khi chưa đăng nhập, thanh toán online. Đối tác quản lý khách sạn, giá theo ngày, kho phòng và khuyến mãi. Admin duyệt nội dung và đối soát hoa hồng – hoàn tiền – thanh toán đối tác. Phần lõi nghiệp vụ gồm tính giá từng đêm, giữ chỗ 30 phút, khuyến mãi, chính sách hủy/hoàn và chia hoa hồng theo loại mã giảm giá. Thanh toán tích hợp VNPay sandbox; một số phương thức khác trên giao diện chỉ phục vụ demo.

---

## O. Bảng thuật ngữ nhanh (DB ↔ UI)

| Trong DB | Trên UI / miệng nói |
|----------|---------------------|
| `cho_duyet` | Chờ duyệt (KS) |
| `hoat_dong` | Đang hoạt động / đang bán |
| `chua_thu` | Chờ đối soát (hoa hồng) |
| `da_thu` | Đã đối soát |
| `tam_giu` | Tạm giữ |
| `da_thanh_toan` | Đã thanh toán đối tác |
| `cho_xu_ly` (hoàn) | Chờ xử lý hoàn tiền |
| `thanh_cong` (TT) | Đã thanh toán |
| `lan_dat_dau` | Khuyến mãi lần đặt đầu |

---

*Cập nhật theo codebase đồ án Hotel Booking — dùng để ôn bảo vệ, không thay thế slide/báo cáo chính thức.*

# HƯỚNG DẪN CÀI ĐẶT VÀ SỬ DỤNG

## Hệ thống Đặt phòng Khách sạn (Hotel Booking System)

Tài liệu này hướng dẫn **cài đặt từ source code**, **cấu hình**, **chạy hệ thống** và **cách sử dụng cơ bản** theo từng vai trò (Khách hàng, Đối tác, Admin).

---

## Mục lục

1. [Giới thiệu hệ thống](#1-giới-thiệu-hệ-thống)
2. [Yêu cầu phần mềm](#2-yêu-cầu-phần-mềm)
3. [Cấu trúc thư mục source](#3-cấu-trúc-thư-mục-source)
4. [Bước 1 — Cài đặt môi trường](#4-bước-1--cài-đặt-môi-trường)
5. [Bước 2 — Tạo Database MySQL](#5-bước-2--tạo-database-mysql)
6. [Bước 3 — Cài đặt và cấu hình Backend](#6-bước-3--cài-đặt-và-cấu-hình-backend)
7. [Bước 4 — Cài đặt và cấu hình Frontend](#7-bước-4--cài-đặt-và-cấu-hình-frontend)
8. [Bước 5 — Chạy hệ thống](#8-bước-5--chạy-hệ-thống)
9. [Đường dẫn truy cập và tài khoản](#9-đường-dẫn-truy-cập-và-tài-khoản)
10. [Hướng dẫn sử dụng theo vai trò](#10-hướng-dẫn-sử-dụng-theo-vai-trò)
11. [Cấu hình tùy chọn (Email, Google, VNPay)](#11-cấu-hình-tùy-chọn-email-google-vnpay)
12. [Xử lý lỗi thường gặp](#12-xử-lý-lỗi-thường-gặp)
13. [Phụ lục — Lệnh nhanh](#13-phụ-lục--lệnh-nhanh)

---

## 1. Giới thiệu hệ thống

Hệ thống đặt phòng khách sạn gồm **3 vai trò**:

| Vai trò | Mô tả | Đường dẫn đăng nhập |
|--------|--------|---------------------|
| **Khách hàng** | Tìm khách sạn, đặt phòng, thanh toán, quản lý đơn | `/login` |
| **Đối tác** | Quản lý khách sạn, loại phòng, giá, đơn, khuyến mãi | `/partner/login` |
| **Admin** | Quản trị hệ thống, duyệt KS, tài chính, báo cáo | `/admin/login` |

**Công nghệ:**

- Frontend: React (Vite), Redux Toolkit, Axios
- Backend: Node.js, Express.js
- Database: MySQL
- ORM: Prisma
- Xác thực: JWT

---

## 2. Yêu cầu phần mềm

Trước khi cài đặt, máy tính cần có:

| Phần mềm | Phiên bản khuyến nghị | Mục đích |
|----------|----------------------|----------|
| **Node.js** | 18 LTS trở lên (khuyến nghị 20+) | Chạy Backend & Frontend |
| **npm** | Đi kèm Node.js | Cài thư viện |
| **MySQL** | 5.7 / 8.x (hoặc XAMPP / MySQL Workbench) | Cơ sở dữ liệu |
| **Trình duyệt** | Chrome / Edge / Firefox | Sử dụng web |
| **Git** (tuỳ chọn) | — | Mở / quản lý source |

### Kiểm tra đã cài chưa

Mở **Command Prompt** (Windows) hoặc Terminal, gõ:

```bash
node -v
npm -v
```

Nếu hiện số phiên bản (ví dụ `v20.x.x`) là đã cài Node.js thành công.

MySQL: khởi động dịch vụ MySQL (hoặc mở XAMPP → Start **MySQL**).

---

## 3. Cấu trúc thư mục source

Sau khi giải nén / mở project, cấu trúc chính:

```
LuanVanTotNghiep/
├── backend/                 # Máy chủ API (Node.js + Express + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma    # Schema database
│   │   ├── seed.js          # Seed dữ liệu mẫu (tuỳ chọn)
│   │   └── migrations/      # Migration
│   ├── src/                 # Mã nguồn backend
│   ├── .env.example         # Mẫu cấu hình môi trường
│   ├── package.json
│   └── server.js            # Điểm chạy server
├── frontend/                # Giao diện React (Vite)
│   ├── src/
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
└── docs/                    # Tài liệu hướng dẫn
```

---

## 4. Bước 1 — Cài đặt môi trường

### 4.1. Cài Node.js

1. Truy cập: https://nodejs.org  
2. Tải bản **LTS** → cài đặt (giữ mặc định).  
3. Mở lại Command Prompt → kiểm tra `node -v` và `npm -v`.

### 4.2. Cài MySQL

**Cách A — XAMPP (dễ với Windows):**

1. Tải XAMPP: https://www.apachefriends.org  
2. Cài đặt → mở **XAMPP Control Panel** → Start **MySQL**.  
3. User mặc định thường là `root`, mật khẩu rỗng (hoặc mật khẩu bạn đã đặt).

**Cách B — MySQL Server độc lập:**

1. Cài MySQL Community Server.  
2. Ghi nhớ user/password đã tạo khi cài.

---

## 5. Bước 2 — Tạo Database MySQL

### 5.1. Mở công cụ quản lý DB

- **phpMyAdmin** (nếu dùng XAMPP): http://localhost/phpmyadmin  
- hoặc **MySQL Workbench**  
- hoặc dòng lệnh `mysql -u root -p`

### 5.2. Tạo database

Chạy câu lệnh SQL:

```sql
CREATE DATABASE hotel_booking
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

> Tên database phải khớp với phần cuối của `DATABASE_URL` trong file `.env` (mặc định: `hotel_booking`).

---

## 6. Bước 3 — Cài đặt và cấu hình Backend

### 6.1. Mở terminal tại thư mục backend

```bash
cd đường/dẫn/tới/LuanVanTotNghiep/backend
```

Ví dụ trên Windows:

```bash
cd D:\BAOCAO\LuanVanTotNghiep\backend
```

### 6.2. Cài thư viện Node

```bash
npm install
```

Chờ đến khi hoàn tất (không còn lỗi đỏ).

### 6.3. Tạo file cấu hình `.env`

1. Copy file mẫu:

**Windows (CMD):**

```bash
copy .env.example .env
```

**Windows (PowerShell):**

```powershell
Copy-Item .env.example .env
```

**macOS / Linux:**

```bash
cp .env.example .env
```

2. Mở file `backend/.env` bằng Notepad / VS Code và chỉnh theo máy bạn:

```env
PORT=5000
DATABASE_URL="mysql://root:MAT_KHAU_MYSQL@localhost:3306/hotel_booking"
JWT_SECRET=dat_chuoi_bi_mat_dai_bat_ky
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

**Giải thích `DATABASE_URL`:**

```
mysql://[USER]:[PASSWORD]@[HOST]:[PORT]/[TÊN_DATABASE]
```

| Trường hợp | Ví dụ DATABASE_URL |
|------------|-------------------|
| XAMPP, root không mật khẩu | `mysql://root:@localhost:3306/hotel_booking` |
| Root có mật khẩu `123456` | `mysql://root:123456@localhost:3306/hotel_booking` |

> **Lưu ý:** Không commit / không nộp file `.env` nếu có thông tin nhạy cảm thật. Khi nộp đồ án có thể để `.env.example` và ghi rõ cách điền trong tài liệu này.

### 6.4. Tạo bảng trong Database (Prisma)

Chạy lần lượt:

```bash
npx prisma generate
npx prisma db push
```

- `prisma generate`: tạo Prisma Client  
- `prisma db push`: đồng bộ schema (`schema.prisma`) vào MySQL (tạo các bảng)

Nếu thành công, vào phpMyAdmin sẽ thấy các bảng như `nguoi_dung`, `khach_san`, `loai_phong`, `dat_phong`, …

### 6.5. (Tuỳ chọn) Seed dữ liệu mẫu

```bash
npm run seed:amenities
npm run seed
```

> Seed tiện nghi / khách sạn mẫu **chỉ chạy được khi đã có dữ liệu đối tác/admin phù hợp trong DB**. Nếu DB trống hoàn toàn, cần tạo tài khoản Admin/Đối tác trước (xem mục 9).

### 6.6. Chạy Backend

```bash
npm run dev
```

Thành công khi terminal hiện tương tự:

```text
Server đang chạy ở port 5000
```

API gốc: **http://localhost:5000/api**

> **Giữ cửa sổ terminal này mở** trong lúc dùng web.

---

## 7. Bước 4 — Cài đặt và cấu hình Frontend

### 7.1. Mở terminal mới tại thư mục frontend

```bash
cd đường/dẫn/tới/LuanVanTotNghiep/frontend
```

Ví dụ:

```bash
cd D:\BAOCAO\LuanVanTotNghiep\frontend
```

### 7.2. Cài thư viện

```bash
npm install
```

### 7.3. Tạo file `.env` (khuyến nghị)

```bash
copy .env.example .env
```

Nội dung tối thiểu (hoặc tạo mới file `frontend/.env`):

```env
VITE_API_URL=http://localhost:5000/api
```

> Nếu **không** tạo file này, frontend vẫn mặc định gọi `http://localhost:5000/api`.

### 7.4. Chạy Frontend

```bash
npm run dev
```

Thành công khi hiện địa chỉ dạng:

```text
Local: http://localhost:5173/
```

Mở trình duyệt vào: **http://localhost:5173**

---

## 8. Bước 5 — Chạy hệ thống

### Thứ tự đúng

1. Bật **MySQL** (XAMPP / dịch vụ MySQL)  
2. Chạy **Backend** (`cd backend` → `npm run dev`) — port **5000**  
3. Chạy **Frontend** (`cd frontend` → `npm run dev`) — port **5173**  
4. Mở trình duyệt: **http://localhost:5173**

### Sơ đồ

```
[Trình duyệt :5173]  --->  [Frontend React]
                               |
                               |  gọi API
                               v
                         [Backend :5000]
                               |
                               v
                         [MySQL hotel_booking]
```

### Dừng hệ thống

Trong mỗi terminal đang chạy: nhấn `Ctrl + C`.

---

## 9. Đường dẫn truy cập và tài khoản

### 9.1. Đường dẫn quan trọng

| Trang | URL |
|-------|-----|
| Trang chủ khách | http://localhost:5173/ |
| Đăng nhập khách | http://localhost:5173/login |
| Đăng ký khách | http://localhost:5173/register |
| Đăng nhập đối tác | http://localhost:5173/partner/login |
| Đăng nhập admin | http://localhost:5173/admin/login |
| Tra cứu đơn (khách vãng lai) | http://localhost:5173/guest-bookings |
| API Backend | http://localhost:5000/api |

### 9.2. Tài khoản demo

Hệ thống **không hard-code mật khẩu trong mã nguồn**. Người nộp đồ án cần **điền sẵn** tài khoản demo đã tạo trong DB trước khi nộp:

| Vai trò | URL đăng nhập | Email | Mật khẩu |
|--------|----------------|-------|----------|
| Admin | `/admin/login` | `…………………` | `…………………` |
| Đối tác | `/partner/login` | `…………………` | `…………………` |
| Khách hàng | `/login` | `…………………` | `…………………` |

**Cách tạo tài khoản khi DB mới:**

1. **Khách hàng:** vào `/register` → điền email, SĐT, mật khẩu (có chữ và số, đủ độ dài theo form).  
2. **Admin / Đối tác:** tạo qua module Admin (Người dùng → tạo đối tác) hoặc thêm trực tiếp vào bảng `nguoi_dung` (mật khẩu đã hash bcrypt) — tuỳ quy trình đồ án.

> Nên chuẩn bị sẵn 3 tài khoản demo trước buổi bảo vệ / khi nộp kèm source.

---

## 10. Hướng dẫn sử dụng theo vai trò

### 10.1. Khách hàng

1. Mở trang chủ → chọn địa điểm, ngày nhận/trả, số khách → Tìm kiếm.  
2. Chọn khách sạn → chọn loại phòng → **Đặt phòng**.  
3. Trang xác nhận: điền thông tin người nhận → **Tiếp tục đặt phòng**.  
4. Trang thanh toán: chọn phương thức (VNPay / các phương thức demo) → thanh toán trong **30 phút**.  
5. Có thể đặt **không đăng nhập**; tra cứu đơn tại **Đặt chỗ của tôi** (guest) hoặc sau khi login xem **Đặt chỗ của tôi**.  
6. Hủy đơn / xem hoàn tiền / đánh giá (khi đơn đủ điều kiện) trong khu vực tài khoản.

### 10.2. Đối tác

1. Đăng nhập `/partner/login`.  
2. **Khách sạn:** tạo/sửa KS (thường chờ Admin duyệt mới bán).  
3. **Loại phòng:** thêm phòng, ảnh, tiện nghi, số lượng mở bán.  
4. **Giá & Kho:** chỉnh giá theo ngày.  
5. **Đặt phòng:** xem/xử lý đơn.  
6. **Khuyến mãi:** tạo mã giảm giá.  
7. **Tài chính / Đánh giá / Tài khoản:** theo dõi doanh thu, phản hồi đánh giá, đổi mật khẩu.

### 10.3. Admin

1. Đăng nhập `/admin/login`.  
2. **Người dùng:** quản lý tài khoản, tạo/khóa đối tác.  
3. **Khách sạn:** duyệt / khóa KS.  
4. **Đặt phòng:** giám sát đơn toàn hệ thống.  
5. **Tiện nghi / Loại phòng / Đánh giá / Khuyến mãi.**  
6. **Tài chính:** giao dịch, hoàn tiền, đối soát hoa hồng, thanh toán đối tác.  
7. **Báo cáo / Hợp tác:** báo cáo nghiệp vụ và duyệt yêu cầu hợp tác.

---

## 11. Cấu hình tùy chọn (Email, Google, VNPay)

Các mục sau **không bắt buộc** để chạy xem giao diện và luồng cơ bản. Chỉ cần khi muốn đủ tính năng nâng cao.

### 11.1. Gửi email (OTP đăng ký / quên mật khẩu)

Trong `backend/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-gmail-app-password
MAIL_FROM=Hotel Booking <your-gmail@gmail.com>
```

> Gmail cần **App Password**, không dùng mật khẩu đăng nhập thường.

### 11.2. Đăng nhập Google (khách hàng)

- Backend `.env`: `GOOGLE_CLIENT_ID=...`  
- Frontend `.env`: `VITE_GOOGLE_CLIENT_ID=...` (cùng Client ID)

### 11.3. Thanh toán VNPay (sandbox)

Trong `backend/.env`:

```env
VNP_TMN_CODE=your_tmn_code
VNP_HASH_SECRET=your_hash_secret
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_RETURN_URL=http://localhost:5000/api/customer/payments/vnpay/return
```

> Một số phương thức thanh toán trên UI có thể chỉ phục vụ **demo**; VNPay sandbox là cổng tích hợp thật khi cấu hình đủ.

---

## 12. Xử lý lỗi thường gặp

| Triệu chứng | Nguyên nhân thường gặp | Cách xử lý |
|-------------|------------------------|------------|
| `Can't reach database server` / lỗi Prisma kết nối | MySQL chưa bật hoặc sai `DATABASE_URL` | Start MySQL; kiểm tra user/password/tên DB |
| `Server đang chạy ở port 5000` không hiện | Lỗi `.env` hoặc port bị chiếm | Đọc log lỗi; đổi `PORT` hoặc tắt process cũ |
| Frontend trắng / không load dữ liệu | Backend chưa chạy hoặc sai `VITE_API_URL` | Chạy backend trước; kiểm tra `.env` frontend |
| `EPERM` khi `prisma generate` (Windows) | File Prisma đang bị process khác giữ | Tắt `npm run dev` backend → chạy lại `npx prisma generate` → chạy lại backend |
| Đăng nhập không vào được | Sai portal (khách/đối tác/admin) hoặc sai mật khẩu | Dùng đúng URL login theo vai trò |
| Ảnh không hiện | Backend tắt hoặc đường dẫn upload | Đảm bảo backend chạy; kiểm tra thư mục uploads |
| Port 5173 / 5000 đã dùng | Process cũ còn chạy | `Ctrl+C` terminal cũ, hoặc đổi port |

### Kiểm tra nhanh Backend có sống không

Mở trình duyệt: http://localhost:5000/api  

(Có thể trả về 404 JSON — miễn là **không** báo “không kết nối được” là server đang chạy.)

---

## 13. Phụ lục — Lệnh nhanh

### Cài đặt lần đầu (tóm tắt)

```bash
# 1) MySQL: tạo database hotel_booking

# 2) Backend
cd backend
npm install
copy .env.example .env
# → sửa DATABASE_URL, JWT_SECRET trong .env
npx prisma generate
npx prisma db push
npm run dev

# 3) Frontend (terminal khác)
cd frontend
npm install
copy .env.example .env
# → (tuỳ chọn) VITE_API_URL=http://localhost:5000/api
npm run dev
```

### Mỗi lần mở lại để dùng

```bash
# Terminal 1
cd backend
npm run dev

# Terminal 2
cd frontend
npm run dev
```

Rồi mở: **http://localhost:5173**

---

## Ghi chú khi nộp source code

1. Nộp đủ thư mục `backend/`, `frontend/`, `docs/`.  
2. **Không bắt buộc** nộp `node_modules/` (dung lượng lớn) — người chấm sẽ tự `npm install`.  
3. Nên kèm file hướng dẫn này (`docs/HUONG_DAN_CAI_DAT_VA_SU_DUNG.md`) hoặc xuất ra **Word (.docx)**.  
4. Điền sẵn bảng **tài khoản demo** (mục 9.2) trước khi nộp.  
5. Có thể kèm file `.env.example` (đã có sẵn); nếu nộp `.env` mẫu thì chỉ dùng mật khẩu demo, không dùng mật khẩu thật.

---

*Tài liệu hướng dẫn cài đặt và sử dụng — Hệ thống Đặt phòng Khách sạn (Luận văn tốt nghiệp).*

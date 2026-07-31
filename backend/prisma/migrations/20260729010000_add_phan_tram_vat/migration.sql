-- Thêm % VAT vào chính sách khách sạn (dùng chung mọi loại phòng)
ALTER TABLE `chinh_sach_khach_san`
  ADD COLUMN `phan_tram_vat` DECIMAL(5, 2) NOT NULL DEFAULT 10.00;

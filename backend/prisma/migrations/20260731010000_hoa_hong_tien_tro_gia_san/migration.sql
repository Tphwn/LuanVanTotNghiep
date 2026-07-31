-- Trợ giá voucher admin (marketing) — tách với hoa hồng lý thuyết (so_tien_hoa_hong)
ALTER TABLE `hoa_hong`
  ADD COLUMN `tien_tro_gia_san` DECIMAL(12, 0) NOT NULL DEFAULT 0 AFTER `so_tien_hoa_hong`;

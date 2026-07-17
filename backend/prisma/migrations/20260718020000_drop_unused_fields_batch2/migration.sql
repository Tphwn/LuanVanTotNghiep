-- 1) khuyen_mai.nguong_ap_dung (unused; overlapped with don_hang_toi_thieu)
ALTER TABLE `khuyen_mai` DROP COLUMN `nguong_ap_dung`;

-- 2+3) danh_gia: drop unused moderation fields + cho_duyet enum value
UPDATE `danh_gia` SET `trang_thai` = 'hien_thi' WHERE `trang_thai` = 'cho_duyet';

ALTER TABLE `danh_gia` DROP FOREIGN KEY `fk_dg_admin`;
ALTER TABLE `danh_gia` DROP INDEX `fk_dg_admin`;
ALTER TABLE `danh_gia` DROP COLUMN `duyet_boi_id`;
ALTER TABLE `danh_gia` DROP COLUMN `ngay_duyet`;

ALTER TABLE `danh_gia`
  MODIFY COLUMN `trang_thai` ENUM('hien_thi', 'an') NOT NULL DEFAULT 'hien_thi';

-- 4) dia_diem.mo_ta (unused)
ALTER TABLE `dia_diem` DROP COLUMN `mo_ta`;

-- 5) chinh_sach_huy.mo_ta (unused)
ALTER TABLE `chinh_sach_huy` DROP COLUMN `mo_ta`;

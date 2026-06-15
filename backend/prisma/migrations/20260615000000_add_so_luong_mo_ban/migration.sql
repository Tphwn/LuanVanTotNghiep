-- AlterTable
ALTER TABLE `loai_phong` ADD COLUMN `so_luong_mo_ban` INTEGER NOT NULL DEFAULT 0;

-- Khởi tạo: mở bán = tổng phòng cho loại đang hoạt động
UPDATE `loai_phong` SET `so_luong_mo_ban` = `so_luong_phong` WHERE `trang_thai` = 'hoat_dong';

-- Audit khóa/mở khóa khuyến mãi bởi admin
ALTER TABLE `khuyen_mai`
    ADD COLUMN `khoa_boi_admin` BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN `khoa_boi_id` INT NULL,
    ADD COLUMN `thoi_gian_khoa` DATETIME(0) NULL,
    ADD COLUMN `mo_khoa_boi_id` INT NULL,
    ADD COLUMN `thoi_gian_mo_khoa` DATETIME(0) NULL,
    ADD INDEX `fk_km_khoaboi` (`khoa_boi_id`),
    ADD INDEX `fk_km_mokhoaboi` (`mo_khoa_boi_id`),
    ADD CONSTRAINT `fk_km_khoaboi` FOREIGN KEY (`khoa_boi_id`) REFERENCES `nguoi_dung`(`ma_nguoi_dung`) ON DELETE RESTRICT ON UPDATE RESTRICT,
    ADD CONSTRAINT `fk_km_mokhoaboi` FOREIGN KEY (`mo_khoa_boi_id`) REFERENCES `nguoi_dung`(`ma_nguoi_dung`) ON DELETE RESTRICT ON UPDATE RESTRICT;

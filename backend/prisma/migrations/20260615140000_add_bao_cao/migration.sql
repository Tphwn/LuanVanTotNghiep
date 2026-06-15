-- CreateTable
CREATE TABLE `bao_cao` (
    `ma_bao_cao` INTEGER NOT NULL AUTO_INCREMENT,
    `ma_khach_hang` INTEGER NULL,
    `ma_dat_phong` INTEGER NULL,
    `ma_khach_san` INTEGER NULL,
    `loai_bao_cao` ENUM('khach_san', 'dat_phong', 'dich_vu', 'lua_dao', 'khac') NOT NULL DEFAULT 'khac',
    `tieu_de` VARCHAR(200) NOT NULL,
    `noi_dung` TEXT NOT NULL,
    `minh_chung` VARCHAR(255) NULL,
    `trang_thai` ENUM('cho_xu_ly', 'da_chap_nhan', 'tu_choi') NOT NULL DEFAULT 'cho_xu_ly',
    `admin_xu_ly_id` INTEGER NULL,
    `phan_hoi_admin` TEXT NULL,
    `ngay_bao_cao` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `ngay_xu_ly` DATETIME(0) NULL,

    INDEX `fk_bc_kh`(`ma_khach_hang`),
    INDEX `fk_bc_dp`(`ma_dat_phong`),
    INDEX `fk_bc_ks`(`ma_khach_san`),
    INDEX `fk_bc_admin`(`admin_xu_ly_id`),
    INDEX `idx_bc_trang_thai`(`trang_thai`),
    PRIMARY KEY (`ma_bao_cao`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `bao_cao` ADD CONSTRAINT `fk_bc_kh` FOREIGN KEY (`ma_khach_hang`) REFERENCES `khach_hang`(`ma_khach_hang`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `bao_cao` ADD CONSTRAINT `fk_bc_dp` FOREIGN KEY (`ma_dat_phong`) REFERENCES `dat_phong`(`ma_dat_phong`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `bao_cao` ADD CONSTRAINT `fk_bc_ks` FOREIGN KEY (`ma_khach_san`) REFERENCES `khach_san`(`ma_khach_san`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `bao_cao` ADD CONSTRAINT `fk_bc_admin` FOREIGN KEY (`admin_xu_ly_id`) REFERENCES `nguoi_dung`(`ma_nguoi_dung`) ON DELETE RESTRICT ON UPDATE RESTRICT;

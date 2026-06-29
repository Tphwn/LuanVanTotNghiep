-- CreateTable
CREATE TABLE `yeu_cau_hop_tac` (
    `ma_yeu_cau` INTEGER NOT NULL AUTO_INCREMENT,
    `ho_ten` VARCHAR(100) NOT NULL,
    `so_dien_thoai` VARCHAR(15) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `ten_co_so` VARCHAR(150) NOT NULL,
    `quy_mo` VARCHAR(50) NOT NULL,
    `tinh_thanh` VARCHAR(100) NOT NULL,
    `ghi_chu` TEXT NULL,
    `trang_thai` ENUM('cho_xu_ly', 'da_lien_he', 'tu_choi', 'da_hop_tac') NOT NULL DEFAULT 'cho_xu_ly',
    `admin_xu_ly_id` INTEGER NULL,
    `phan_hoi` TEXT NULL,
    `ngay_yeu_cau` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `ngay_xu_ly` DATETIME(0) NULL,

    INDEX `idx_ycht_trang_thai`(`trang_thai`),
    INDEX `fk_ycht_admin`(`admin_xu_ly_id`),
    PRIMARY KEY (`ma_yeu_cau`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `yeu_cau_hop_tac` ADD CONSTRAINT `fk_ycht_admin` FOREIGN KEY (`admin_xu_ly_id`) REFERENCES `nguoi_dung`(`ma_nguoi_dung`) ON DELETE RESTRICT ON UPDATE RESTRICT;

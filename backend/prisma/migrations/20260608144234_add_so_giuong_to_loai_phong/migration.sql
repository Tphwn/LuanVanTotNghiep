-- CreateTable
CREATE TABLE `bang_gia_phong` (
    `ma_bang_gia` INTEGER NOT NULL AUTO_INCREMENT,
    `ma_loai_phong` INTEGER NOT NULL,
    `ngay` DATE NOT NULL,
    `don_gia` DECIMAL(12, 0) NOT NULL,
    `loai_gia` ENUM('co_ban', 'cuoi_tuan', 'le_tet', 'cao_diem') NOT NULL DEFAULT 'co_ban',
    `ngay_tao` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_bgp`(`ma_loai_phong`, `ngay`),
    PRIMARY KEY (`ma_bang_gia`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chi_tiet_dat_phong` (
    `ma_chi_tiet` INTEGER NOT NULL AUTO_INCREMENT,
    `ma_dat_phong` INTEGER NOT NULL,
    `ngay` DATE NOT NULL,
    `don_gia` DECIMAL(12, 0) NOT NULL,
    `loai_gia` ENUM('co_ban', 'cuoi_tuan', 'le_tet', 'cao_diem') NOT NULL DEFAULT 'co_ban',

    UNIQUE INDEX `uq_ctdp`(`ma_dat_phong`, `ngay`),
    PRIMARY KEY (`ma_chi_tiet`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chinh_sach_huy` (
    `ma_chinh_sach` INTEGER NOT NULL AUTO_INCREMENT,
    `ma_khach_san` INTEGER NOT NULL,
    `so_ngay_truoc` INTEGER NOT NULL,
    `phan_tram_hoan` DECIMAL(5, 2) NOT NULL,
    `mo_ta` TEXT NULL,
    `trang_thai` ENUM('hoat_dong', 'an') NOT NULL DEFAULT 'hoat_dong',

    INDEX `fk_csh_ks`(`ma_khach_san`),
    PRIMARY KEY (`ma_chinh_sach`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `danh_gia` (
    `ma_danh_gia` INTEGER NOT NULL AUTO_INCREMENT,
    `ma_dat_phong` INTEGER NOT NULL,
    `ma_khach_hang` INTEGER NOT NULL,
    `duyet_boi_id` INTEGER NULL,
    `so_sao` TINYINT NOT NULL,
    `diem_sach_se` TINYINT NULL,
    `diem_dich_vu` TINYINT NULL,
    `diem_vi_tri` TINYINT NULL,
    `noi_dung` TEXT NULL,
    `phan_hoi_doi_tac` TEXT NULL,
    `ngay_phan_hoi` DATETIME(0) NULL,
    `trang_thai` ENUM('cho_duyet', 'hien_thi', 'an') NOT NULL DEFAULT 'cho_duyet',
    `ngay_danh_gia` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `ngay_duyet` DATETIME(0) NULL,

    UNIQUE INDEX `ma_dat_phong`(`ma_dat_phong`),
    INDEX `fk_dg_admin`(`duyet_boi_id`),
    INDEX `fk_dg_kh`(`ma_khach_hang`),
    PRIMARY KEY (`ma_danh_gia`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dat_phong` (
    `ma_dat_phong` INTEGER NOT NULL AUTO_INCREMENT,
    `ma_khach_hang` INTEGER NOT NULL,
    `ma_loai_phong` INTEGER NOT NULL,
    `ma_khuyen_mai` INTEGER NULL,
    `ma_don_hang` VARCHAR(20) NOT NULL,
    `ma_xac_nhan` VARCHAR(20) NULL,
    `ngay_nhan_phong` DATE NOT NULL,
    `ngay_tra_phong` DATE NOT NULL,
    `so_khach` INTEGER NOT NULL,
    `ten_nguoi_nhan` VARCHAR(100) NOT NULL,
    `sdt_nguoi_nhan` VARCHAR(15) NOT NULL,
    `tong_tien_goc` DECIMAL(12, 0) NOT NULL,
    `tien_giam` DECIMAL(12, 0) NOT NULL DEFAULT 0,
    `thanh_toan_cuoi` DECIMAL(12, 0) NOT NULL,
    `phuong_thuc_tt` ENUM('truc_tuyen', 'tai_khach_san') NOT NULL,
    `trang_thai` ENUM('cho_xac_nhan', 'da_xac_nhan', 'tu_choi', 'hoan_thanh', 'da_huy') NOT NULL DEFAULT 'cho_xac_nhan',
    `ghi_chu` TEXT NULL,
    `ngay_dat` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `ma_don_hang`(`ma_don_hang`),
    INDEX `fk_dp_kh`(`ma_khach_hang`),
    INDEX `fk_dp_km`(`ma_khuyen_mai`),
    INDEX `fk_dp_lp`(`ma_loai_phong`),
    PRIMARY KEY (`ma_dat_phong`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dia_diem` (
    `ma_dia_diem` INTEGER NOT NULL AUTO_INCREMENT,
    `ten_dia_diem` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NULL,
    `tinh_thanh` VARCHAR(100) NULL,
    `quoc_gia` VARCHAR(100) NULL,
    `mo_ta` TEXT NULL,

    PRIMARY KEY (`ma_dia_diem`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `doi_tac` (
    `ma_doi_tac` INTEGER NOT NULL AUTO_INCREMENT,
    `ma_nguoi_dung` INTEGER NOT NULL,
    `nguoi_cap_id` INTEGER NOT NULL,
    `ten_cong_ty` VARCHAR(150) NOT NULL,
    `ma_so_thue` VARCHAR(20) NULL,
    `so_dien_thoai` VARCHAR(15) NULL,
    `dia_chi` TEXT NULL,
    `trang_thai` ENUM('hoat_dong', 'bi_khoa') NOT NULL DEFAULT 'hoat_dong',
    `ngay_cap_tai_khoan` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `ma_nguoi_dung`(`ma_nguoi_dung`),
    INDEX `fk_dt_nguoicap`(`nguoi_cap_id`),
    PRIMARY KEY (`ma_doi_tac`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hinh_anh` (
    `ma_hinh_anh` INTEGER NOT NULL AUTO_INCREMENT,
    `loai_doi_tuong` ENUM('khach_san', 'loai_phong') NOT NULL,
    `ma_doi_tuong` INTEGER NOT NULL,
    `url` VARCHAR(255) NOT NULL,
    `la_anh_chinh` BOOLEAN NOT NULL DEFAULT false,
    `thu_tu` INTEGER NOT NULL DEFAULT 0,
    `ngay_tao` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`ma_hinh_anh`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hoa_hong` (
    `ma_hoa_hong` INTEGER NOT NULL AUTO_INCREMENT,
    `ma_dat_phong` INTEGER NOT NULL,
    `ma_doi_tac` INTEGER NOT NULL,
    `ty_le_hoa_hong` DECIMAL(5, 2) NOT NULL,
    `so_tien_hoa_hong` DECIMAL(12, 0) NOT NULL,
    `trang_thai` ENUM('chua_thu', 'da_thu') NOT NULL DEFAULT 'chua_thu',
    `ngay_tinh` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `ma_dat_phong`(`ma_dat_phong`),
    INDEX `fk_hh_dt`(`ma_doi_tac`),
    PRIMARY KEY (`ma_hoa_hong`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hoan_tien` (
    `ma_hoan_tien` INTEGER NOT NULL AUTO_INCREMENT,
    `ma_dat_phong` INTEGER NOT NULL,
    `ma_thanh_toan` INTEGER NOT NULL,
    `xu_ly_boi_id` INTEGER NULL,
    `so_tien_hoan` DECIMAL(12, 0) NOT NULL,
    `ly_do` TEXT NULL,
    `trang_thai` ENUM('cho_xu_ly', 'dang_xu_ly', 'da_hoan', 'tu_choi') NOT NULL DEFAULT 'cho_xu_ly',
    `ngay_yeu_cau` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `ngay_xu_ly` DATETIME(0) NULL,

    UNIQUE INDEX `ma_dat_phong`(`ma_dat_phong`),
    INDEX `fk_ht_admin`(`xu_ly_boi_id`),
    INDEX `fk_ht_tt`(`ma_thanh_toan`),
    PRIMARY KEY (`ma_hoan_tien`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `khach_hang` (
    `ma_khach_hang` INTEGER NOT NULL AUTO_INCREMENT,
    `ma_nguoi_dung` INTEGER NOT NULL,
    `ho_ten` VARCHAR(100) NOT NULL,
    `anh_dai_dien` VARCHAR(255) NULL,
    `ngay_sinh` DATE NULL,
    `gioi_tinh` ENUM('nam', 'nu', 'khac') NULL,
    `tong_tien_da_chi` DECIMAL(12, 0) NOT NULL DEFAULT 0,
    `tong_lan_dat` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `ma_nguoi_dung`(`ma_nguoi_dung`),
    PRIMARY KEY (`ma_khach_hang`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `khach_hang_khuyen_mai` (
    `ma_kh_km` INTEGER NOT NULL AUTO_INCREMENT,
    `ma_khach_hang` INTEGER NOT NULL,
    `ma_khuyen_mai` INTEGER NOT NULL,
    `trang_thai` ENUM('chua_dung', 'da_dung', 'het_han') NOT NULL DEFAULT 'chua_dung',
    `ngay_cap` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `ngay_su_dung` DATETIME(0) NULL,

    INDEX `fk_khkm_km`(`ma_khuyen_mai`),
    UNIQUE INDEX `uq_kh_km`(`ma_khach_hang`, `ma_khuyen_mai`),
    PRIMARY KEY (`ma_kh_km`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `khach_san` (
    `ma_khach_san` INTEGER NOT NULL AUTO_INCREMENT,
    `ma_doi_tac` INTEGER NOT NULL,
    `ma_dia_diem` INTEGER NOT NULL,
    `duyet_boi_admin_id` INTEGER NULL,
    `ten` VARCHAR(150) NOT NULL,
    `dia_chi` TEXT NOT NULL,
    `mo_ta` TEXT NULL,
    `so_sao` TINYINT NULL,
    `gio_nhan_phong` TIME(0) NULL,
    `gio_tra_phong` TIME(0) NULL,
    `trang_thai` ENUM('cho_duyet', 'da_duyet', 'tu_choi', 'yeu_cau_sua', 'hoat_dong', 'bi_khoa') NOT NULL DEFAULT 'cho_duyet',
    `ly_do_tu_choi` TEXT NULL,
    `ngay_tao` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `ngay_duyet` DATETIME(0) NULL,

    INDEX `fk_ks_admin`(`duyet_boi_admin_id`),
    INDEX `fk_ks_diadiem`(`ma_dia_diem`),
    INDEX `fk_ks_doitac`(`ma_doi_tac`),
    PRIMARY KEY (`ma_khach_san`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `khach_san_tien_nghi` (
    `ma_ks_tien_nghi` INTEGER NOT NULL AUTO_INCREMENT,
    `ma_khach_san` INTEGER NOT NULL,
    `ma_tien_nghi` INTEGER NOT NULL,

    INDEX `fk_kstn_tn`(`ma_tien_nghi`),
    UNIQUE INDEX `uq_ks_tn`(`ma_khach_san`, `ma_tien_nghi`),
    PRIMARY KEY (`ma_ks_tien_nghi`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `khuyen_mai` (
    `ma_khuyen_mai` INTEGER NOT NULL AUTO_INCREMENT,
    `tao_boi_id` INTEGER NOT NULL,
    `ma_khach_san` INTEGER NULL,
    `ma_code` VARCHAR(30) NOT NULL,
    `ten` VARCHAR(100) NOT NULL,
    `loai_nguon` ENUM('he_thong', 'doi_tac') NOT NULL,
    `loai_giam` ENUM('phan_tram', 'so_tien') NOT NULL,
    `gia_tri` DECIMAL(10, 2) NOT NULL,
    `giam_toi_da` DECIMAL(12, 0) NULL,
    `don_hang_toi_thieu` DECIMAL(12, 0) NOT NULL DEFAULT 0,
    `nguong_ap_dung` DECIMAL(12, 0) NULL,
    `ngay_bat_dau` DATE NOT NULL,
    `ngay_ket_thuc` DATE NOT NULL,
    `so_luot_toi_da` INTEGER NULL,
    `so_luot_da_dung` INTEGER NOT NULL DEFAULT 0,
    `trang_thai` ENUM('hoat_dong', 'het_han', 'an') NOT NULL DEFAULT 'hoat_dong',

    UNIQUE INDEX `ma_code`(`ma_code`),
    INDEX `fk_km_ks`(`ma_khach_san`),
    INDEX `fk_km_taoboi`(`tao_boi_id`),
    PRIMARY KEY (`ma_khuyen_mai`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loai_phong` (
    `ma_loai_phong` INTEGER NOT NULL AUTO_INCREMENT,
    `ma_khach_san` INTEGER NOT NULL,
    `ten_loai` VARCHAR(100) NOT NULL,
    `dien_tich` DECIMAL(5, 1) NULL,
    `suc_chua` INTEGER NOT NULL,
    `so_luong_phong` INTEGER NOT NULL,
    `so_giuong` INTEGER NULL,
    `gia_co_ban` DECIMAL(12, 0) NOT NULL,
    `mo_ta` TEXT NULL,
    `trang_thai` ENUM('hoat_dong', 'an') NOT NULL DEFAULT 'hoat_dong',
    `ngay_tao` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_lp_ks`(`ma_khach_san`),
    PRIMARY KEY (`ma_loai_phong`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loai_phong_tien_nghi` (
    `ma_lp_tien_nghi` INTEGER NOT NULL AUTO_INCREMENT,
    `ma_loai_phong` INTEGER NOT NULL,
    `ma_tien_nghi` INTEGER NOT NULL,

    INDEX `fk_lptn_tn`(`ma_tien_nghi`),
    UNIQUE INDEX `uq_lp_tn`(`ma_loai_phong`, `ma_tien_nghi`),
    PRIMARY KEY (`ma_lp_tien_nghi`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `nguoi_dung` (
    `ma_nguoi_dung` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(100) NOT NULL,
    `so_dien_thoai` VARCHAR(15) NOT NULL,
    `mat_khau` VARCHAR(255) NOT NULL,
    `vai_tro` ENUM('khach_hang', 'doi_tac', 'admin') NOT NULL,
    `trang_thai` ENUM('hoat_dong', 'bi_khoa') NOT NULL DEFAULT 'hoat_dong',
    `otp_code` VARCHAR(10) NULL,
    `otp_het_han` DATETIME(0) NULL,
    `reset_token` VARCHAR(255) NULL,
    `token_het_han` DATETIME(0) NULL,
    `ngay_tao` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `dang_nhap_cuoi` DATETIME(0) NULL,

    UNIQUE INDEX `email`(`email`),
    UNIQUE INDEX `so_dien_thoai`(`so_dien_thoai`),
    PRIMARY KEY (`ma_nguoi_dung`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `thanh_toan` (
    `ma_thanh_toan` INTEGER NOT NULL AUTO_INCREMENT,
    `ma_dat_phong` INTEGER NOT NULL,
    `so_tien` DECIMAL(12, 0) NOT NULL,
    `ma_giao_dich` VARCHAR(100) NULL,
    `phuong_thuc` VARCHAR(50) NOT NULL,
    `trang_thai` ENUM('cho', 'thanh_cong', 'that_bai') NOT NULL DEFAULT 'cho',
    `thoi_gian` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `ma_dat_phong`(`ma_dat_phong`),
    PRIMARY KEY (`ma_thanh_toan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `thong_bao` (
    `ma_thong_bao` INTEGER NOT NULL AUTO_INCREMENT,
    `ma_nguoi_dung` INTEGER NOT NULL,
    `ma_dat_phong` INTEGER NULL,
    `tieu_de` VARCHAR(200) NOT NULL,
    `noi_dung` TEXT NOT NULL,
    `loai` ENUM('dat_phong', 'thanh_toan', 'danh_gia', 'khuyen_mai', 'he_thong', 'tien_nghi') NOT NULL,
    `da_doc` BOOLEAN NOT NULL DEFAULT false,
    `ngay_gui` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_tb_dp`(`ma_dat_phong`),
    INDEX `fk_tb_nd`(`ma_nguoi_dung`),
    PRIMARY KEY (`ma_thong_bao`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tien_nghi` (
    `ma_tien_nghi` INTEGER NOT NULL AUTO_INCREMENT,
    `ten` VARCHAR(100) NOT NULL,
    `bieu_tuong` VARCHAR(100) NULL,
    `loai` ENUM('khach_san', 'phong', 'ca_hai') NOT NULL,
    `trang_thai` ENUM('hoat_dong', 'an') NOT NULL DEFAULT 'hoat_dong',
    `ngay_tao` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`ma_tien_nghi`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `yeu_cau_tien_nghi` (
    `ma_yeu_cau` INTEGER NOT NULL AUTO_INCREMENT,
    `ma_doi_tac` INTEGER NOT NULL,
    `admin_xu_ly_id` INTEGER NULL,
    `tien_nghi_tao_id` INTEGER NULL,
    `ten_de_xuat` VARCHAR(100) NOT NULL,
    `mo_ta` TEXT NULL,
    `trang_thai` ENUM('cho_xu_ly', 'da_tao', 'tu_choi') NOT NULL DEFAULT 'cho_xu_ly',
    `phan_hoi` TEXT NULL,
    `ngay_yeu_cau` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `ngay_phan_hoi` DATETIME(0) NULL,

    INDEX `fk_yctn_admin`(`admin_xu_ly_id`),
    INDEX `fk_yctn_doitac`(`ma_doi_tac`),
    INDEX `fk_yctn_tiennghi`(`tien_nghi_tao_id`),
    PRIMARY KEY (`ma_yeu_cau`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `bang_gia_phong` ADD CONSTRAINT `fk_bgp_lp` FOREIGN KEY (`ma_loai_phong`) REFERENCES `loai_phong`(`ma_loai_phong`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `chi_tiet_dat_phong` ADD CONSTRAINT `fk_ctdp_dp` FOREIGN KEY (`ma_dat_phong`) REFERENCES `dat_phong`(`ma_dat_phong`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `chinh_sach_huy` ADD CONSTRAINT `fk_csh_ks` FOREIGN KEY (`ma_khach_san`) REFERENCES `khach_san`(`ma_khach_san`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `danh_gia` ADD CONSTRAINT `fk_dg_admin` FOREIGN KEY (`duyet_boi_id`) REFERENCES `nguoi_dung`(`ma_nguoi_dung`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `danh_gia` ADD CONSTRAINT `fk_dg_dp` FOREIGN KEY (`ma_dat_phong`) REFERENCES `dat_phong`(`ma_dat_phong`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `danh_gia` ADD CONSTRAINT `fk_dg_kh` FOREIGN KEY (`ma_khach_hang`) REFERENCES `khach_hang`(`ma_khach_hang`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `dat_phong` ADD CONSTRAINT `fk_dp_kh` FOREIGN KEY (`ma_khach_hang`) REFERENCES `khach_hang`(`ma_khach_hang`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `dat_phong` ADD CONSTRAINT `fk_dp_km` FOREIGN KEY (`ma_khuyen_mai`) REFERENCES `khuyen_mai`(`ma_khuyen_mai`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `dat_phong` ADD CONSTRAINT `fk_dp_lp` FOREIGN KEY (`ma_loai_phong`) REFERENCES `loai_phong`(`ma_loai_phong`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `doi_tac` ADD CONSTRAINT `fk_dt_nguoicap` FOREIGN KEY (`nguoi_cap_id`) REFERENCES `nguoi_dung`(`ma_nguoi_dung`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `doi_tac` ADD CONSTRAINT `fk_dt_nguoidung` FOREIGN KEY (`ma_nguoi_dung`) REFERENCES `nguoi_dung`(`ma_nguoi_dung`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `hoa_hong` ADD CONSTRAINT `fk_hh_dp` FOREIGN KEY (`ma_dat_phong`) REFERENCES `dat_phong`(`ma_dat_phong`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `hoa_hong` ADD CONSTRAINT `fk_hh_dt` FOREIGN KEY (`ma_doi_tac`) REFERENCES `doi_tac`(`ma_doi_tac`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `hoan_tien` ADD CONSTRAINT `fk_ht_admin` FOREIGN KEY (`xu_ly_boi_id`) REFERENCES `nguoi_dung`(`ma_nguoi_dung`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `hoan_tien` ADD CONSTRAINT `fk_ht_dp` FOREIGN KEY (`ma_dat_phong`) REFERENCES `dat_phong`(`ma_dat_phong`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `hoan_tien` ADD CONSTRAINT `fk_ht_tt` FOREIGN KEY (`ma_thanh_toan`) REFERENCES `thanh_toan`(`ma_thanh_toan`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `khach_hang` ADD CONSTRAINT `fk_kh_nguoidung` FOREIGN KEY (`ma_nguoi_dung`) REFERENCES `nguoi_dung`(`ma_nguoi_dung`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `khach_hang_khuyen_mai` ADD CONSTRAINT `fk_khkm_kh` FOREIGN KEY (`ma_khach_hang`) REFERENCES `khach_hang`(`ma_khach_hang`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `khach_hang_khuyen_mai` ADD CONSTRAINT `fk_khkm_km` FOREIGN KEY (`ma_khuyen_mai`) REFERENCES `khuyen_mai`(`ma_khuyen_mai`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `khach_san` ADD CONSTRAINT `fk_ks_admin` FOREIGN KEY (`duyet_boi_admin_id`) REFERENCES `nguoi_dung`(`ma_nguoi_dung`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `khach_san` ADD CONSTRAINT `fk_ks_diadiem` FOREIGN KEY (`ma_dia_diem`) REFERENCES `dia_diem`(`ma_dia_diem`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `khach_san` ADD CONSTRAINT `fk_ks_doitac` FOREIGN KEY (`ma_doi_tac`) REFERENCES `doi_tac`(`ma_doi_tac`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `khach_san_tien_nghi` ADD CONSTRAINT `fk_kstn_ks` FOREIGN KEY (`ma_khach_san`) REFERENCES `khach_san`(`ma_khach_san`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `khach_san_tien_nghi` ADD CONSTRAINT `fk_kstn_tn` FOREIGN KEY (`ma_tien_nghi`) REFERENCES `tien_nghi`(`ma_tien_nghi`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `khuyen_mai` ADD CONSTRAINT `fk_km_ks` FOREIGN KEY (`ma_khach_san`) REFERENCES `khach_san`(`ma_khach_san`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `khuyen_mai` ADD CONSTRAINT `fk_km_taoboi` FOREIGN KEY (`tao_boi_id`) REFERENCES `nguoi_dung`(`ma_nguoi_dung`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `loai_phong` ADD CONSTRAINT `fk_lp_ks` FOREIGN KEY (`ma_khach_san`) REFERENCES `khach_san`(`ma_khach_san`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `loai_phong_tien_nghi` ADD CONSTRAINT `fk_lptn_lp` FOREIGN KEY (`ma_loai_phong`) REFERENCES `loai_phong`(`ma_loai_phong`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `loai_phong_tien_nghi` ADD CONSTRAINT `fk_lptn_tn` FOREIGN KEY (`ma_tien_nghi`) REFERENCES `tien_nghi`(`ma_tien_nghi`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `thanh_toan` ADD CONSTRAINT `fk_tt_dp` FOREIGN KEY (`ma_dat_phong`) REFERENCES `dat_phong`(`ma_dat_phong`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `thong_bao` ADD CONSTRAINT `fk_tb_dp` FOREIGN KEY (`ma_dat_phong`) REFERENCES `dat_phong`(`ma_dat_phong`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `thong_bao` ADD CONSTRAINT `fk_tb_nd` FOREIGN KEY (`ma_nguoi_dung`) REFERENCES `nguoi_dung`(`ma_nguoi_dung`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `yeu_cau_tien_nghi` ADD CONSTRAINT `fk_yctn_admin` FOREIGN KEY (`admin_xu_ly_id`) REFERENCES `nguoi_dung`(`ma_nguoi_dung`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `yeu_cau_tien_nghi` ADD CONSTRAINT `fk_yctn_doitac` FOREIGN KEY (`ma_doi_tac`) REFERENCES `doi_tac`(`ma_doi_tac`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `yeu_cau_tien_nghi` ADD CONSTRAINT `fk_yctn_tiennghi` FOREIGN KEY (`tien_nghi_tao_id`) REFERENCES `tien_nghi`(`ma_tien_nghi`) ON DELETE RESTRICT ON UPDATE RESTRICT;

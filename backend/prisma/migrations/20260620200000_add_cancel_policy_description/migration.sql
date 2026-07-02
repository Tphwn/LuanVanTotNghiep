-- AlterTable
ALTER TABLE `khach_san`
    ADD COLUMN `hoan_khi_benh` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `hoan_cong_viec_dot_xuat` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `yeu_cau_minh_chung_huy` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `mo_ta_chinh_sach_huy` TEXT NULL;

-- AlterTable: mở rộng enum trạng thái + thêm cột lý do cho khuyến mãi
ALTER TABLE `khuyen_mai`
    MODIFY `trang_thai` ENUM('cho_duyet', 'hoat_dong', 'tu_choi', 'het_han', 'an') NOT NULL DEFAULT 'hoat_dong',
    ADD COLUMN `ly_do` VARCHAR(255) NULL;

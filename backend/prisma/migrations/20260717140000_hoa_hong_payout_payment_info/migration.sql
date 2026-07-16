-- Thông tin xác nhận thanh toán đối tác trên từng bản ghi hoa hồng
ALTER TABLE `hoa_hong`
  ADD COLUMN `phuong_thuc_tt_doi_tac` VARCHAR(80) NULL,
  ADD COLUMN `ma_gd_doi_tac` VARCHAR(100) NULL;

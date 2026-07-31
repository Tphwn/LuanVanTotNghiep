-- Thêm số lượng từng loại giường; giữ so_giuong = tổng
ALTER TABLE `loai_phong`
  ADD COLUMN `so_giuong_don` INT NOT NULL DEFAULT 0,
  ADD COLUMN `so_giuong_doi` INT NOT NULL DEFAULT 0,
  ADD COLUMN `so_giuong_lon` INT NOT NULL DEFAULT 0;

-- Dữ liệu cũ: gán toàn bộ so_giuong vào giường đôi
UPDATE `loai_phong`
SET
  `so_giuong_doi` = `so_giuong`,
  `so_giuong_don` = 0,
  `so_giuong_lon` = 0;

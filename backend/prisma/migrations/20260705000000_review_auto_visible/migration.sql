-- Đánh giá hiển thị ngay, không còn trạng thái chờ duyệt
UPDATE `danh_gia` SET `trang_thai` = 'hien_thi' WHERE `trang_thai` = 'cho_duyet';

ALTER TABLE `danh_gia` MODIFY COLUMN `trang_thai` ENUM('cho_duyet', 'hien_thi', 'an') NOT NULL DEFAULT 'hien_thi';

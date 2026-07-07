import { ChevronLeft, ChevronRight } from 'lucide-react';

const ListPagination = ({
  total,
  currentPage,
  totalPages,
  rangeFrom,
  rangeTo,
  pageNumbers,
  onPageChange,
}) => (
  <div className="mgmt-list-pagination">
    <span className="mgmt-list-pagination-info">
      Hiển thị {rangeFrom}–{rangeTo} / {total}
    </span>
    <div className="mgmt-list-pagination-controls">
      <button
        type="button"
        className="mgmt-page-btn"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        aria-label="Trang trước"
      >
        <ChevronLeft size={16} />
      </button>
      {pageNumbers.map((num) => (
        <button
          key={num}
          type="button"
          className={`mgmt-page-btn${num === currentPage ? ' is-active' : ''}`}
          onClick={() => onPageChange(num)}
        >
          {num}
        </button>
      ))}
      <button
        type="button"
        className="mgmt-page-btn"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        aria-label="Trang sau"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  </div>
);

export default ListPagination;

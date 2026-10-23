import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({ page, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    // Build a compact page list: 1 ... 4 5 [6] 7 8 ... 20
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
            return pages;
        }

        pages.push(1);
        if (page > 3) pages.push("...");

        const start = Math.max(2, page - 1);
        const end = Math.min(totalPages - 1, page + 1);
        for (let i = start; i <= end; i++) pages.push(i);

        if (page < totalPages - 2) pages.push("...");
        pages.push(totalPages);

        return pages;
    };

    return (
        <div className="pagination">
            <button
                className="page-btn"
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
            >
                <ChevronLeft size={18} />
            </button>

            {getPageNumbers().map((p, i) =>
                p === "..." ? (
                    <span key={`ellipsis-${i}`} className="page-ellipsis">
                        …
                    </span>
                ) : (
                    <button
                        key={p}
                        className={`page-btn ${p === page ? "active" : ""}`}
                        onClick={() => onPageChange(p)}
                    >
                        {p}
                    </button>
                ),
            )}

            <button
                className="page-btn"
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages}
            >
                <ChevronRight size={18} />
            </button>
        </div>
    );
};

export default Pagination;
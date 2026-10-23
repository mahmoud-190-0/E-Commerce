import React, { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useCategories } from "../../context/useCategories";
import CategoryCard from "../../Components/Categories/CategoryCard";
import Pagination from "../../Components/Categories/Pagination";
import { CategorySkeleton } from "../../Components/Categories/Skeleton";
import "./categoriesPage.css";

const SORT_OPTIONS = [
  { value: "-createdAt", label: "Newest" },
  { value: "name", label: "Name A → Z" },
  { value: "-name", label: "Name Z → A" },
];

const LIMIT_OPTIONS = [12, 24, 48];

const Categories = () => {
  const {
    categories,
    loading,
    error,
    pagination,
    params,
    updateParams,
    refetch,
  } = useCategories();

  const [searchInput, setSearchInput] = useState("");

  // Debounced keyword update
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateParams({ keyword: searchInput.trim(), page: 1 });
  };

  const handleClearSearch = () => {
    setSearchInput("");
    updateParams({ keyword: "", page: 1 });
  };

  return (
    <div className="categories-page">
      {/* Header */}
      <header className="categories-header">
        <div>
          <h1>Categories</h1>
          <p>Browse all product categories in our store</p>
        </div>
        <span className="result-count">
          {!loading && `${pagination.total} categories`}
        </span>
      </header>

      {/* Toolbar */}
      <div className="categories-toolbar">
        <form className="search-form" onSubmit={handleSearchSubmit}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button
              type="button"
              className="clear-btn"
              onClick={handleClearSearch}
              aria-label="Clear search">
              <X size={16} />
            </button>
          )}
        </form>

        <div className="toolbar-controls">
          <div className="control-group">
            <SlidersHorizontal size={16} />
            <select
              value={params.sort}
              onChange={(e) => updateParams({ sort: e.target.value })}>
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <select
              value={params.limit}
              onChange={(e) =>
                updateParams({
                  limit: Number(e.target.value),
                  page: 1,
                })
              }>
              {LIMIT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} per page
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Active filters */}
      {params.keyword && (
        <div className="active-filters">
          <span className="filter-pill">
            Search: "{params.keyword}"
            <button onClick={handleClearSearch}>
              <X size={14} />
            </button>
          </span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="error-state">
          <p>{error}</p>
          <button onClick={refetch} className="retry-btn">
            Try again
          </button>
        </div>
      )}

      {/* Grid */}
      <div className="categories-grid">
        {loading
          ? Array.from({ length: params.limit }).map((_, i) => (
              <CategorySkeleton key={i} />
            ))
          : categories.map((cat) => (
              <CategoryCard key={cat._id} category={cat} />
            ))}
      </div>

      {/* Empty state */}
      {!loading && !error && categories.length === 0 && (
        <div className="empty-state">
          <h3>No categories found</h3>
          <p>
            {params.keyword
              ? `No results for "${params.keyword}"`
              : "Try adjusting your filters"}
          </p>
          {params.keyword && (
            <button className="retry-btn" onClick={handleClearSearch}>
              Clear search
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && categories.length > 0 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={(p) => {
            updateParams({ page: p });
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}
    </div>
  );
};

export default Categories;

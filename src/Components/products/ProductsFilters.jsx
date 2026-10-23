import { useEffect, useState } from "react";
import { getCategories } from "../../services/categoryService.js";
import { getBrands } from "../../services/brandService";

const RATING_OPTIONS = [4, 3, 2, 1];

export default function ProductsFilters({
  filters,
  activeFilterCount,
  onFilterChange,
  onApplyFilters,
  onClear,
  open,
  onOpen,
  onClose,
}) {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // Load filter options once. Guard against unmount.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [cRes, bRes] = await Promise.all([getCategories(), getBrands()]);
        if (!alive) return;
        setCategories(cRes?.data?.data ?? cRes?.data?.results ?? []);
        setBrands(bRes?.data?.data ?? bRes?.data?.results ?? []);
      } catch {
        // Non-fatal: filters simply won't show options.
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const body = (
    <div className="filters">
      <div className="filters__head">
        <h2>Filters</h2>
        {activeFilterCount > 0 && (
          <button type="button" onClick={onClear} className="filters__clear">
            Clear all ({activeFilterCount})
          </button>
        )}
      </div>

      <section className="filters__group">
        <h3>Category</h3>
        <label className="filters__option">
          <input
            type="radio"
            name="category"
            checked={filters.category === ""}
            onChange={() => onFilterChange("category", "")}
          />
          <span>All</span>
        </label>
        {categories.map((c) => (
          <label key={c._id} className="filters__option">
            <input
              type="radio"
              name="category"
              checked={filters.category === c._id}
              onChange={() => onFilterChange("category", c._id)}
            />
            <span>{c.name}</span>
          </label>
        ))}
      </section>

      <section className="filters__group">
        <h3>Brand</h3>
        <label className="filters__option">
          <input
            type="radio"
            name="brand"
            checked={filters.brand === ""}
            onChange={() => onFilterChange("brand", "")}
          />
          <span>All</span>
        </label>
        {brands.map((b) => (
          <label key={b._id} className="filters__option">
            <input
              type="radio"
              name="brand"
              checked={filters.brand === b._id}
              onChange={() => onFilterChange("brand", b._id)}
            />
            <span>{b.name}</span>
          </label>
        ))}
      </section>

      <section className="filters__group">
        <h3>Price</h3>
        <div className="filters__price">
          <input
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => onFilterChange("minPrice", e.target.value)}
            aria-label="Minimum price"
          />
          <span>–</span>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => onFilterChange("maxPrice", e.target.value)}
            aria-label="Maximum price"
          />
        </div>
      </section>

      {/* Rating filter — backend supports ratingsAverage[gte] via ApiFeatures. */}
      <section className="filters__group">
        <h3>Rating</h3>
        {RATING_OPTIONS.map((r) => (
          <label key={r} className="filters__option">
            <input
              type="radio"
              name="minRating"
              checked={filters.minRating === String(r)}
              onChange={() => onFilterChange("minRating", String(r))}
            />
            <span>{r}★ & up</span>
          </label>
        ))}
        <label className="filters__option">
          <input
            type="radio"
            name="minRating"
            checked={filters.minRating === ""}
            onChange={() => onFilterChange("minRating", "")}
          />
          <span>Any</span>
        </label>
      </section>

      {/* In-stock — backend supports quantity[gt] via ApiFeatures. */}
      <section className="filters__group">
        <label className="filters__option">
          <input
            type="checkbox"
            checked={filters.inStock}
            onChange={(e) => onFilterChange("inStock", e.target.checked)}
          />
          <span>In stock only</span>
        </label>
      </section>

      <div className="filters__actions">
        <button
          type="button"
          className="btn btn--primary"
          onClick={onApplyFilters}>
          Apply filters
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        className="filters__toggle"
        onClick={onOpen}
        aria-label="Open filters">
        Filters{" "}
        {activeFilterCount > 0 && (
          <span className="badge">{activeFilterCount}</span>
        )}
      </button>

      <aside className="filters__desktop">{body}</aside>

      {open && (
        <div
          className="filters__overlay"
          role="dialog"
          aria-modal="true"
          onClick={onClose}>
          <div className="filters__drawer" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="filters__close"
              onClick={onClose}
              aria-label="Close filters">
              ×
            </button>
            {body}
          </div>
        </div>
      )}
    </>
  );
}

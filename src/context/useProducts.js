import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getProducts } from "../services/productService";

const DEFAULT_LIMIT = 6;

const INITIAL_FILTERS = {
  keyword: "",
  category: "",
  brand: "",
  minPrice: "",
  maxPrice: "",
  minRating: "",
  inStock: false,
  sort: "-createdAt",
};

export default function useProducts(initial = {}) {
  const [filters, setFilters] = useState({ ...INITIAL_FILTERS, ...initial });
  const [page, setPage] = useState(1);
  const [limit] = useState(DEFAULT_LIMIT);

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debounced keyword so typing doesn't hammer the API.
  const [debouncedKeyword, setDebouncedKeyword] = useState(filters.keyword);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(filters.keyword), 400);
    return () => clearTimeout(t);
  }, [filters.keyword]);

  // Build the query object exactly as the backend expects.
  const query = useMemo(() => {
    const q = { page, limit, sort: filters.sort };
    if (debouncedKeyword.trim()) q.keyword = debouncedKeyword.trim();
    if (filters.category) q.category = filters.category;
    if (filters.brand) q.brand = filters.brand;

    // MongoDB-style operators. Backend uses `price[gte]` / `price[lte]`.
    if (filters.minPrice !== "") q["price[gte]"] = filters.minPrice;
    if (filters.maxPrice !== "") q["price[lte]"] = filters.maxPrice;

    if (filters.minRating !== "") q["ratingsAverage[gte]"] = filters.minRating;
    if (filters.inStock) q["quantity[gt]"] = 0;

    return q;
  }, [
    page,
    limit,
    filters.sort,
    filters.category,
    filters.brand,
    filters.minPrice,
    filters.maxPrice,
    filters.minRating,
    filters.inStock,
    debouncedKeyword,
  ]);

  // Stale-response protection.
  const requestIdRef = useRef(0);

  const fetchProducts = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await getProducts(query);
      if (requestId !== requestIdRef.current) return; // stale — drop
      const body = res?.data ?? {};
      setProducts(Array.isArray(body.data) ? body.data : []);
      setPagination(body.paginationResult ?? null);
      setTotalResults(typeof body.results === "number" ? body.results : 0);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      // Do not leak raw backend messages to the UI.
      setError("We couldn't load products. Please try again.");
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Any filter change (not page/limit) resets to page 1.
  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    if (key !== "sort") setPage(1);
  }, []);

  const updateFilters = useCallback((patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ ...INITIAL_FILTERS });
    setPage(1);
  }, []);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.category) n++;
    if (filters.brand) n++;
    if (filters.minPrice !== "") n++;
    if (filters.maxPrice !== "") n++;
    if (filters.minRating !== "") n++;
    if (filters.inStock) n++;
    return n;
  }, [filters]);

  return {
    products,
    pagination,
    totalResults,
    loading,
    error,
    filters,
    page,
    limit,
    activeFilterCount,
    setPage,
    updateFilter,
    updateFilters,
    clearFilters,
    refetch: fetchProducts,
  };
}

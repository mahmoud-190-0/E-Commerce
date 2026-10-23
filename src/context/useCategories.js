import { useEffect, useState, useCallback } from "react";
import { getCategories } from "../services/categoryService";

export const useCategories = (initialParams = {}) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  const [params, setParams] = useState({
    page: 1,
    limit: 12,
    sort: "-createdAt",
    keyword: "",
    ...initialParams,
  });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getCategories(params);
      setCategories(data.data || []);
      setPagination({
        page: params.page,
        limit: params.limit,
        total: data.results || 0,
        totalPages: data.paginationResult?.numberOfPages || 1,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const updateParams = (updates) => {
    setParams((prev) => ({
      ...prev,
      ...updates,
      // Reset to page 1 whenever filters change
      page: updates.page ?? 1,
    }));
  };

  return {
    categories,
    loading,
    error,
    pagination,
    params,
    updateParams,
    refetch: fetchCategories,
  };
};

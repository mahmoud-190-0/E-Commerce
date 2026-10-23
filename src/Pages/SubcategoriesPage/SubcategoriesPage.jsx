import { useEffect, useState, useCallback, useMemo, memo } from "react";
import { Link, useParams } from "react-router-dom";
import { getCategory,getCategorySubcategories } from "../../services/categoryService";
import { getProducts } from "../../services/productService";
import "./SubcategoriesPage.css";

// ✅ Hoisted — built once, not per-card
const FALLBACK_IMAGE =
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
            <rect width="400" height="300" fill="#F1F5F9"/>
            <g fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="160" y="110" width="80" height="80" rx="8"/>
                <circle cx="180" cy="130" r="6"/>
                <polyline points="240 170 210 140 170 190"/>
            </g>
            <text x="200" y="230" text-anchor="middle" fill="#94A3B8" font-family="Arial" font-size="14">
                No Image
            </text>
        </svg>
    `);

const SubcategoriesPage = () => {
    const { categoryId } = useParams();

    const [subcategories, setSubcategories] = useState([]);
    const [categoryName, setCategoryName] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("default");

    // ✅ Debounce search
    useEffect(() => {
        const id = setTimeout(() => setSearchTerm(searchInput), 250);
        return () => clearTimeout(id);
    }, [searchInput]);

   const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
        // ✅ Fetch subcategories + category name in parallel
        const [subsRes, catRes] = await Promise.all([
            getCategorySubcategories(categoryId), // ← changed
            getCategory(categoryId).catch(() => null),
        ]);

        const subs = subsRes?.data?.data || [];
        setSubcategories(Array.isArray(subs) ? subs : []);

        if (catRes?.data?.data?.name) {
            setCategoryName(catRes.data.data.name);
        }

        // ✅ Only fetch products if subcategories don't already have imageCover
        const needImages = subs.some((s) => !s.imageCover);
        if (needImages && subs.length > 0) {
            const ids = subs.map((s) => s._id);
            
            // ✅ use "subcategories" (array) to match the schema
            const prodRes = await getProducts({
                subcategories: { $in: ids },
                limit: 200,
                fields: "imageCover subcategories",
            });

            const products = prodRes?.data?.data || [];

            // ✅ Group first product per subcategory
            const imageBySub = {};
            const countBySub = {};
            
            products.forEach((p) => {
                // ✅ product.subcategories is an array
                const subIds = (p.subcategories || [])
                    .map((s) => s?._id || s)
                    .filter(Boolean);
                
                subIds.forEach((subId) => {
                    if (!imageBySub[subId]) {
                        imageBySub[subId] = p.imageCover || "";
                    }
                    countBySub[subId] = (countBySub[subId] || 0) + 1;
                });
            });

            setSubcategories((prev) =>
                prev.map((s) => ({
                    ...s,
                    imageCover: s.imageCover || imageBySub[s._id] || "",
                    productsCount: s.productsCount ?? countBySub[s._id] ?? 0,
                })),
            );
        }
    } catch (err) {
        setError(
            err?.response?.data?.message ||
                "Failed to load subcategories. Please try again.",
        );
    } finally {
        setLoading(false);
    }
}, [categoryId]);
    useEffect(() => {
        if (categoryId) fetchData();
    }, [categoryId, fetchData]);

    // ✅ Memoize the filtered/sorted list
    const filteredSubcategories = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return subcategories
            .filter((sub) => (sub.name || "").toLowerCase().includes(term))
            .sort((a, b) => {
                if (sortBy === "name-asc")
                    return (a.name || "").localeCompare(b.name || "");
                if (sortBy === "name-desc")
                    return (b.name || "").localeCompare(a.name || "");
                if (sortBy === "newest")
                    return (
                        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
                    );
                return 0;
            });
    }, [subcategories, searchTerm, sortBy]);

    return (
        <div className="subcategories-page">
            {/* Hero */}
            <div className="subcategories-hero">
                <div className="subcategories-hero-bg">
                    <div className="shape shape-1"></div>
                    <div className="shape shape-2"></div>
                </div>

                <div className="container">
                    <nav className="breadcrumb" aria-label="Breadcrumb">
                        <Link to="/">Home</Link>
                        <span className="sep">/</span>
                        <Link to="/categories">Categories</Link>
                        <span className="sep">/</span>
                        <span className="current">
                            {categoryName || "Subcategories"}
                        </span>
                    </nav>

                    <div className="hero-content">
                        <h1 className="hero-title1">
                            {categoryName || "Subcategories"}
                        </h1>
                        <p className="hero-subtitle">
                            Discover all available subcategories
                        </p>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="container">
                <div className="subcategories-toolbar">
                    <div className="toolbar-left">
                        <span className="results-count">
                            {filteredSubcategories.length}{" "}
                            {filteredSubcategories.length === 1
                                ? "result"
                                : "results"}
                        </span>
                    </div>

                    <div className="toolbar-right">
                        <div className="search-box">
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search for a subcategory..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                            />
                            {searchInput && (
                                <button
                                    className="clear-search"
                                    onClick={() => setSearchInput("")}
                                    aria-label="Clear search"
                                >
                                    ×
                                </button>
                            )}
                        </div>

                        <select
                            className="sort-select"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="default">Default sorting</option>
                            <option value="name-asc">Name (A - Z)</option>
                            <option value="name-desc">Name (Z - A)</option>
                            <option value="newest">Newest</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container subcategories-content">
                {loading && <SkeletonGrid />}

                {!loading && error && (
                    <div className="state-box error-state">
                        <h3>An error occurred</h3>
                        <p>{error}</p>
                        <button className="btn btn-primary" onClick={fetchData}>
                            Try again
                        </button>
                    </div>
                )}

                {!loading && !error && filteredSubcategories.length === 0 && (
                    <div className="state-box empty-state">
                        <h3>No subcategories found</h3>
                        <p>
                            {searchTerm
                                ? "No results match your search"
                                : "No subcategories have been added to this category yet"}
                        </p>
                        {searchTerm && (
                            <button
                                className="btn btn-outline"
                                onClick={() => setSearchInput("")}
                            >
                                Clear search
                            </button>
                        )}
                    </div>
                )}

                {!loading && !error && filteredSubcategories.length > 0 && (
                    <div className="subcategories-grid">
                        {filteredSubcategories.map((sub, index) => (
                            <SubcategoryCard
                                key={sub._id}
                                subcategory={sub}
                                index={index}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

/* ===== Subcategory Card (memoized) ===== */
const SubcategoryCard = memo(({ subcategory, index }) => {
    const { _id, name, imageCover, description, productsCount } = subcategory;
    const coverImage = imageCover || FALLBACK_IMAGE;

    return (
        <Link
            to={`/subcategories/${_id}`}
            className="subcategory-card fade-in"
            style={{ animationDelay: `${Math.min(index, 12) * 50}ms` }}
        >
            <div className="subcategory-image-wrap">
                <img
                    src={coverImage}
                    alt={name}
                    loading="lazy"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = FALLBACK_IMAGE;
                    }}
                />

                {productsCount > 0 && (
                    <span className="products-badge">
                        {productsCount} products
                    </span>
                )}
            </div>

            <div className="subcategory-body">
                <h3 className="subcategory-name">{name}</h3>
                {typeof description === "string" && description && (
                    <p className="subcategory-desc">
                        {description.length > 80
                            ? `${description.slice(0, 80)}...`
                            : description}
                    </p>
                )}

                <div className="subcategory-footer">
                    <span className="view-link">
                        View products
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                        </svg>
                    </span>
                </div>
            </div>
        </Link>
    );
});

SubcategoryCard.displayName = "SubcategoryCard";

/* ===== Skeleton ===== */
const SkeletonGrid = () => (
    <div className="subcategories-grid">
        {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="subcategory-card skeleton-card">
                <div className="skeleton skeleton-image"></div>
                <div className="subcategory-body">
                    <div className="skeleton skeleton-title"></div>
                    <div className="skeleton skeleton-text"></div>
                    <div className="skeleton skeleton-text short"></div>
                </div>
            </div>
        ))}
    </div>
);

export default SubcategoriesPage;
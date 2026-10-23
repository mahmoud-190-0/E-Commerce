import React from "react";

const Skeleton = ({ width = "100%", height = "16px", radius = "8px" }) => (
    <div
        className="skeleton"
        style={{ width, height, borderRadius: radius }}
    />
);

export const CategorySkeleton = () => (
    <div className="category-card skeleton-card">
        <Skeleton height="180px" radius="12px 12px 0 0" />
        <div className="category-card-body">
            <Skeleton width="60%" height="18px" />
            <Skeleton width="40%" height="14px" />
        </div>
    </div>
);

export default Skeleton;
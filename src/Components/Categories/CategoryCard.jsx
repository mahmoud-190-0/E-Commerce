import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const CategoryCard = ({ category }) => {
    return (
        <Link to={`/categories/${category._id}`} className="category-card">
            <div className="category-card-image">
                <img
                    src={category.image || "/placeholder-category.png"}
                    alt={category.name}
                    loading="lazy"
                    onError={(e) => {
                        e.target.src = "/placeholder-category.png";
                    }}
                />
            </div>

            <div className="category-card-body">
                <h3 className="category-card-title">{category.name}</h3>
                {category.slug && (
                    <p className="category-card-slug">#{category.slug}</p>
                )}

                <span className="category-card-cta">
                    Explore <ArrowRight size={16} />
                </span>
            </div>
        </Link>
    );
};

export default CategoryCard;
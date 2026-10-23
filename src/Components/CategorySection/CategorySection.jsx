import React, { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader, AlertCircle } from 'lucide-react';

import { getCategories } from '../../services/categoryService';
import './CategorySection.css';


const CategorySection = () => {
  
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const response =await getCategories();
        console.log('Categories Data:', response.data);
         
        // Extract data from response
        const categoriesData = response.data.data || [];
        setCategories(categoriesData);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load categories');
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Handle category click
  const handleCategoryClick = (categoryId) => {
    navigate(`/categories/${categoryId}`);
  };

  // Get valid image URL
  const getValidImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
  
    return `http://localhost:5000${imageUrl}`;
  };

  // Loading State
  if (loading) {
    return (
      <section className="category-section1">
        <div className="category-container1">
          <div className="category-header1">
            <h2 className="category-title1">Shop By Category</h2>
          </div>
          <div className="loading-container1">
            <Loader size={48} className="spinning1" />
            <p>Loading categories...</p>
          </div>
        </div>
      </section>
    );
  }

  // Error State
  if (error) {
    return (
      <section className="category-section1">
        <div className="category-container1">
          <div className="category-header1">
            <h2 className="category-title1">Shop By Category</h2>
          </div>
          <div className="error-container1">
            <AlertCircle size={48} className="error-icon1" />
            <p className="error-message1">Error on loading categories...</p>
            <button 
              className="retry-button1"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Empty State
  if (categories.length === 0) {
    return (
      <section className="category-section1">
        <div className="category-container1">
          <div className="category-header1">
            <h2 className="category-title1">Shop By Category</h2>
          </div>
          <div className="empty-container1">
            <p>No categories available at the moment.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="category-section1">
      <div className="category-container1">
        {/* Header */}
        <div className="category-header1">
          <h2 className="category-title1">Shop By Category</h2>
          <p className="category-subtitle1">Explore our collections</p>
        </div>

        {/* Categories Grid */}
        <div className="categories-grid1">
          {categories.map((category, index) => {
            const imageUrl = getValidImageUrl(category.image);
            // ألوان مختلفة للـ fallback
            const fallbackColors = [
              '#3B82F6', '#14B8A6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'
            ];
            const iconEmojis = ['👕', '👗', '🏠', '💄', '📱', '🎮'];
            
            return (
              <div 
                key={category._id || category.id || index}
                className="category-card1"
                onClick={() => handleCategoryClick(category._id || category.id)}
              >
                {/* Circular Image */}
                <div className="category-image-wrapper1">
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt={category.name}
                      className="category-image1"
                      loading="lazy"
                      onError={(e) => {
                       
                        e.target.style.display = 'none';
                        const parent = e.target.parentElement;
                        const placeholder = document.createElement('div');
                        placeholder.className = 'category-image-placeholder1';
                        placeholder.style.background = fallbackColors[index % fallbackColors.length];
                        placeholder.style.color = 'white';
                        placeholder.style.fontSize = '3rem';
                        placeholder.style.display = 'flex';
                        placeholder.style.alignItems = 'center';
                        placeholder.style.justifyContent = 'center';
                        placeholder.textContent = iconEmojis[index % iconEmojis.length] || category.name[0];
                        parent.appendChild(placeholder);
                      }}
                    />
                  ) : (
                    <div 
                      className="category-image-placeholder1"
                      style={{
                        background: fallbackColors[index % fallbackColors.length],
                        color: 'white'
                      }}
                    >
                      {iconEmojis[index % iconEmojis.length] || category.name[0]}
                    </div>
                  )}
                  
                  {/* Overlay on hover */}
                  <div className="category-overlay1">
                    <span className="shop-now1">Shop Now</span>
                    <ArrowRight size={20} className="arrow-icon1" />
                  </div>
                </div>

                {/* Category Info */}
                <div className="category-info1">
                  <h3 className="category-name1">{category.name}</h3>
                  <span className="category-shop-link1">
                    Shop Now <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Button */}
        <div className="category-footer1">
          <button 
            className="view-all-btn1"
            onClick={() => navigate('/categories')}
          >
            View All Categories
            <ArrowRight className='arrowRight' size={18} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
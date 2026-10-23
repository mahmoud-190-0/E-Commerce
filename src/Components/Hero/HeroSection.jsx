import React from "react";
import "./HeroSection.css";
import { useNavigate } from "react-router-dom";
import { Award, Clock11, RotateCwFadingClock, ShieldCheck } from "lucide-react";
import HeroImage from "../../assets/HeroImage.png";
const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="hero-section">
      <div className="hero-container">
        {/* Left Column */}
        <div className="hero-left">
          <div className="offer-badge">
            <span className="badge-text">LIMITED TIME OFFER</span>
            <span className="badge-icon">
              {" "}
              <Clock11 size={16} />
            </span>
          </div>

          <h1 className="hero-title">
            Shop More, <br />
            <span className="highlight-text">Save More</span>
          </h1>

          <p className="hero-description">
            Explore top quality products at unbeatable prices
          </p>

          <button className="cta-button" onClick={() => navigate("/products")}>
            EXPLORE COLLECTION
            <svg
              className="arrow-icon"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none">
              <path
                d="M5 12H19M19 12L12 5M19 12L12 19"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div className="trust-badges">
            <div className="trust-item">
              <div className="trust-icon">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div>
                <span className="trust-number">20K+</span>
                <span className="trust-label">Happy Customers</span>
              </div>
            </div>

            <div className="trust-divider"></div>

            <div className="trust-item">
              <div className="trust-icon">
                <ShieldCheck
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </ShieldCheck>
              </div>
              <div>
                <span className="trust-number">100%</span>
                <span className="trust-label">Secure Payments</span>
              </div>
            </div>

            <div className="trust-divider"></div>

            <div className="trust-item">
              <div className="trust-icon">
                <RotateCwFadingClock
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </div>
              <div>
                <span className="trust-number">30 Days</span>
                <span className="trust-label">Easy Returns</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Single Image */}
        <div className="hero-right">
          <div className="product-showcase">
            <div className="circle-background"></div>

            <div className="discount-badge">
              <span className="discount-percent">UP TO</span>
              <span className="discount-number">50%</span>
              <span className="discount-text">OFF</span>
            </div>

            <div className="image-container">
              <img
                src={HeroImage}
                alt="Featured Products"
                className="hero-image"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Feature Bar */}
      <div className="feature-bar">
        <div className="feature-item">
          <div className="feature-icon">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18" r="2.5" />
              <circle cx="18.5" cy="18" r="2.5" />
            </svg>
          </div>
          <div>
            <h4 className="feature-title">Free Shipping</h4>
            <p className="feature-description">On orders over $75</p>
          </div>
        </div>

        <div className="feature-divider"></div>

        <div className="feature-item">
          <div className="feature-icon">
            <RotateCwFadingClock
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </div>
          <div>
            <h4 className="feature-title">Easy Returns</h4>
            <p className="feature-description">30-day returns</p>
          </div>
        </div>

        <div className="feature-divider"></div>

        <div className="feature-item">
          <div className="feature-icon">
            <ShieldCheck
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"></ShieldCheck>
          </div>
          <div>
            <h4 className="feature-title">Secure Payment</h4>
            <p className="feature-description">100% secure checkout</p>
          </div>
        </div>

        <div className="feature-divider"></div>

        <div className="feature-item">
          <div className="feature-icon">
            <Award
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"></Award>
          </div>
          <div>
            <h4 className="feature-title">Premium Quality</h4>
            <p className="feature-description">Genuine & original products</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

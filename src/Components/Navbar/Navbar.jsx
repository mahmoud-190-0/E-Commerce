import React, { useEffect, useState, useRef } from "react";
import "./navbar.css";
import {
  Heart,
  ShoppingCart,
  Menu,
  X,
  UserRoundCheck,
  UserRoundPlus,
  Sun,
  Moon,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation();

  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { cartItems } = useCart();
  const { wishlistCount } = useWishlist();

  const cartItemCount = cartItems.length;
  const heartItemCount = wishlistCount;

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setHasMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    closeMenu();
  }, [location.pathname]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleKey = (e) => e.key === "Escape" && closeMenu();
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isMenuOpen]);

  useEffect(() => {
    if (isMenuOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isMenuOpen]);

  useEffect(() => {
    const handleResize = () => window.innerWidth > 768 && closeMenu();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) closeMenu();
    };
    const id = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <>
      <nav className={`navbar ${hasMounted ? "" : "no-transition"}`}>
        <div className="navbar-container">
          <div className="navbar-left">
            <div className="logoo">
              <div className="logo">
                <Link to="/" className="logo-text">
                  E-Shop
                </Link>
              </div>
            </div>
          </div>

          <div
            ref={menuRef}
            className={`navbar-center ${isMenuOpen ? "active" : ""}`}>
            <ul className="nav-links">
              <li>
                <Link
                  to="/"
                  className={`nav-link ${
                    location.pathname === "/" ? "active" : ""
                  }`}
                  onClick={closeMenu}>
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/categories"
                  className={`nav-link ${
                    location.pathname === "/categories" ? "active" : ""
                  }`}
                  onClick={closeMenu}>
                  Categories
                </Link>
              </li>
              <li>
                <Link
                  to="/products"
                  className={`nav-link ${
                    location.pathname === "/products" ? "active" : ""
                  }`}
                  onClick={closeMenu}>
                  Products
                </Link>
              </li>
              <li>
                <Link
                  to="/offers"
                  className={`nav-link ${
                    location.pathname === "/offers" ? "active" : ""
                  }`}
                  onClick={closeMenu}>
                  Offers
                </Link>
              </li>
            </ul>
          </div>

          <div className="navbar-right">
            <Link
              to="/wishlist"
              className="icon-button wishlist-btn"
              aria-label="Wishlist">
              <Heart size={34} />
              {heartItemCount > 0 && (
                <span className="cart-badge">{heartItemCount}</span>
              )}
            </Link>

            <Link to="/cart" className="icon-button cart-btn" aria-label="Cart">
              <ShoppingCart size={24} />
              {cartItemCount > 0 && (
                <span className="cart-badge">{cartItemCount}</span>
              )}
            </Link>

            <button
              type="button"
              className="icon-button theme-toggle-btn"
              onClick={toggleTheme}
              aria-label={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              title={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }>
              {theme === "dark" ? <Sun size={24} /> : <Moon size={24} />}
            </button>

            {isAuthenticated ? (
              <Link
                to="/profile"
                className="icon-button profile-btn"
                aria-label="Profile">
                <UserRoundCheck size={24} />
              </Link>
            ) : (
              <Link
                to="/login"
                className="icon-button profile-btn"
                aria-label="Login">
                <UserRoundPlus size={24} />
              </Link>
            )}

            <button
              className="menu-toggle"
              onClick={toggleMenu}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      <div
        className={`menu-backdrop ${isMenuOpen ? "active" : ""}`}
        onClick={closeMenu}
        aria-hidden="true"
      />
    </>
  );
};

export default Navbar;

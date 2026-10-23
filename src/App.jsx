import React from "react";
import "./App.css";
import CategorySection from "./Components/CategorySection/CategorySection.jsx";
import Navbar from "./Components/Navbar/Navbar";
import HeroSection from "./Components/Hero/HeroSection";
// import Products from "./Components/Products/Products.jsx";
import { Route, Routes } from "react-router-dom";
import LoginPage from "./Pages/Auth/LoginPage/LoginPage.jsx";
import RegisterPage from "./Pages/Auth/RegisterPage/RegisterPage.jsx";
import CategoriesPage from "./Pages/CategoriesPage/CategoriesPage.jsx";
import SubcategoriesPage from "./Pages/SubcategoriesPage/SubcategoriesPage.jsx";
import ForgotPasswordPage from "./Pages/Auth/ForgotPasswordPage/ForgotPasswordPage.jsx";
import VerifyResetCodePage from "./Pages/Auth/VerifyResetCodePage/VerifyResetCodePage.jsx";
import ResetPasswordPage from "./Pages/Auth/ResetPasswordPage/ResetPasswordPage.jsx";
import ProfilePage from "./Pages/ProfilePage/ProfilePage.jsx";
import ProductsPage from "./Pages/ProductsPage/ProductsPage.jsx";
import WishlistPage from "./Pages/WishlistPage/WishlistPage.jsx";
import CartPage from "./Pages/CartPage/CartPage.jsx";
import ProductSection from "./Components/ProductSection/ProductSection.jsx";
import ProductDetails from "./Pages/ProductDetails/ProductDetails.jsx";
import SubcategoryProducts from "./Pages/SubcategoryProductsPage/SubcategoryProductsPage.jsx";
import OrdersPage from "./Pages/OrdersPage/OrdersPage.jsx";
function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={
            <>
              <HeroSection />
              <CategorySection />
              <ProductSection />
            </>
          }
        />
        <Route path="/Categories" element={<CategoriesPage />} />
        <Route path="/categories/:categoryId" element={<SubcategoriesPage />} />
        <Route path="/products/:id" element={<ProductDetails />} />{" "}
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/Wishlist" element={<WishlistPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-reset-code" element={<VerifyResetCodePage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/subcategories/:subcategoryId"
          element={<SubcategoryProducts />}
        />
      </Routes>
    </>
  );
}

export default App;

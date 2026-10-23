import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword } from "../../../services/authService";
import "../auth.css";

const validateEmail = (email) => {
  if (!email.trim()) return "Email is required";
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email)) return "Invalid email address";
  return "";
};

// ✅ Helper: استخراج رسالة الخطأ من كل أشكال الاستجابة
const extractErrorMessage = (
  err,
  fallback = "Failed to send reset code. Please try again.",
) => {
  const data = err?.response?.data;

  // 1) express-validator errors array (شكل مشروعك)
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors.map((e) => e.msg || e.message).join(" • ");
  }

  // 2) errors كـ object
  if (data?.errors && typeof data.errors === "object") {
    const messages = Object.values(data.errors).flat().filter(Boolean);
    if (messages.length > 0) return messages.join(" • ");
  }

  // 3) message عادي
  if (typeof data?.message === "string") return data.message;

  // 4) error
  if (typeof data?.error === "string") return data.error;

  // 5) Network / timeout
  if (err?.code === "ECONNABORTED")
    return "Request timed out. Please try again.";
  if (err?.message === "Network Error")
    return "Cannot connect to server. Check your connection.";

  return fallback;
};

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (touched) setError(validateEmail(e.target.value));
  };

  const handleBlur = () => {
    setTouched(true);
    setError(validateEmail(email));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const emailError = validateEmail(email);
    setError(emailError);
    setTouched(true);
    if (emailError) return;

    setLoading(true);
    try {
      await forgotPassword(email.trim().toLowerCase());
      setSuccess(true);

      sessionStorage.setItem("resetEmail", email.trim().toLowerCase());

      setTimeout(() => {
        navigate("/verify-reset-code", {
          state: { email: email.trim().toLowerCase() },
        });
      }, 1500);
    } catch (err) {
      setServerError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card1" onSubmit={handleSubmit} noValidate>
        <div className="auth-header">
          <h2 className="auth-title">Forgot Password?</h2>
          <p className="auth-subtitle">
            Enter your email and we'll send you a reset code
          </p>
        </div>

        {/* ✅ Success */}
        {success && (
          <div className="auth-success" role="status">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>Reset code sent! Redirecting...</span>
          </div>
        )}

        {/* ✅ Server Error */}
        {serverError && (
          <div className="auth-error" role="alert">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{serverError}</span>
          </div>
        )}

        {/* ✅ Email */}
        <div className="auth-field">
          <label htmlFor="email">Email Address</label>
          <div
            className={`auth-input-wrap ${error && touched ? "has-error" : ""}`}>
            <svg
              className="field-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="email"
              required
              autoFocus
            />
          </div>
          {error && touched && <span className="field-error">{error}</span>}
        </div>

        <button
          className="auth-btn"
          type="submit"
          disabled={loading || success}>
          {loading ? (
            <>
              <span className="spinner"></span>
              Sending...
            </>
          ) : success ? (
            <>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Sent!
            </>
          ) : (
            <>
              Send Reset Code
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </>
          )}
        </button>

        <p className="auth-footer">
          Remember your password? <Link to="/login">Back to login</Link>
        </p>
      </form>
    </div>
  );
};

export default ForgotPasswordPage;

import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  verifyResetCode,
  resendResetCode,
} from "../../../services/authService";
import "../auth.css";

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 35; // ✅ seconds

const VerifyResetCodePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const email =
    location.state?.email || sessionStorage.getItem("resetEmail") || "";

  const [code, setCode] = useState(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);

  const inputsRef = useRef([]);
  const autoSubmitRef = useRef(false); // ✅ prevent double fire

  /* Redirect if no email */
  useEffect(() => {
    if (!email) navigate("/forgot-password", { replace: true });
  }, [email, navigate]);

  /* Focus first input */
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  /* Countdown for resend */
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  /* ✅ Auto-submit when all 6 digits entered */
  useEffect(() => {
    const full = code.every((d) => d !== "");
    if (full && !loading && !success && !autoSubmitRef.current) {
      autoSubmitRef.current = true;
      submitCode(code.join(""));
    }
    // reset the guard once code is incomplete again
    if (!full) autoSubmitRef.current = false;
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Input change */
  const handleChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError("");

    if (value && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  /* Backspace / arrows */
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  /* Paste */
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").trim();
    if (!/^\d+$/.test(pasted)) return;

    const digits = pasted.slice(0, CODE_LENGTH).split("");
    const newCode = Array(CODE_LENGTH).fill("");
    digits.forEach((d, i) => (newCode[i] = d));
    setCode(newCode);

    const lastIndex = Math.min(digits.length, CODE_LENGTH - 1);
    inputsRef.current[lastIndex]?.focus();
  };

  /* ✅ Core submit — used by both auto & manual */
  const submitCode = async (fullCode) => {
    setServerError("");
    setError("");

    if (fullCode.length !== CODE_LENGTH) {
      setError(`Please enter the ${CODE_LENGTH}-digit code`);
      return;
    }

    setLoading(true);
    try {
      await verifyResetCode(email, fullCode);
      setSuccess(true);

      sessionStorage.setItem("resetEmail", email);
      sessionStorage.setItem("resetCode", fullCode);

      setTimeout(() => {
        navigate("/reset-password", {
          state: { email, code: fullCode },
        });
      }, 900);
    } catch (err) {
      setServerError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Invalid or expired code. Please try again.",
      );
      setCode(Array(CODE_LENGTH).fill(""));
      autoSubmitRef.current = false;
      inputsRef.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  /* Manual submit (optional — Enter still works) */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (loading || success) return;
    submitCode(code.join(""));
  };

  /* ✅ Resend using the new endpoint */
  const handleResend = async () => {
    if (cooldown > 0 || resending) return;

    setResending(true);
    setServerError("");
    try {
      await resendResetCode(email);
      setCooldown(RESEND_COOLDOWN);
      setCode(Array(CODE_LENGTH).fill(""));
      autoSubmitRef.current = false;
      inputsRef.current[0]?.focus();
    } catch (err) {
      setServerError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to resend code.",
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <form className="auth-card1" onSubmit={handleSubmit} noValidate>
        <div className="auth-header">
          <div className="auth-logo">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <h2 className="auth-title">Check your email</h2>
          <p className="auth-subtitle">
            We sent a {CODE_LENGTH}-digit code to
            <br />
            <strong className="auth-email">{email}</strong>
          </p>
        </div>

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
            <span>Code verified! Redirecting...</span>
          </div>
        )}

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

        <div className="otp-container">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputsRef.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className={`otp-input ${digit ? "filled" : ""} ${
                error ? "has-error" : ""
              }`}
              autoComplete="one-time-code"
              disabled={loading || success}
            />
          ))}
        </div>

        {error && <span className="field-error text-center">{error}</span>}

        <button
          className="auth-btn"
          type="submit"
          disabled={loading || success || code.join("").length !== CODE_LENGTH}>
          {loading ? (
            <>
              <span className="spinner"></span>
              Verifying...
            </>
          ) : (
            <>
              Verify Code
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </>
          )}
        </button>

        <div className="auth-resend">
          <span>Didn't receive the code?</span>
          <button
            type="button"
            className="resend-btn"
            onClick={handleResend}
            disabled={cooldown > 0 || resending}>
            {resending
              ? "Sending..."
              : cooldown > 0
                ? `Resend in ${cooldown}s`
                : "Resend Code"}
          </button>
        </div>

        <p className="auth-footer">
          <Link to="/forgot-password">← Change email</Link>
        </p>
      </form>
    </div>
  );
};

export default VerifyResetCodePage;

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  AtSign,
  Camera,
  Pencil,
  Save,
  X,
  MapPin,
  Plus,
  Trash2,
  Shield,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  LogOut,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { getMe, updateMe, changeMyPassword } from "../../services/userService";
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
} from "../../services/addressService";
import "./profilePage.css";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const EMPTY_ADDRESS = {
  alias: "",
  details: "",
  phone: "",
  city: "",
  postalCode: "",
};
const EMPTY_PWD = { currentPassword: "", newPassword: "", confirmPassword: "" };

/* ---------- Helpers ---------- */
const formatDate = (date) => {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const apiMessage = (err, fallback) => {
  const d = err?.response?.data;
  return d?.errors?.[0]?.msg || d?.message || fallback;
};

/* ============================================================
   Small reusable pieces
============================================================ */
function Notice({ type, children }) {
  if (!children) return null;
  const Icon = type === "error" ? AlertCircle : CheckCircle2;
  return (
    <p
      className={`a1notice a1notice--${type}`}
      role={type === "error" ? "alert" : "status"}>
      <Icon size={16} aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

function Card({ icon: Icon, title, subtitle, action, children }) {
  return (
    <section className="a1card">
      <header className="a1card-head">
        <div className="a1card-head-text">
          <span className="a1card-icon" aria-hidden="true">
            <Icon size={18} />
          </span>
          <div>
            <h2 className="a1card-title">{title}</h2>
            {subtitle && <p className="a1card-subtitle">{subtitle}</p>}
          </div>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function Modal({ title, onClose, children, labelId }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="a1modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="a1modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}>
        <div className="a1modal-head">
          <h3 id={labelId}>{title}</h3>
          <button
            type="button"
            className="a1icon-btn"
            onClick={onClose}
            aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PasswordField({
  label,
  name,
  value,
  onChange,
  autoComplete,
  placeholder,
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="a1field">
      <span className="a1field-label">{label}</span>
      <div className="a1input-wrap">
        <Lock size={16} className="a1input-icon" aria-hidden="true" />
        <input
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required
        />
        <button
          type="button"
          className="a1input-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}>
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </label>
  );
}

/* ============================================================
   Profile Page
============================================================ */
export default function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  /* Personal info */
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [infoMsg, setInfoMsg] = useState({ type: "", text: "" });

  /* Photo */
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");

  /* Password */
  const [showPwdForm, setShowPwdForm] = useState(false);
  const [pwd, setPwd] = useState(EMPTY_PWD);
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState({ type: "", text: "" });

  /* Addresses */
  const [addrModal, setAddrModal] = useState(null); // { id|null, data }
  const [savingAddr, setSavingAddr] = useState(false);
  const [addrError, setAddrError] = useState("");
  const [addrMsg, setAddrMsg] = useState({ type: "", text: "" });
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  /* ---------- Auth helpers ---------- */
  const forceLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.clear();
    navigate("/login");
  };

  /** Returns true when the error was a 401 and the user was sent to login. */
  const handleUnauthorized = (err) => {
    if (err?.response?.status === 401) {
      forceLogout();
      return true;
    }
    return false;
  };

  /* ---------- Load data ---------- */
  useEffect(() => {
    let active = true;
    Promise.all([getMe(), getAddresses()])
      .then(([userRes, addrRes]) => {
        if (!active) return;
        const userData = userRes.data?.data ?? userRes.data;
        const addrData = addrRes.data?.data ?? addrRes.data ?? [];
        setUser(userData);
        setAddresses(Array.isArray(addrData) ? addrData : []);
      })
      .catch((err) => {
        if (!active) return;
        if (handleUnauthorized(err)) return;
        setLoadError(apiMessage(err, "Couldn't load your profile."));
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) setForm({ name: user.name || "", phone: user.phone || "" });
  }, [user]);

  /* ============================================================
     Personal info
  ============================================================ */
  const startEditing = () => {
    setInfoMsg({ type: "", text: "" });
    setEditing(true);
  };

  const cancelEditing = () => {
    setForm({ name: user.name || "", phone: user.phone || "" });
    setInfoMsg({ type: "", text: "" });
    setEditing(false);
  };

  const handleFormChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name)
      return setInfoMsg({ type: "error", text: "Full name is required." });

    setSaving(true);
    setInfoMsg({ type: "", text: "" });

    const data = new FormData();
    data.append("name", name);
    if (form.phone.trim()) data.append("phone", form.phone.trim());

    try {
      const res = await updateMe(data);
      const updated = res.data?.data ?? res.data;
      setUser((prev) => ({ ...prev, ...updated }));
      setEditing(false);
      setInfoMsg({ type: "success", text: "Profile updated successfully." });
      setTimeout(() => setInfoMsg({ type: "", text: "" }), 3500);
    } catch (err) {
      if (handleUnauthorized(err)) return;
      setInfoMsg({
        type: "error",
        text: apiMessage(err, "Couldn't save your changes."),
      });
    } finally {
      setSaving(false);
    }
  };

  /* ============================================================
     Photo upload
  ============================================================ */
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      return setPhotoError("Please choose a JPG, PNG, or WebP image.");
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return setPhotoError("The image must be 5 MB or smaller.");
    }

    setPhotoError("");
    setUploading(true);
    const data = new FormData();
    data.append("profileImage", file);

    try {
      const res = await updateMe(data);
      const updated = res.data?.data ?? res.data;
      setUser((prev) => ({ ...prev, ...updated }));
    } catch (err) {
      if (handleUnauthorized(err)) return;
      setPhotoError(apiMessage(err, "Couldn't upload your photo."));
    } finally {
      setUploading(false);
    }
  };

  /* ============================================================
     Password
  ============================================================ */
  const handlePwdChange = (e) =>
    setPwd((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const closePwdForm = () => {
    setShowPwdForm(false);
    setPwd(EMPTY_PWD);
    setPwdMsg((m) => (m.type === "success" ? m : { type: "", text: "" }));
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    setPwdMsg({ type: "", text: "" });

    if (pwd.newPassword.length < 6)
      return setPwdMsg({
        type: "error",
        text: "New password must be at least 6 characters.",
      });
    if (pwd.newPassword === pwd.currentPassword)
      return setPwdMsg({
        type: "error",
        text: "New password must differ from the current one.",
      });
    if (pwd.newPassword !== pwd.confirmPassword)
      return setPwdMsg({ type: "error", text: "Passwords do not match." });

    setSavingPwd(true);
    try {
      await changeMyPassword({
        currentPassword: pwd.currentPassword,
        newPassword: pwd.newPassword,
      });
      setPwd(EMPTY_PWD);
      setShowPwdForm(false);
      setPwdMsg({ type: "success", text: "Password updated successfully." });
      setTimeout(() => setPwdMsg({ type: "", text: "" }), 4000);
    } catch (err) {
      // A wrong current password may also return 401, so only treat it as an
      // expired session when the server message says so.
      const msg = apiMessage(
        err,
        "Couldn't update password. Check your current password.",
      );
      if (
        err?.response?.status === 401 &&
        /token|expired|login|authorized/i.test(msg)
      ) {
        return forceLogout();
      }
      setPwdMsg({ type: "error", text: msg });
    } finally {
      setSavingPwd(false);
    }
  };

  /* ============================================================
     Addresses
  ============================================================ */
  const openAddAddress = () => {
    setAddrError("");
    setAddrModal({ id: null, data: { ...EMPTY_ADDRESS } });
  };

  const openEditAddress = (addr) => {
    setAddrError("");
    setAddrModal({
      id: addr._id,
      data: {
        alias: addr.alias || "",
        details: addr.details || "",
        phone: addr.phone || "",
        city: addr.city || "",
        postalCode: addr.postalCode || "",
      },
    });
  };

  const closeAddrModal = () => {
    if (!savingAddr) setAddrModal(null);
  };

  const handleAddrField = (e) =>
    setAddrModal((prev) => ({
      ...prev,
      data: { ...prev.data, [e.target.name]: e.target.value },
    }));

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setSavingAddr(true);
    setAddrError("");

    const { id, data } = addrModal;
    const payload = {
      details: data.details.trim(),
      phone: data.phone.trim(),
      city: data.city.trim(),
    };
    if (data.alias.trim()) payload.alias = data.alias.trim();
    if (data.postalCode.trim()) payload.postalCode = data.postalCode.trim();

    try {
      if (id) {
        const res = await updateAddress(id, payload);
        const updated = res.data?.data ?? res.data;
        setAddresses((prev) =>
          prev.map((a) => (a._id === id ? { ...a, ...updated } : a)),
        );
      } else {
        const res = await addAddress(payload);
        const created = res.data?.data ?? res.data;
        setAddresses((prev) => [...prev, created]);
      }
      setAddrModal(null);
      setAddrMsg({
        type: "success",
        text: id ? "Address updated." : "Address added.",
      });
      setTimeout(() => setAddrMsg({ type: "", text: "" }), 3000);
    } catch (err) {
      if (handleUnauthorized(err)) return;
      setAddrError(apiMessage(err, "Couldn't save the address."));
    } finally {
      setSavingAddr(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteAddress(toDelete._id);
      setAddresses((prev) => prev.filter((a) => a._id !== toDelete._id));
      setToDelete(null);
      setAddrMsg({ type: "success", text: "Address deleted." });
      setTimeout(() => setAddrMsg({ type: "", text: "" }), 3000);
    } catch (err) {
      if (handleUnauthorized(err)) return;
      setDeleteError(apiMessage(err, "Couldn't delete the address."));
    } finally {
      setDeleting(false);
    }
  };

  /* ============================================================
     Loading / error states
  ============================================================ */
  if (loading) {
    return (
      <div className="a1pf-page" aria-busy="true">
        <div className="a1pf-container">
          <div className="a1skeleton a1sk-header" />
          <div className="a1skeleton a1sk-card" />
          <div className="a1skeleton a1sk-card" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="a1pf-page">
        <div className="a1pf-container">
          <div className="a1state-box">
            <AlertCircle size={36} aria-hidden="true" />
            <h2>Something went wrong</h2>
            <p>{loadError}</p>
            <button
              type="button"
              className="a1btn a1btn-primary"
              onClick={() => navigate("/login")}>
              Go to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const initial = (user.name || "?").charAt(0).toUpperCase();
  const isLocal = (user.provider || "local") === "local";
  const providerLabel =
    user.provider === "google" ? "Google" : "Email & password";

  /* ============================================================
     Render
  ============================================================ */
  return (
    <div className="a1pf-page">
      <div className="a1pf-container">
        {/* ---------- A. Header ---------- */}
        <header className="a1pf-header">
          <div className="a1avatar-block">
            <div className="a1avatar">
              {user.profileImage ? (
                <img src={user.profileImage} alt={`${user.name}'s profile`} />
              ) : (
                <span className="a1avatar-fallback" aria-label="Default avatar">
                  {initial}
                </span>
              )}
              {uploading && (
                <span
                  className="a1avatar-loading"
                  role="status"
                  aria-label="Uploading photo">
                  <Loader2 size={22} className="a1spin" />
                </span>
              )}
            </div>
            <button
              type="button"
              className="a1btn a1btn-outline a1btn-sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}>
              <Camera size={15} aria-hidden="true" />
              Change photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              hidden
            />
          </div>

          <div className="a1pf-header-info">
            <div className="a1pf-header-top">
              <h1 className="a1pf-name">{user.name}</h1>
              <span className={`a1badge a1badge--${user.role || "user"}`}>
                <Shield size={12} aria-hidden="true" />
                {user.role || "user"}
              </span>
            </div>
            <p className="a1pf-email">
              <Mail size={15} aria-hidden="true" />
              {user.email}
            </p>
            <Notice type="error">{photoError}</Notice>
          </div>

          <button
            type="button"
            className="a1btn a1btn-ghost a1pf-logout"
            onClick={forceLogout}>
            <LogOut size={16} aria-hidden="true" />
            Log out
          </button>
        </header>

        <div className="a1pf-grid">
          {/* ---------- B. Personal information ---------- */}
          <Card
            icon={User}
            title="Personal information"
            subtitle="Your name and contact details"
            action={
              !editing && (
                <button
                  type="button"
                  className="a1btn a1btn-outline a1btn-sm"
                  onClick={startEditing}>
                  <Pencil size={14} aria-hidden="true" />
                  Edit profile
                </button>
              )
            }>
            <form onSubmit={handleSaveInfo} noValidate>
              <div className="a1field-grid">
                <label className="a1field">
                  <span className="a1field-label">Full name</span>
                  <div className="a1input-wrap">
                    <User
                      size={16}
                      className="a1input-icon"
                      aria-hidden="true"
                    />
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleFormChange}
                      disabled={!editing}
                      placeholder="Your full name"
                      autoComplete="name"
                      required
                    />
                  </div>
                </label>

                <label className="a1field">
                  <span className="a1field-label">Phone number</span>
                  <div className="a1input-wrap">
                    <Phone
                      size={16}
                      className="a1input-icon"
                      aria-hidden="true"
                    />
                    <input
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleFormChange}
                      disabled={!editing}
                      placeholder="+201XXXXXXXXX"
                      autoComplete="tel"
                    />
                  </div>
                </label>

                <label className="a1field">
                  <span className="a1field-label">
                    Email address <em>read-only</em>
                  </span>
                  <div className="a1input-wrap">
                    <Mail
                      size={16}
                      className="a1input-icon"
                      aria-hidden="true"
                    />
                    <input value={user.email || ""} readOnly disabled />
                  </div>
                </label>

                <label className="a1field">
                  <span className="a1field-label">
                    Username <em>read-only</em>
                  </span>
                  <div className="a1input-wrap">
                    <AtSign
                      size={16}
                      className="a1input-icon"
                      aria-hidden="true"
                    />
                    <input value={user.slug || ""} readOnly disabled />
                  </div>
                </label>
              </div>

              <Notice type={infoMsg.type}>{infoMsg.text}</Notice>

              {editing && (
                <div className="a1actions">
                  <button
                    type="button"
                    className="a1btn a1btn-outline"
                    onClick={cancelEditing}
                    disabled={saving}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="a1btn a1btn-primary"
                    disabled={saving}>
                    {saving ? (
                      <Loader2
                        size={16}
                        className="a1spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Save size={16} aria-hidden="true" />
                    )}
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              )}
            </form>
          </Card>

          {/* ---------- D. Account information ---------- */}
          <Card
            icon={ShieldCheck}
            title="Account information"
            subtitle="Details about your account">
            <dl className="a1info-list">
              <div className="a1info-row">
                <dt>
                  <Shield size={15} aria-hidden="true" /> Role
                </dt>
                <dd className="a1cap">{user.role || "user"}</dd>
              </div>
              <div className="a1info-row">
                <dt>
                  <Lock size={15} aria-hidden="true" /> Sign-in method
                </dt>
                <dd>{providerLabel}</dd>
              </div>
              <div className="a1info-row">
                <dt>
                  <Calendar size={15} aria-hidden="true" /> Member since
                </dt>
                <dd>{formatDate(user.createdAt)}</dd>
              </div>
              <div className="a1info-row">
                <dt>
                  <Clock size={15} aria-hidden="true" /> Last updated
                </dt>
                <dd>{formatDateTime(user.updatedAt)}</dd>
              </div>
            </dl>
          </Card>
        </div>

        {/* ---------- C. Saved addresses ---------- */}
        <Card
          icon={MapPin}
          title="Saved addresses"
          subtitle="Where we deliver your orders"
          action={
            <button
              type="button"
              className="a1btn a1btn-primary a1btn-sm"
              onClick={openAddAddress}>
              <Plus size={15} aria-hidden="true" />
              Add address
            </button>
          }>
          <Notice type={addrMsg.type}>{addrMsg.text}</Notice>

          {addresses.length === 0 ? (
            <div className="a1empty">
              <MapPin size={32} aria-hidden="true" />
              <h3>No saved addresses</h3>
              <p>Add a delivery address to speed up checkout.</p>
            </div>
          ) : (
            <ul className="a1address-grid">
              {addresses.map((addr, i) => (
                <li key={addr._id || i} className="a1address-card">
                  <div className="a1address-top">
                    <span className="a1address-alias">
                      <MapPin size={14} aria-hidden="true" />
                      {addr.alias || "Address"}
                    </span>
                    <div className="a1address-actions">
                      <button
                        type="button"
                        className="a1icon-btn"
                        onClick={() => openEditAddress(addr)}
                        aria-label={`Edit ${addr.alias || "address"}`}>
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        className="a1icon-btn a1icon-btn--danger"
                        onClick={() => {
                          setDeleteError("");
                          setToDelete(addr);
                        }}
                        aria-label={`Delete ${addr.alias || "address"}`}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  <p className="a1address-details">{addr.details}</p>
                  <p className="a1address-meta">
                    {[addr.city, addr.postalCode].filter(Boolean).join(" · ")}
                  </p>
                  {addr.phone && (
                    <p className="a1address-meta">
                      <Phone size={13} aria-hidden="true" /> {addr.phone}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* ---------- E. Security ---------- */}
        <Card
          icon={Lock}
          title="Security"
          subtitle="Keep your account protected">
          {isLocal ? (
            <>
              <Notice type={pwdMsg.type}>{pwdMsg.text}</Notice>

              {!showPwdForm ? (
                <div className="a1security-row">
                  <p>Use a strong password you don't use anywhere else.</p>
                  <button
                    type="button"
                    className="a1btn a1btn-outline"
                    onClick={() => {
                      setPwdMsg({ type: "", text: "" });
                      setShowPwdForm(true);
                    }}>
                    <Lock size={15} aria-hidden="true" />
                    Change password
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSavePassword} className="a1pwd-form">
                  <PasswordField
                    label="Current password"
                    name="currentPassword"
                    value={pwd.currentPassword}
                    onChange={handlePwdChange}
                    autoComplete="current-password"
                    placeholder="Current password"
                  />
                  <div className="a1field-grid">
                    <PasswordField
                      label="New password"
                      name="newPassword"
                      value={pwd.newPassword}
                      onChange={handlePwdChange}
                      autoComplete="new-password"
                      placeholder="At least 6 characters"
                    />
                    <PasswordField
                      label="Confirm new password"
                      name="confirmPassword"
                      value={pwd.confirmPassword}
                      onChange={handlePwdChange}
                      autoComplete="new-password"
                      placeholder="Repeat new password"
                    />
                  </div>
                  <div className="a1actions">
                    <button
                      type="button"
                      className="a1btn a1btn-outline"
                      onClick={closePwdForm}
                      disabled={savingPwd}>
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="a1btn a1btn-primary"
                      disabled={savingPwd}>
                      {savingPwd && (
                        <Loader2
                          size={16}
                          className="a1spin"
                          aria-hidden="true"
                        />
                      )}
                      {savingPwd ? "Updating…" : "Update password"}
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <div className="a1info-banner">
              <ShieldCheck size={18} aria-hidden="true" />
              <p>
                You signed in with Google, so your password is managed by your
                Google account. To change it, visit your Google account
                settings.
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* ---------- Address modal ---------- */}
      {addrModal && (
        <Modal
          title={addrModal.id ? "Edit address" : "Add new address"}
          onClose={closeAddrModal}
          labelId="address-modal-title">
          <form onSubmit={handleSaveAddress}>
            <div className="a1modal-body">
              <label className="a1field">
                <span className="a1field-label">
                  Label <em>optional</em>
                </span>
                <input
                  name="alias"
                  list="alias-options"
                  value={addrModal.data.alias}
                  onChange={handleAddrField}
                  placeholder="Home, Work, or custom"
                  className="a1plain-input"
                />
                <datalist id="alias-options">
                  <option value="Home" />
                  <option value="Work" />
                </datalist>
              </label>

              <label className="a1field">
                <span className="a1field-label">Address details</span>
                <input
                  name="details"
                  value={addrModal.data.details}
                  onChange={handleAddrField}
                  placeholder="Street, building, apartment"
                  className="a1plain-input"
                  required
                  minLength={5}
                />
              </label>

              <div className="a1field-grid">
                <label className="a1field">
                  <span className="a1field-label">City</span>
                  <input
                    name="city"
                    value={addrModal.data.city}
                    onChange={handleAddrField}
                    placeholder="Cairo"
                    className="a1plain-input"
                    required
                    minLength={2}
                  />
                </label>
                <label className="a1field">
                  <span className="a1field-label">
                    Postal code <em>optional</em>
                  </span>
                  <input
                    name="postalCode"
                    value={addrModal.data.postalCode}
                    onChange={handleAddrField}
                    placeholder="11511"
                    className="a1plain-input"
                  />
                </label>
              </div>

              <label className="a1field">
                <span className="a1field-label">Phone number</span>
                <input
                  name="phone"
                  type="tel"
                  value={addrModal.data.phone}
                  onChange={handleAddrField}
                  placeholder="+201XXXXXXXXX"
                  className="a1plain-input"
                  required
                />
              </label>

              <Notice type="error">{addrError}</Notice>
            </div>

            <div className="a1modal-foot">
              <button
                type="button"
                className="a1btn a1btn-outline"
                onClick={closeAddrModal}
                disabled={savingAddr}>
                Cancel
              </button>
              <button
                type="submit"
                className="a1btn a1btn-primary"
                disabled={savingAddr}>
                {savingAddr && (
                  <Loader2 size={16} className="a1spin" aria-hidden="true" />
                )}
                {savingAddr
                  ? "Saving…"
                  : addrModal.id
                    ? "Save changes"
                    : "Add address"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ---------- Delete confirmation ---------- */}
      {toDelete && (
        <Modal
          title="Delete address?"
          onClose={() => !deleting && setToDelete(null)}
          labelId="delete-modal-title">
          <div className="a1modal-body">
            <p className="a1confirm-text">
              This will permanently remove{" "}
              <strong>{toDelete.alias || "this address"}</strong>
              {toDelete.details ? ` (${toDelete.details})` : ""}. This action
              can't be undone.
            </p>
            <Notice type="error">{deleteError}</Notice>
          </div>
          <div className="a1modal-foot">
            <button
              type="button"
              className="a1btn a1btn-outline"
              onClick={() => setToDelete(null)}
              disabled={deleting}>
              Cancel
            </button>
            <button
              type="button"
              className="a1btn a1btn-danger"
              onClick={confirmDelete}
              disabled={deleting}>
              {deleting && (
                <Loader2 size={16} className="a1spin" aria-hidden="true" />
              )}
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

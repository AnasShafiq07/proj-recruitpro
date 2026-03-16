import { useEffect, useState } from "react";
import { Loader2, UserPlus, Save, ShieldCheck, Lock, KeyRound, Plug } from "lucide-react";
import { GoogleAccountCard } from "@/components/settings/GoogleAccountCard";
import { LinkedInAccountCard } from "@/components/settings/LinkedInAccountCard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { hrManagerApi } from "@/services/hrApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface HRManager {
  id: number;
  name: string;
  email: string;
  role: string;
  password?: string | null;
  company_id?: number | null;
  created_at?: string;
}

/* ─────────────────────────────────────────────
   Styles
───────────────────────────────────────────── */
const styles = `
  .s-root {
    background: rgb(249 250 251 / 0.5);
    min-height: 100vh;
    padding: 36px 32px;
  }

  /* ── Page header ── */
  .s-header {
    margin-bottom: 36px;
  }
  .s-eyebrow {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #2563eb;
    margin-bottom: 6px;
  }
  .s-title {
    font-size: 30px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: #0f172a;
    line-height: 1.2;
    margin: 0 0 6px;
  }
  .s-subtitle {
    font-size: 14px;
    color: #64748b;
    margin: 0;
  }

  /* ── Layout ── */
  .s-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
    max-width: 860px;
  }

  /* ── Section card ── */
  .s-card {
    background: #fff;
    border-radius: 16px;
    border: 1px solid #e8ecf4;
    overflow: hidden;
    transition: box-shadow 0.2s;
  }
  .s-card:hover { box-shadow: 0 6px 24px rgba(30,64,175,0.08); }

  .s-card-admin {
    border-left: 3px solid #2563eb;
  }

  .s-card-head {
    padding: 24px 28px 20px;
    border-bottom: 1px solid #f1f5f9;
  }
  .s-card-title-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 4px;
  }
  .s-card-icon {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: #eff6ff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .s-card-icon-admin { background: #eff6ff; }

  .s-card-title {
    font-size: 16px;
    font-weight: 600;
    color: #0f172a;
    margin: 0;
  }
  .s-card-desc {
    font-size: 13px;
    color: #94a3b8;
    margin: 0;
    padding-left: 44px;
  }

  .s-card-body {
    padding: 24px 28px;
  }

  /* ── Form fields ── */
  .s-grid-2 {
    display: grid;
    grid-template-columns: 1fr;
    gap: 18px;
  }
  @media (min-width: 640px) { .s-grid-2 { grid-template-columns: 1fr 1fr; } }

  .s-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .s-label {
    font-size: 12.5px;
    font-weight: 500;
    color: #475569;
    letter-spacing: 0.01em;
  }
  .s-input {
    width: 100%;
    padding: 10px 14px;
    font-size: 14px;
    color: #0f172a;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    box-sizing: border-box;
  }
  .s-input::placeholder { color: #94a3b8; }
  .s-input:focus {
    background: #fff;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
  }

  /* ── Card footer ── */
  .s-card-foot {
    padding: 16px 28px;
    background: #f8fafc;
    border-top: 1px solid #f1f5f9;
    display: flex;
    justify-content: flex-end;
  }

  /* ── Buttons ── */
  .s-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 10px 20px;
    font-size: 13.5px;
    font-weight: 500;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    transition: background 0.2s, box-shadow 0.2s, transform 0.15s;
    white-space: nowrap;
  }
  .s-btn:active { transform: translateY(0) !important; }
  .s-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none !important; }

  .s-btn-outline {
    background: #fff;
    color: #374151;
    border: 1px solid #e2e8f0;
  }
  .s-btn-outline:hover:not(:disabled) {
    border-color: #3b82f6;
    color: #1d4ed8;
    background: #f0f6ff;
    transform: translateY(-1px);
  }

  .s-btn-primary {
    background: #1d4ed8;
    color: #fff;
    box-shadow: 0 3px 10px rgba(29,78,216,0.22);
  }
  .s-btn-primary:hover:not(:disabled) {
    background: #1e40af;
    box-shadow: 0 5px 16px rgba(29,78,216,0.32);
    transform: translateY(-1px);
  }

  /* ── Divider ── */
  .s-divider {
    border: none;
    border-top: 1px solid #e8ecf4;
    margin: 4px 0;
  }

  /* ── Integrations list ── */
  .s-integrations {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* ── Loading screen ── */
  .s-loading {
    display: flex;
    height: 100vh;
    align-items: center;
    justify-content: center;
    background: rgb(249 250 251 / 0.5);
  }

  /* ── Fade-up animation ── */
  @keyframes s-fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .s-fade { animation: s-fadeUp 0.4s ease both; }
  .s-d1 { animation-delay: 0.04s; }
  .s-d2 { animation-delay: 0.10s; }
  .s-d3 { animation-delay: 0.16s; }
  .s-d4 { animation-delay: 0.22s; }
  .s-d5 { animation-delay: 0.28s; }
`;

/* ─────────────────────────────────────────────
   Reusable field
───────────────────────────────────────────── */
const Field = ({
  id, label, type = "text", value, onChange, placeholder, required,
}: {
  id: string; label: string; type?: string;
  value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean;
}) => (
  <div className="s-field">
    <label className="s-label" htmlFor={id}>{label}</label>
    <input
      id={id}
      className="s-input"
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
    />
  </div>
);

/* ─────────────────────────────────────────────
   Settings Page
───────────────────────────────────────────── */
const Settings = () => {
  const [user, setUser] = useState<HRManager | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profileData, setProfileData] = useState({ name: "", email: "" });
  const [passwordData, setPasswordData] = useState({ newPassword: "", confirmPassword: "" });
  const [newHrData, setNewHrData] = useState<Partial<HRManager>>({
    name: "", email: "", role: "hr", password: "", company_id: 0,
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await hrManagerApi.getCurrentHR();
        setUser(data);
        setProfileData({ name: data.name, email: data.email });
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await hrManagerApi.update(user.id, profileData);
      alert("Success: Profile updated successfully");
      setUser({ ...user, ...profileData });
    } catch { alert("Error: Failed to update profile"); }
    finally { setSaving(false); }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Error: Passwords do not match"); return;
    }
    if (passwordData.newPassword.length < 6) {
      alert("Error: Password should be at least 6 characters"); return;
    }
    setSaving(true);
    try {
      await hrManagerApi.update(user.id, { password: passwordData.newPassword });
      alert("Success: Password changed successfully");
      setPasswordData({ newPassword: "", confirmPassword: "" });
    } catch { alert("Error: Failed to update password"); }
    finally { setSaving(false); }
  };

  const handleCreateHR = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      newHrData.company_id = user?.company_id;
      await hrManagerApi.createHr(newHrData);
      alert("Success: New account created successfully");
      setNewHrData({ name: "", email: "", role: "hr", password: "", company_id: 0 });
    } catch (error: any) {
      alert(`Error: ${error.message || "Failed to create account"}`);
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <style>{styles}</style>
        <div className="s-loading">
          <Loader2 className="h-7 w-7 animate-spin" style={{ color: "#2563eb" }} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <style>{styles}</style>
      <div className="s-root">

        {/* ── Header ── */}
        <div className="s-header s-fade">
          <p className="s-eyebrow">Account</p>
          <h1 className="s-title">Settings</h1>
          <p className="s-subtitle">Manage your profile, security, and administrative tools.</p>
        </div>

        <div className="s-layout">

          {/* ── 1. Profile ── */}
          <div className="s-card s-fade s-d1">
            <div className="s-card-head">
              <div className="s-card-title-row">
                <div className="s-card-icon">
                  <UserPlus size={16} color="#2563eb" />
                </div>
                <h2 className="s-card-title">Profile Details</h2>
              </div>
              <p className="s-card-desc">Update your public profile information.</p>
            </div>
            <form onSubmit={handleUpdateProfile}>
              <div className="s-card-body">
                <div className="s-grid-2">
                  <Field id="name" label="Full Name" value={profileData.name}
                    onChange={(v) => setProfileData({ ...profileData, name: v })} required />
                  <Field id="email" label="Email Address" type="email" value={profileData.email}
                    onChange={(v) => setProfileData({ ...profileData, email: v })} required />
                </div>
              </div>
              <div className="s-card-foot">
                <button type="submit" className="s-btn s-btn-outline" disabled={saving}>
                  {saving
                    ? <Loader2 size={14} className="animate-spin" />
                    : <Save size={14} />}
                  Save Profile
                </button>
              </div>
            </form>
          </div>

          {/* ── 2. Security ── */}
          <div className="s-card s-fade s-d2">
            <div className="s-card-head">
              <div className="s-card-title-row">
                <div className="s-card-icon">
                  <Lock size={16} color="#2563eb" />
                </div>
                <h2 className="s-card-title">Security</h2>
              </div>
              <p className="s-card-desc">Update your password to keep your account secure.</p>
            </div>
            <form onSubmit={handleUpdatePassword}>
              <div className="s-card-body">
                <div className="s-grid-2">
                  <Field id="new-password" label="New Password" type="password"
                    value={passwordData.newPassword} placeholder="••••••••"
                    onChange={(v) => setPasswordData({ ...passwordData, newPassword: v })} required />
                  <Field id="confirm-password" label="Confirm Password" type="password"
                    value={passwordData.confirmPassword} placeholder="••••••••"
                    onChange={(v) => setPasswordData({ ...passwordData, confirmPassword: v })} required />
                </div>
              </div>
              <div className="s-card-foot">
                <button type="submit" className="s-btn s-btn-primary" disabled={saving}>
                  {saving
                    ? <Loader2 size={14} className="animate-spin" />
                    : <KeyRound size={14} />}
                  Update Password
                </button>
              </div>
            </form>
          </div>

          {/* ── 3. Admin: Create HR ── */}
          {user?.role === "admin" && (
            <div className="s-card s-card-admin s-fade s-d3">
              <div className="s-card-head">
                <div className="s-card-title-row">
                  <div className="s-card-icon s-card-icon-admin">
                    <ShieldCheck size={16} color="#2563eb" />
                  </div>
                  <h2 className="s-card-title">Team Management</h2>
                  <span style={{
                    marginLeft: "auto", fontSize: "11px", fontWeight: 600,
                    background: "#eff6ff", color: "#1d4ed8",
                    padding: "2px 10px", borderRadius: "20px", letterSpacing: "0.05em"
                  }}>ADMIN</span>
                </div>
                <p className="s-card-desc">Create new administrative or HR accounts.</p>
              </div>
              <form onSubmit={handleCreateHR}>
                <div className="s-card-body">
                  <div className="s-grid-2">
                    <Field id="new-name" label="Full Name" value={newHrData.name || ""}
                      onChange={(v) => setNewHrData({ ...newHrData, name: v })} required />
                    <Field id="new-email" label="Email Address" type="email" value={newHrData.email || ""}
                      onChange={(v) => setNewHrData({ ...newHrData, email: v })} required />
                    <Field id="hr-password" label="Temporary Password" type="password"
                      value={newHrData.password || ""}
                      onChange={(v) => setNewHrData({ ...newHrData, password: v })} required />
                    <div className="s-field">
                      <label className="s-label" htmlFor="new-role">Assign Role</label>
                      <Select
                        value={newHrData.role}
                        onValueChange={(val) => setNewHrData({ ...newHrData, role: val })}
                      >
                        <SelectTrigger id="new-role" style={{
                          height: "42px", borderRadius: "10px",
                          background: "#f8fafc", border: "1px solid #e2e8f0",
                          fontSize: "14px"
                        }}>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hr">HR</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="s-card-foot">
                  <button type="submit" className="s-btn s-btn-primary" disabled={saving}>
                    {saving
                      ? <Loader2 size={14} className="animate-spin" />
                      : <UserPlus size={14} />}
                    Create Account
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── 4. Integrations ── */}
          <div className="s-card s-fade s-d4">
            <div className="s-card-head">
              <div className="s-card-title-row">
                <div className="s-card-icon">
                  <Plug size={16} color="#2563eb" />
                </div>
                <h2 className="s-card-title">Account Integrations</h2>
              </div>
              <p className="s-card-desc">Connect third-party services to your workspace.</p>
            </div>
            <div className="s-card-body">
              <div className="s-integrations">
                <GoogleAccountCard />
                <hr className="s-divider" />
                <LinkedInAccountCard />
              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
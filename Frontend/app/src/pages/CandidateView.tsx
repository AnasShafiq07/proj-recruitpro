import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  Mail,
  Phone,
  Clock,
  Award,
  Video,
  CheckCircle2,
  Sparkles,
  Briefcase,
  GraduationCap,
  Calendar,
  Send,
  X,
  Check,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { OfferLetterModal } from "@/components/offerLetter/OfferLetter";

import {
  candidateViewApi,
  CandidateWithAnswers,
} from "@/services/candidateViewApi";
import { jobApi, Question } from "@/services/jobApi";

// ─── Styles ───────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');

  .cv-root * { box-sizing: border-box; }

  .cv-root {
    font-family: 'DM Sans', sans-serif;
    background: #F5F4F1;
    min-height: 100vh;
    color: #1A1916;
  }

  /* ── Header ── */
  .cv-header {
    background: #FFFFFF;
    border-bottom: 1px solid #E8E5DF;
    padding: 0 32px;
    height: 68px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 40;
  }
  .cv-header-left { display: flex; align-items: center; gap: 16px; }
  .cv-header-title { font-size: 16px; font-weight: 600; letter-spacing: -0.01em; color: #1A1916; }
  .cv-header-sub {
    font-size: 11px; color: #9E9A91; font-weight: 500;
    margin-top: 2px; display: flex; align-items: center; gap: 6px;
  }
  .cv-header-actions { display: flex; gap: 10px; align-items: center; }

  /* ── Buttons ── */
  .cv-btn {
    height: 38px; padding: 0 18px;
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 600;
    cursor: pointer;
    display: inline-flex; align-items: center; gap: 7px;
    transition: all 0.15s ease;
    border: none; white-space: nowrap;
  }
  .cv-btn-outline {
    background: transparent;
    border: 1px solid #D4CFC6 !important;
    color: #1A1916;
  }
  .cv-btn-outline:hover { background: #F5F4F1; }
  .cv-btn-dark { background: #1A1916; color: #fff; }
  .cv-btn-dark:hover { background: #2D2C28; }
  .cv-btn-green { background: #E8F5EF; color: #1A6B4A; border: 1px solid #BBE4D4 !important; }
  .cv-btn-green:hover { background: #D1EDE0; }
  .cv-btn-ghost {
    width: 36px; height: 36px; padding: 0;
    border-radius: 8px;
    border: 1px solid #E8E5DF !important;
    background: transparent; color: #6B675E;
  }
  .cv-btn-ghost:hover { background: #F5F4F1; }

  /* ── Layout ── */
  .cv-main {
    max-width: 1280px; margin: 0 auto;
    padding: 28px 32px 64px;
    display: grid;
    grid-template-columns: 316px 1fr;
    gap: 20px;
  }
  .cv-sidebar { display: flex; flex-direction: column; gap: 14px; }

  /* ── Card ── */
  .cv-card {
    background: #FFFFFF;
    border: 1px solid #E8E5DF;
    border-radius: 20px;
    overflow: hidden;
  }
  .cv-card-header {
    padding: 16px 20px;
    border-bottom: 1px solid #E8E5DF;
    display: flex; align-items: center; gap: 10px;
  }
  .cv-card-header-icon {
    width: 30px; height: 30px; border-radius: 8px;
    background: #F5F4F1;
    display: flex; align-items: center; justify-content: center;
    color: #6B675E; flex-shrink: 0;
  }
  .cv-card-header-title { font-size: 13px; font-weight: 600; color: #1A1916; }

  /* ── Profile Card ── */
  .cv-profile-banner {
    height: 76px;
    background: linear-gradient(135deg, #1A1916 0%, #3D3B34 100%);
    position: relative; overflow: hidden;
  }
  .cv-profile-banner::after {
    content: '';
    position: absolute; inset: 0;
    background: repeating-linear-gradient(
      -55deg, transparent, transparent 18px,
      rgba(255,255,255,0.018) 18px, rgba(255,255,255,0.018) 36px
    );
  }
  .cv-profile-top {
    padding: 0 20px; margin-top: -34px; margin-bottom: 14px;
    display: flex; align-items: flex-end; justify-content: space-between;
  }
  .cv-avatar-wrap { position: relative; }
  .cv-avatar {
    width: 68px; height: 68px; border-radius: 50%;
    border: 3px solid #fff;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  .cv-score-dot {
    position: absolute; bottom: -3px; right: -3px;
    background: #059669; color: #fff;
    border-radius: 99px; font-size: 9px; font-weight: 700;
    padding: 2px 5px; border: 2px solid #fff;
    font-family: 'DM Mono', monospace;
    white-space: nowrap;
  }
  .cv-profile-name {
    font-size: 17px; font-weight: 700; letter-spacing: -0.02em;
    padding: 0 20px; margin-bottom: 3px;
  }
  .cv-profile-id {
    font-size: 11px; color: #9E9A91;
    padding: 0 20px 14px;
    font-family: 'DM Mono', monospace; font-weight: 500;
  }
  .cv-divider { height: 1px; background: #E8E5DF; margin: 0 20px 14px; }
  .cv-contacts { padding: 0 20px 20px; display: flex; flex-direction: column; gap: 7px; }
  .cv-contact-item {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 10px; border-radius: 8px; background: #F5F4F1;
  }
  .cv-contact-icon { color: #9E9A91; flex-shrink: 0; }
  .cv-contact-text { font-size: 12px; font-weight: 500; color: #6B675E; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  /* ── Score Card ── */
  .cv-score-body { padding: 20px; }
  .cv-score-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
  .cv-score-lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9E9A91; margin-bottom: 4px; }
  .cv-score-num {
    font-size: 34px; font-weight: 700; letter-spacing: -0.04em; line-height: 1;
    font-family: 'DM Mono', monospace; color: #1A1916;
  }
  .cv-score-num span { font-size: 15px; color: #9E9A91; font-weight: 400; }
  .cv-score-track { height: 5px; background: #F5F4F1; border-radius: 99px; overflow: hidden; }
  .cv-score-fill { height: 100%; background: linear-gradient(90deg, #059669, #10B981); border-radius: 99px; transition: width 0.8s ease; }
  .cv-score-stats { margin-top: 14px; }
  .cv-stat-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 0; border-bottom: 1px solid #F0EDE8;
  }
  .cv-stat-row:last-child { border-bottom: none; }
  .cv-stat-lbl { font-size: 12px; color: #9E9A91; font-weight: 500; }
  .cv-stat-val { font-size: 12px; font-weight: 600; color: #1A1916; }

  /* ── Status Pill ── */
  .cv-pill {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 9px; border-radius: 99px;
    font-size: 11px; font-weight: 600;
  }
  .cv-pill-green { background: #E8F5EF; color: #1A6B4A; }
  .cv-pill-amber { background: #FEF3C7; color: #92400E; }
  .cv-pill-blue  { background: #EFF6FF; color: #1D4ED8; }
  .cv-pill-dot { width: 5px; height: 5px; border-radius: 50%; }
  .cv-pill-green .cv-pill-dot { background: #059669; }
  .cv-pill-amber .cv-pill-dot { background: #D97706; }
  .cv-pill-blue  .cv-pill-dot { background: #2563EB; }

  /* ── Journey ── */
  .cv-journey-list { padding: 12px 14px 16px; display: flex; flex-direction: column; gap: 5px; }
  .cv-journey-step {
    display: flex; align-items: center; gap: 11px;
    padding: 11px 12px; border-radius: 14px;
    border: 1px solid transparent;
    cursor: pointer; transition: all 0.15s ease;
  }
  .cv-journey-step:hover { background: #F5F4F1; }
  .cv-journey-step.active { background: #F0FDF7; border-color: #BBE4D4; }
  .cv-journey-icon {
    width: 34px; height: 34px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .cv-journey-step.active .cv-journey-icon { background: #1A6B4A; color: #fff; }
  .cv-journey-step:not(.active) .cv-journey-icon { background: #F5F4F1; color: #9E9A91; }
  .cv-journey-lbl { font-size: 13px; font-weight: 600; color: #1A1916; }
  .cv-journey-sub { font-size: 11px; color: #9E9A91; font-weight: 500; margin-top: 1px; }
  .cv-journey-check { margin-left: auto; color: #1A6B4A; flex-shrink: 0; }
  .cv-offer-btn {
    margin-top: 8px; width: 100%; height: 44px;
    background: #1A1916; color: #fff;
    border: none; border-radius: 12px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 600;
    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: background 0.15s ease;
  }
  .cv-offer-btn:hover { background: #2D2C28; }

  /* ── Tabs ── */
  .cv-tab-bar {
    display: flex; gap: 2px;
    border-bottom: 1px solid #E8E5DF;
    margin-bottom: 18px;
  }
  .cv-tab-btn {
    padding: 11px 16px;
    background: transparent; border: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 500;
    color: #9E9A91; cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px; transition: all 0.15s ease;
  }
  .cv-tab-btn:hover { color: #1A1916; }
  .cv-tab-btn.active { color: #1A1916; font-weight: 600; border-bottom-color: #1A1916; }

  /* ── Section Cards ── */
  .cv-section {
    background: #fff; border: 1px solid #E8E5DF;
    border-radius: 20px; overflow: hidden; margin-bottom: 14px;
  }
  .cv-section-head {
    padding: 14px 22px; background: #FAFAF8;
    border-bottom: 1px solid #E8E5DF;
    display: flex; align-items: center; gap: 9px;
  }
  .cv-section-head-icon { color: #9E9A91; }
  .cv-section-head-title { font-size: 13px; font-weight: 600; color: #6B675E; }
  .cv-section-body {
    padding: 22px; font-size: 13px; line-height: 1.8;
    color: #6B675E; white-space: pre-line;
  }

  /* ── Q&A ── */
  .cv-qa-wrap { padding: 22px; }
  .cv-qa-item { padding-bottom: 22px; margin-bottom: 22px; border-bottom: 1px solid #F0EDE8; }
  .cv-qa-item:last-child { padding-bottom: 0; margin-bottom: 0; border-bottom: none; }
  .cv-qa-q {
    font-size: 13px; font-weight: 600; color: #1A1916;
    margin-bottom: 10px; display: flex; gap: 10px; align-items: flex-start;
  }
  .cv-qa-num {
    flex-shrink: 0; width: 20px; height: 20px; border-radius: 6px;
    background: #1A1916; color: #fff;
    font-size: 10px; font-weight: 700; margin-top: 1px;
    display: flex; align-items: center; justify-content: center;
    font-family: 'DM Mono', monospace;
  }
  .cv-qa-a {
    background: #F5F4F1; border: 1px solid #E8E5DF;
    border-radius: 12px; padding: 13px 15px;
    font-size: 13px; color: #6B675E; line-height: 1.75;
    margin-left: 30px;
  }

  /* ── Schedule Modal ── */
  .cv-modal-header {
    padding: 22px 26px 18px;
    border-bottom: 1px solid #E8E5DF;
    display: flex; align-items: center; justify-content: space-between;
  }
  .cv-modal-title { font-size: 15px; font-weight: 700; letter-spacing: -0.01em; }
  .cv-modal-sub { font-size: 12px; color: #9E9A91; font-weight: 500; margin-top: 2px; }
  .cv-modal-body { padding: 20px 26px; display: flex; flex-direction: column; gap: 14px; }
  .cv-modal-footer { padding: 14px 26px 22px; display: flex; gap: 9px; }
  .cv-field-lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #9E9A91; margin-bottom: 6px; }
  .cv-field-input {
    width: 100%; height: 40px;
    border: 1px solid #E8E5DF; border-radius: 8px;
    padding: 0 12px; font-family: 'DM Sans', sans-serif;
    font-size: 13px; color: #1A1916; background: #F5F4F1;
    outline: none; transition: border-color 0.15s ease;
  }
  .cv-field-input:focus { border-color: #1A1916; background: #fff; }
  .cv-btn-cancel {
    height: 40px; flex: 1; background: #F5F4F1;
    border: 1px solid #E8E5DF; color: #6B675E;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
    border-radius: 8px; cursor: pointer; transition: all 0.15s ease;
  }
  .cv-btn-cancel:hover { border-color: #D4CFC6; }
  .cv-btn-confirm {
    height: 40px; flex: 2; background: #1A1916; color: #fff;
    border: none; font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 600; border-radius: 8px; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    transition: background 0.15s ease;
  }
  .cv-btn-confirm:hover { background: #2D2C28; }

  /* ── Resume Modal ── */
  .cv-resume-inner { display: flex; flex-direction: column; height: 100%; }
  .cv-resume-topbar {
    padding: 14px 20px;
    background: #1A1916; color: #fff;
    display: flex; align-items: center; justify-content: space-between;
    flex-shrink: 0;
  }
  .cv-resume-topbar-title { font-size: 13px; font-weight: 600; }
  .cv-iframe-wrap { flex: 1; background: #2D2C28; margin: 8px; border-radius: 12px; overflow: hidden; }
  .cv-iframe { width: 100%; height: 100%; border: none; display: block; }
`;

// ─── Tiny helper components ───────────────────────────────────────────────────

const StatusPill = ({
  status,
  label,
}: {
  status: "green" | "amber" | "blue";
  label: string;
}) => (
  <span className={`cv-pill cv-pill-${status}`}>
    <span className="cv-pill-dot" />
    {label}
  </span>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const CandidateView = () => {
  const [candidate, setCandidate] = useState<CandidateWithAnswers | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "screening">(
    "profile",
  );

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);

  const [resumeBlobUrl, setResumeBlobUrl] = useState<string | null>(null);
  const [interviewForm, setInterviewForm] = useState({
    summary: "",
    start_time: "",
    end_time: "",
  });

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("candidate");
    if (id) fetchData(id);
    return () => {
      if (resumeBlobUrl) URL.revokeObjectURL(resumeBlobUrl);
    };
  }, []);

  const fetchData = async (id: string) => {
    try {
      setLoading(true);
      const data = await candidateViewApi.getCandidateById(id);
      setCandidate(data);
      setInterviewForm((f) => ({ ...f, summary: `Interview: ${data.name}` }));
      if (data.job_id) setQuestions(await jobApi.getJobQuestions(data.job_id));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (field: string, value: any) => {
    if (!candidate) return;
    setCandidate((prev: any) => ({ ...prev, [field]: value }));
    try {
      await candidateViewApi.updateStatus(candidate.candidate_id, {
        [field]: value,
      });
    } catch (e) {
      console.error("Failed to update status", e);
    }
  };

  const handleOpenResume = async () => {
    if (!candidate?.resume_url) return;
    try {
      const { url } = await candidateViewApi.getResumeBlob(
        candidate.resume_url,
      );
      if (resumeBlobUrl) URL.revokeObjectURL(resumeBlobUrl);
      setResumeBlobUrl(url);
      setShowResumeModal(true);
    } catch {
      alert("Error loading resume");
    }
  };

  const handleSendOffer = async (offerData: any) => {
    console.log("Offer Sent with data:", offerData);
    await updateStatus("offered", true);
  };

  if (loading || !candidate) {
    return (
      <DashboardLayout>
        <div
          style={{
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Loader2
            size={28}
            className="animate-spin"
            style={{ color: "#6B675E" }}
          />
        </div>
      </DashboardLayout>
    );
  }

  const aiScore = candidate.ai_score ?? 0;

  const journeySteps = [
    {
      key: "selected_for_interview",
      icon: <Award size={16} />,
      label: "Shortlisted",
      desc: candidate.selected_for_interview
        ? "Marked for review"
        : "Mark for review",
      onClick: () =>
        updateStatus(
          "selected_for_interview",
          !candidate.selected_for_interview,
        ),
    },
    {
      key: "interview_scheduled",
      icon: <Video size={16} />,
      label: "Interview Scheduled",
      desc: candidate.interview_scheduled
        ? "Reschedule meeting"
        : "Schedule meeting",
      onClick: () => setShowScheduleModal(true),
    },
    {
      key: "interviewed",
      icon: <CheckCircle2 size={16} />,
      label: "Interviewed",
      desc: candidate.interviewed
        ? "Interview complete"
        : "Mark as interviewed",
      onClick: () => updateStatus("interviewed", !candidate.interviewed),
    },
  ];

  return (
    <DashboardLayout>
      <style>{CSS}</style>
      <div className="cv-root">
        {/* ── Header ── */}
        <header className="cv-header">
          <div className="cv-header-left">
            <button
              className="cv-btn cv-btn-ghost"
              onClick={() => window.history.back()}
            >
              <ChevronLeft size={16} />
            </button>
            <div>
              <div className="cv-header-title">{candidate.name}</div>
              <div className="cv-header-sub">
                <Clock size={11} />
                Applied{" "}
                {new Date(candidate.created_at ?? "").toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric", year: "numeric" },
                )}
                <span style={{ opacity: 0.35 }}>·</span>
                <StatusPill status="green" label="Active" />
              </div>
            </div>
          </div>

          <div className="cv-header-actions">
            <button
              className="cv-btn cv-btn-outline"
              onClick={handleOpenResume}
            >
              Preview CV
            </button>
            <button
              className="cv-btn"
              style={{
                background: candidate.selected_for_interview
                  ? "#1A6B4A"
                  : "#1A1916",
                color: "#fff",
              }}
              onClick={() =>
                updateStatus(
                  "selected_for_interview",
                  !candidate.selected_for_interview,
                )
              }
            >
              {candidate.selected_for_interview ? (
                <>
                  <Check size={14} /> Shortlisted
                </>
              ) : (
                <>
                  <Sparkles size={14} /> Shortlist Candidate
                </>
              )}
            </button>
          </div>
        </header>

        {/* ── Main Grid ── */}
        <main className="cv-main">
          {/* ── Sidebar ── */}
          <aside className="cv-sidebar">
            {/* Profile Card */}
            <div className="cv-card">
              <div className="cv-profile-banner" />
              <div className="cv-profile-top">
                <div className="cv-avatar-wrap">
                  <Avatar className="cv-avatar">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${candidate.name}`}
                    />
                    <AvatarFallback style={{ fontSize: 22, fontWeight: 700 }}>
                      {candidate.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  {candidate.ai_score !== null && (
                    <span className="cv-score-dot">{aiScore}%</span>
                  )}
                </div>
                <StatusPill status="green" label="Available" />
              </div>
              <div className="cv-profile-name">{candidate.name}</div>
              <div className="cv-profile-id">ID: {candidate.candidate_id}</div>
              <div className="cv-divider" />
              <div className="cv-contacts">
                <div className="cv-contact-item">
                  <Mail size={13} className="cv-contact-icon" />
                  <span className="cv-contact-text">{candidate.email}</span>
                </div>
                <div className="cv-contact-item">
                  <span className="cv-contact-icon">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </span>
                  <span className="cv-contact-text">
                    {candidate.phone || "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Score Card */}
            <div className="cv-card">
              <div className="cv-score-body">
                <div className="cv-score-top">
                  <div>
                    <div className="cv-score-lbl">AI Match Score</div>
                    <div className="cv-score-num">
                      {aiScore}
                      <span>%</span>
                    </div>
                  </div>
                  <StatusPill
                    status={
                      aiScore >= 75 ? "green" : aiScore >= 50 ? "amber" : "blue"
                    }
                    label={
                      aiScore >= 75
                        ? "Strong Match"
                        : aiScore >= 50
                          ? "Good Match"
                          : "Moderate"
                    }
                  />
                </div>
                <div className="cv-score-track">
                  <div
                    className="cv-score-fill"
                    style={{ width: `${aiScore}%` }}
                  />
                </div>
                <div className="cv-score-stats">
                  {[
                    {
                      label: "Applied",
                      value: new Date(
                        candidate.created_at ?? "",
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }),
                    },
                    {
                      label: "Stage",
                      value: candidate.interviewed
                        ? "Post-Interview"
                        : candidate.interview_scheduled
                          ? "Interview Set"
                          : "In Review",
                    },
                  ].map(({ label, value }) => (
                    <div className="cv-stat-row" key={label}>
                      <span className="cv-stat-lbl">{label}</span>
                      <span className="cv-stat-val">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recruitment Journey */}
            <div className="cv-card">
              <div className="cv-card-header">
                <div className="cv-card-header-icon">
                  <Briefcase size={15} />
                </div>
                <span className="cv-card-header-title">
                  Recruitment Pipeline
                </span>
              </div>
              <div className="cv-journey-list">
                {journeySteps.map((step) => (
                  <div
                    key={step.key}
                    className={`cv-journey-step ${(candidate as any)[step.key] ? "active" : ""}`}
                    onClick={step.onClick}
                  >
                    <div className="cv-journey-icon">{step.icon}</div>
                    <div>
                      <div className="cv-journey-lbl">{step.label}</div>
                      <div className="cv-journey-sub">{step.desc}</div>
                    </div>
                    {(candidate as any)[step.key] && (
                      <span className="cv-journey-check">
                        <Check size={14} />
                      </span>
                    )}
                  </div>
                ))}

                {candidate.interviewed && (
                  <button
                    className="cv-offer-btn"
                    onClick={() => setShowOfferModal(true)}
                  >
                    <Sparkles size={14} /> Generate Offer Letter
                  </button>
                )}
              </div>
            </div>
          </aside>

          {/* ── Content ── */}
          <div>
            <div className="cv-tab-bar">
              {(
                [
                  { id: "profile", label: "Profile Detail" },
                  { id: "screening", label: "Screening Answers" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  className={`cv-tab-btn ${activeTab === t.id ? "active" : ""}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {activeTab === "profile" && (
              <>
                <div className="cv-section">
                  <div className="cv-section-head">
                    <Briefcase size={14} className="cv-section-head-icon" />
                    <span className="cv-section-head-title">
                      Work Experience
                    </span>
                  </div>
                  <div className="cv-section-body">
                    {candidate.experience || "Not provided."}
                  </div>
                </div>
                <div className="cv-section">
                  <div className="cv-section-head">
                    <GraduationCap size={14} className="cv-section-head-icon" />
                    <span className="cv-section-head-title">Education</span>
                  </div>
                  <div className="cv-section-body">
                    {candidate.education || "Not provided."}
                  </div>
                </div>
              </>
            )}

            {activeTab === "screening" && (
              <div className="cv-section">
                <div className="cv-qa-wrap">
                  {questions.length === 0 && (
                    <p
                      style={{
                        fontSize: 13,
                        color: "#9E9A91",
                        textAlign: "center",
                        padding: "24px 0",
                      }}
                    >
                      No screening questions found.
                    </p>
                  )}
                  {questions.map((q, i) => (
                    <div key={q.question_id} className="cv-qa-item">
                      <div className="cv-qa-q">
                        <span className="cv-qa-num">{i + 1}</span>
                        {q.question_text}
                      </div>
                      <div className="cv-qa-a">
                        {candidate.answers?.find(
                          (a) => a.question_id === q.question_id,
                        )?.answer_text || "No response provided."}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* ── Resume Modal ── */}
        <Dialog open={showResumeModal} onOpenChange={setShowResumeModal}>
          <DialogContent
            className="p-0 border-none overflow-hidden"
            style={{
              maxWidth: "90vw",
              width: 1100,
              height: "90vh",
              borderRadius: 20,
              background: "#1A1916",
            }}
          >
            <div className="cv-resume-inner">
              <div className="cv-resume-topbar">
                <span className="cv-resume-topbar-title">
                  Resume Preview — {candidate.name}
                </span>
                <button
                  style={{
                    background: "#3D3B34",
                    border: "none",
                    color: "#fff",
                    padding: "6px 14px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "DM Sans, sans-serif",
                  }}
                  onClick={() => window.open(resumeBlobUrl!, "_blank")}
                >
                  Open in new tab ↗
                </button>
              </div>
              <div className="cv-iframe-wrap">
                {resumeBlobUrl && (
                  <iframe
                    src={resumeBlobUrl}
                    className="cv-iframe"
                    title="Resume Preview"
                  />
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Schedule Interview Modal ── */}
        <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
          <DialogContent
            className="p-0 border-none"
            style={{ maxWidth: 440, borderRadius: 20, overflow: "hidden" }}
          >
            <div className="cv-modal-header">
              <div>
                <div
                  className="cv-modal-title"
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <Calendar size={16} style={{ color: "#1A6B4A" }} />
                  Schedule Interview
                </div>
                <div className="cv-modal-sub">with {candidate.name}</div>
              </div>
            </div>
            <div className="cv-modal-body">
              <div>
                <div className="cv-field-lbl">Start Time</div>
                <input
                  className="cv-field-input"
                  type="datetime-local"
                  value={interviewForm.start_time}
                  onChange={(e) =>
                    setInterviewForm((f) => ({
                      ...f,
                      start_time: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <div className="cv-field-lbl">End Time</div>
                <input
                  className="cv-field-input"
                  type="datetime-local"
                  value={interviewForm.end_time}
                  onChange={(e) =>
                    setInterviewForm((f) => ({
                      ...f,
                      end_time: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="cv-modal-footer">
              <button
                className="cv-btn-cancel"
                onClick={() => setShowScheduleModal(false)}
              >
                Cancel
              </button>
              <button
                className="cv-btn-confirm"
                onClick={() => {
                  updateStatus("interview_scheduled", true);
                  setShowScheduleModal(false);
                }}
              >
                <Calendar size={13} /> Confirm Schedule
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Offer Letter Modal (your component) ── */}
        <OfferLetterModal
          isOpen={showOfferModal}
          onClose={() => setShowOfferModal(false)}
          candidateId={candidate.candidate_id}
          candidateName={candidate.name}
          candidateEmail={candidate.email}
          onSendSuccess={handleSendOffer}
        />
      </div>
    </DashboardLayout>
  );
};

export default CandidateView;

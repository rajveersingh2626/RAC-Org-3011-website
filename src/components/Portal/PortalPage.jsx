import React, { useState, useEffect } from 'react';
import { dbService, mockStore } from '../../lib/supabaseClient';
import { 
  Bell, FileText, ShieldCheck, Flag, PlusCircle, 
  Send, AlertTriangle, CheckCircle2, Megaphone, Lock, Mail, RefreshCw, X, MessageSquare, ExternalLink
} from 'lucide-react';

export default function PortalPage({
  userRole = 'president',
  setUserRole,
  userSession
}) {
  const [activePortalTab, setActivePortalTab] = useState('management'); // 'management' | 'announcements' | 'districtFeed'
  
  // Data state
  const [submissions, setSubmissions] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  
  // New Report Modal Form State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [editingSubId, setEditingSubId] = useState(null);
  
  const [reportForm, setReportForm] = useState({
    title: '',
    category: 'Disease Prevention & Treatment',
    budget: '₹50,000',
    beneficiaries: '200 People',
    narrative: '',
    proofUrl: ''
  });

  // Flag Modal State (For District Officers)
  const [flaggingSub, setFlaggingSub] = useState(null);
  const [flagComment, setFlagComment] = useState('');

  // Announcement Studio State (For District Officers)
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementCategory, setAnnouncementCategory] = useState('District Event');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [sendEmailBroadcast, setSendEmailBroadcast] = useState(true);
  const [announcementSuccessMsg, setAnnouncementSuccessMsg] = useState('');

  // User details derived from session or defaults
  const userEmail = userSession?.email || 'techrid3011@gmail.com';
  const isDistrictOfficer = userRole === 'officer' || userRole === 'admin';

  // Load initial data from Supabase Cloud or Local Fallback
  useEffect(() => {
    async function loadCloudData() {
      const subs = await dbService.fetchSubmissions();
      const annos = await dbService.fetchAnnouncements();
      setSubmissions(subs);
      setAnnouncements(annos);
    }
    loadCloudData();
  }, []);

  // Submit New or Edited Report (Direct Reporting)
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportForm.title || !reportForm.narrative) return;

    if (editingSubId) {
      // Re-submitting a flagged report
      const updated = submissions.map(s => {
        if (s.id === editingSubId) {
          return {
            ...s,
            title: reportForm.title,
            category: reportForm.category,
            budget: reportForm.budget,
            beneficiaries: reportForm.beneficiaries,
            narrative: reportForm.narrative,
            proofUrl: reportForm.proofUrl || s.proofUrl,
            status: 'reported', // clear flag status
            flagComment: null
          };
        }
        return s;
      });
      setSubmissions(updated);
      mockStore.saveSubmissions(updated);
    } else {
      // Direct New Project Report
      const newSub = {
        id: `sub-${Date.now()}`,
        clubName: userEmail.includes('galgotia') 
          ? 'Rotaract Club of Galgotia University' 
          : 'Rotaract Club of Delhi Heights',
        clubEmail: userEmail,
        submittedBy: `Officer (${userEmail.split('@')[0]})`,
        title: reportForm.title,
        category: reportForm.category,
        budget: reportForm.budget,
        beneficiaries: reportForm.beneficiaries,
        narrative: reportForm.narrative,
        proofUrl: reportForm.proofUrl || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600',
        status: 'reported',
        flagComment: null,
        submittedAt: new Date().toISOString().split('T')[0]
      };
      const updated = await dbService.insertSubmission(newSub);
      setSubmissions(updated);
    }

    setIsReportModalOpen(false);
    setEditingSubId(null);
    setReportForm({
      title: '',
      category: 'Disease Prevention & Treatment',
      budget: '₹50,000',
      beneficiaries: '200 People',
      narrative: '',
      proofUrl: ''
    });
  };

  // Open edit modal for flagged report
  const handleOpenEditReport = (sub) => {
    setEditingSubId(sub.id);
    setReportForm({
      title: sub.title,
      category: sub.category,
      budget: sub.budget,
      beneficiaries: sub.beneficiaries,
      narrative: sub.narrative,
      proofUrl: sub.proofUrl
    });
    setIsReportModalOpen(true);
  };

  // Submit Flag Comment (District Officer)
  const handleConfirmFlag = async () => {
    if (!flaggingSub || !flagComment.trim()) return;
    const updated = await dbService.flagSubmission(flaggingSub.id, flagComment);
    setSubmissions(updated);
    setFlaggingSub(null);
    setFlagComment('');
  };

  // Submit District Announcement
  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementTitle || !announcementContent) return;

    const newAnno = {
      id: `a-${Date.now()}`,
      title: announcementTitle,
      category: announcementCategory,
      author: 'District Secretariat',
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      content: announcementContent,
      sentViaEmail: false
    };

    const updated = await dbService.insertAnnouncement(newAnno);
    setAnnouncements(updated);

    setAnnouncementSuccessMsg('Announcement published to Portal Announcements Feed & saved to Cloud Database!');

    setAnnouncementTitle('');
    setAnnouncementContent('');
    setTimeout(() => setAnnouncementSuccessMsg(''), 4500);
  };

  // Filter submissions for Club President view vs District Officer View
  const clubSubmissions = isDistrictOfficer 
    ? submissions 
    : submissions.filter(s => s.clubEmail === userEmail || s.clubName.toLowerCase().includes(userEmail.split('.')[1] || 'heights'));

  return (
    <div style={{ backgroundColor: '#FDF8FA', minHeight: '100vh', padding: '36px 24px 80px 24px', position: 'relative' }}>
      <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
        
        {/* WORKSPACE HEADER */}
        <div 
          style={{ 
            backgroundColor: '#FFFFFF',
            border: '2px solid rgba(216, 27, 96, 0.2)',
            borderRadius: '24px',
            padding: '24px 32px',
            marginBottom: '32px',
            boxShadow: '0 10px 35px rgba(216, 27, 96, 0.08)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span className="pill-pink" style={{ fontSize: '0.78rem' }}>
                DISTRICT 3011 SECURE PORTAL
              </span>
              <span className="pill-gold" style={{ fontSize: '0.78rem' }}>
                <ShieldCheck size={12} /> Google 2FA Verified ({isDistrictOfficer ? 'DISTRICT SECRETARIAT' : 'CLUB OFFICER'})
              </span>
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)' }}>
              Logged in as: Rotary ID {userSession?.rotaryId || '10482950'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '2px' }}>
              Direct Reporting Portal • 70+ Rotaract Clubs • Encrypted Workspace
            </p>
          </div>

          {/* AUTHENTICATED ACCESS LEVEL BADGE */}
          <div style={{ background: '#FDF5F8', padding: '10px 18px', borderRadius: '16px', border: '1px solid rgba(216, 27, 96, 0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="var(--rotaract-pink)" />
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Authenticated Role
              </div>
              <div style={{ fontSize: '0.86rem', fontWeight: 900, color: 'var(--rotaract-pink)' }}>
                {isDistrictOfficer ? 'DISTRICT SECRETARIAT OFFICER' : 'CLUB PRESIDENT / SECRETARY'}
              </div>
            </div>
          </div>
        </div>

        {/* PORTAL NAVIGATION TABS */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', borderBottom: '2px solid rgba(216, 27, 96, 0.1)', paddingBottom: '12px', overflowX: 'auto' }}>
          <button
            onClick={() => setActivePortalTab('management')}
            style={{
              background: activePortalTab === 'management' ? 'var(--rotaract-pink)' : 'transparent',
              color: activePortalTab === 'management' ? '#FFFFFF' : 'var(--text-secondary)',
              border: 'none',
              padding: '10px 22px',
              borderRadius: '100px',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FileText size={18} />
            {isDistrictOfficer ? 'Master District Submissions' : 'My Club Project Reports'}
          </button>

          <button
            onClick={() => setActivePortalTab('announcements')}
            style={{
              background: activePortalTab === 'announcements' ? 'var(--rotaract-pink)' : 'transparent',
              color: activePortalTab === 'announcements' ? '#FFFFFF' : 'var(--text-secondary)',
              border: 'none',
              padding: '10px 22px',
              borderRadius: '100px',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Bell size={18} />
            Portal Announcements ({announcements.length})
          </button>
        </div>

        {/* TAB 1: PROJECT REPORTING & SUBMISSIONS WORKSPACE */}
        {activePortalTab === 'management' && (
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.55rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                  {isDistrictOfficer ? 'Master District Project Stream (70+ Clubs)' : 'Direct Project Reporting Workspace'}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                  {isDistrictOfficer 
                    ? 'Private audit feed of project reports submitted across District 3011. Flag entries requiring changes.' 
                    : 'Submit your club initiative reports directly to the District Secretariat.'}
                </p>
              </div>

              {!isDistrictOfficer && (
                <button 
                  onClick={() => {
                    setEditingSubId(null);
                    setReportForm({
                      title: '',
                      category: 'Disease Prevention & Treatment',
                      budget: '₹50,000',
                      beneficiaries: '200 People',
                      narrative: '',
                      proofUrl: ''
                    });
                    setIsReportModalOpen(true);
                  }}
                  className="btn-rotaract"
                  style={{ padding: '12px 24px' }}
                >
                  <PlusCircle size={18} /> Submit New Project Report
                </button>
              )}
            </div>

            {/* LIST OF SUBMISSIONS */}
            <div className="rotaract-card" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {isDistrictOfficer ? `All Reported Projects (${submissions.length})` : `My Club Reports (${clubSubmissions.length})`}
                </h4>
                <span className="pill-pink" style={{ fontSize: '0.78rem' }}>
                  Direct Reporting Enabled (No Approval Gate)
                </span>
              </div>

              {clubSubmissions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <FileText size={40} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
                  <div style={{ fontSize: '1rem', fontWeight: 700 }}>No project reports found.</div>
                  <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Click "Submit New Project Report" to log your first initiative.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {clubSubmissions.map((sub) => (
                    <div 
                      key={sub.id} 
                      style={{ 
                        background: sub.status === 'flagged' ? '#FFF1F2' : '#FDF5F8', 
                        padding: '20px 24px', 
                        borderRadius: '16px', 
                        border: sub.status === 'flagged' ? '2px solid #FECDD3' : '1px solid rgba(216, 27, 96, 0.15)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span className="pill-pink" style={{ fontSize: '0.74rem' }}>{sub.category}</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Club: <strong>{sub.clubName}</strong> • {sub.submittedAt}</span>
                          </div>
                          <h4 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--rotaract-pink)' }}>
                            {sub.title}
                          </h4>
                          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            Budget: <strong>{sub.budget}</strong> • Impact: <strong>{sub.beneficiaries}</strong> • By {sub.submittedBy}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {sub.status === 'flagged' ? (
                            <span style={{ background: '#FFE4E6', color: '#E11D48', border: '1px solid #FECDD3', padding: '6px 14px', borderRadius: '100px', fontSize: '0.78rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <Flag size={14} /> Flagged by District
                            </span>
                          ) : (
                            <span style={{ background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0', padding: '6px 14px', borderRadius: '100px', fontSize: '0.78rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <CheckCircle2 size={14} /> Directly Reported
                            </span>
                          )}

                          {/* DISTRICT OFFICER ACTION: FLAG REPORT */}
                          {isDistrictOfficer && (
                            <button
                              onClick={() => {
                                setFlaggingSub(sub);
                                setFlagComment(sub.flagComment || '');
                              }}
                              style={{
                                background: sub.status === 'flagged' ? '#E11D48' : '#FFFFFF',
                                color: sub.status === 'flagged' ? '#FFFFFF' : '#E11D48',
                                border: '1px solid #E11D48',
                                padding: '6px 14px',
                                borderRadius: '100px',
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <Flag size={14} /> {sub.status === 'flagged' ? 'Edit Flag Note' : 'Flag Report'}
                            </button>
                          )}

                          {/* CLUB OFFICER ACTION: EDIT FLAGGED REPORT */}
                          {!isDistrictOfficer && sub.status === 'flagged' && (
                            <button
                              onClick={() => handleOpenEditReport(sub)}
                              className="btn-rotaract"
                              style={{ padding: '6px 16px', fontSize: '0.8rem' }}
                            >
                              Edit & Re-submit Report
                            </button>
                          )}
                        </div>
                      </div>

                      {/* NARRATIVE */}
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                        {sub.narrative}
                      </p>

                      {/* FLAG COMMENT CALLOUT (IF FLAGGED) */}
                      {sub.status === 'flagged' && sub.flagComment && (
                        <div style={{ background: '#FFF1F2', borderLeft: '4px solid #E11D48', padding: '12px 16px', borderRadius: '8px', fontSize: '0.85rem', color: '#9F1239', marginTop: '4px' }}>
                          <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                            <MessageSquare size={14} /> District Officer Feedback Comment:
                          </div>
                          "{sub.flagComment}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PORTAL ANNOUNCEMENTS & BROADCAST STUDIO */}
        {activePortalTab === 'announcements' && (
          <div>
            {/* DISTRICT OFFICER ANNOUNCEMENT BROADCAST STUDIO */}
            {isDistrictOfficer && (
              <div className="rotaract-card" style={{ padding: '28px', marginBottom: '32px', borderLeft: '5px solid var(--rotaract-pink)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <Megaphone size={22} color="var(--rotaract-pink)" />
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                    District Announcement Broadcast Studio
                  </h3>
                </div>

                {announcementSuccessMsg && (
                  <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534', padding: '12px 16px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={18} /> {announcementSuccessMsg}
                  </div>
                )}

                <form onSubmit={handlePostAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, marginBottom: '6px' }}>Announcement Title *</label>
                      <input
                        type="text"
                        placeholder="e.g. Mandatory Monthly Reporting Deadline: August 31"
                        required
                        value={announcementTitle}
                        onChange={(e) => setAnnouncementTitle(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(216,27,96,0.25)', fontSize: '0.9rem', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, marginBottom: '6px' }}>Category</label>
                      <select
                        value={announcementCategory}
                        onChange={(e) => setAnnouncementCategory(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(216,27,96,0.25)', fontSize: '0.9rem', outline: 'none', backgroundColor: '#FFFFFF' }}
                      >
                        <option value="District Event">District Event</option>
                        <option value="Reporting Alert">Reporting Alert</option>
                        <option value="Service Project">Service Project</option>
                        <option value="Secretariat Notice">Secretariat Notice</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, marginBottom: '6px' }}>Announcement Message Body *</label>
                    <textarea
                      rows={3}
                      placeholder="Write the detailed broadcast message for all members and officers..."
                      required
                      value={announcementContent}
                      onChange={(e) => setAnnouncementContent(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(216,27,96,0.25)', fontSize: '0.9rem', outline: 'none', resize: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <button type="submit" className="btn-rotaract" style={{ padding: '10px 24px' }}>
                      Publish Announcement <Send size={16} />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* PORTAL ANNOUNCEMENTS FEED (FOR ALL MEMBERS) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '1.55rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                    Official Portal Announcements Feed
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                    Official alerts issued by the District Secretariat to all members.
                  </p>
                </div>
                <span className="pill-gold" style={{ fontSize: '0.78rem' }}>
                  <Megaphone size={14} /> Live Portal Stream
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {announcements.map((item) => (
                  <div 
                    key={item.id} 
                    className="rotaract-card" 
                    style={{ 
                      padding: '24px 28px',
                      borderLeft: '5px solid var(--rotaract-pink)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="pill-pink" style={{ fontSize: '0.76rem' }}>
                        {item.category}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {item.date} • By {item.author} {item.sentViaEmail && '• (Emailed to Presidents)'}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {item.title}
                    </h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
                      {item.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* SUBMIT / EDIT REPORT MODAL */}
      {isReportModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="rotaract-card" style={{ width: '100%', maxWidth: '560px', padding: '32px', position: 'relative', borderRadius: '24px', backgroundColor: '#FFFFFF' }}>
            <button onClick={() => setIsReportModalOpen(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: '#FDF0F5', border: 'none', color: 'var(--rotaract-pink)', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} />
            </button>

            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '4px' }}>
              {editingSubId ? 'Edit & Re-submit Project Report' : 'Submit Project Report'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Direct Reporting: Submitted reports are immediately saved to the district database.
            </p>

            <form onSubmit={handleReportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Project Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Youth Leadership Conclave 2026"
                  value={reportForm.title}
                  onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Rotary Focus Area</label>
                  <select
                    value={reportForm.category}
                    onChange={(e) => setReportForm({ ...reportForm, category: e.target.value })}
                    style={{ ...inputStyle, backgroundColor: '#FFFFFF' }}
                  >
                    <option value="Peacebuilding & Conflict Prevention">Peacebuilding</option>
                    <option value="Disease Prevention & Treatment">Disease Prevention</option>
                    <option value="Water, Sanitation & Hygiene">Water & Sanitation</option>
                    <option value="Maternal & Child Health">Maternal & Child Health</option>
                    <option value="Basic Education & Literacy">Education & Literacy</option>
                    <option value="Community Economic Development">Economic Development</option>
                    <option value="Environment & Sustainability">Environment</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Total Budget (₹)</label>
                  <input
                    type="text"
                    value={reportForm.budget}
                    onChange={(e) => setReportForm({ ...reportForm, budget: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Direct Beneficiaries Count</label>
                <input
                  type="text"
                  value={reportForm.beneficiaries}
                  onChange={(e) => setReportForm({ ...reportForm, beneficiaries: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Detailed Narrative & Outcomes *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe the actions taken, community impact, and partner organizations..."
                  value={reportForm.narrative}
                  onChange={(e) => setReportForm({ ...reportForm, narrative: e.target.value })}
                  style={{ ...inputStyle, resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsReportModalOpen(false)} className="btn-rotaract-outline" style={{ padding: '10px 20px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-rotaract" style={{ padding: '10px 24px' }}>
                  {editingSubId ? 'Re-submit Updated Report' : 'Submit Direct Report'} <Send size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FLAG COMMENT MODAL (FOR DISTRICT OFFICERS) */}
      {flaggingSub && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="rotaract-card" style={{ width: '100%', maxWidth: '480px', padding: '28px', position: 'relative', borderRadius: '20px', backgroundColor: '#FFFFFF', border: '2px solid #E11D48' }}>
            <button onClick={() => setFlaggingSub(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: '#FFF1F2', border: 'none', color: '#E11D48', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Flag size={22} color="#E11D48" />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                Flag Report with Feedback Note
              </h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Report: <strong>"{flaggingSub.title}"</strong> by {flaggingSub.clubName}
            </p>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, marginBottom: '6px' }}>Flag Feedback Comment for Club Officer *</label>
              <textarea
                rows={4}
                placeholder="e.g. Please provide photo proof of the event and clarify the exact budget distribution..."
                value={flagComment}
                onChange={(e) => setFlagComment(e.target.value)}
                style={{ ...inputStyle, resize: 'none', border: '1px solid #FECDD3' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button type="button" onClick={() => setFlaggingSub(null)} className="btn-rotaract-outline" style={{ padding: '8px 16px' }}>
                Cancel
              </button>
              <button onClick={handleConfirmFlag} style={{ background: '#E11D48', color: '#FFFFFF', border: 'none', padding: '10px 20px', borderRadius: '100px', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Flag size={14} /> Submit Flag Comment
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: '0.82rem',
  fontWeight: 800,
  color: 'var(--text-primary)',
  marginBottom: '6px'
};

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '10px',
  border: '1px solid rgba(216, 27, 96, 0.25)',
  fontSize: '0.9rem',
  outline: 'none'
};

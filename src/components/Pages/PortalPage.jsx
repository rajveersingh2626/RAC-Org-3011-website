import React, { useState, useEffect, useMemo } from 'react';
import { dbService, mockStore, REPORT_SECTIONS } from '../../lib/supabaseClient';
import { sendReportFlaggedEmail, sendAnnouncementBroadcastEmail, sendReportingReminderEmail } from '../../lib/emailService';
import { INITIAL_CLUBS } from '../../data/districtData';
import { 
  Bell, FileText, ShieldCheck, Flag, PlusCircle, 
  Send, AlertTriangle, CheckCircle2, Megaphone, Lock, Mail, RefreshCw, X, 
  MessageSquare, ExternalLink, LogOut, Calendar, ChevronDown, ChevronUp, Trash2, 
  Users, HeartHandshake, Globe, Plane, Briefcase, Award, Sparkles, Building, Link2, Eye,
  Check, Search, Copy, Clock, BarChart3, AlertCircle
} from 'lucide-react';

const MONTH_OPTIONS = [
  'July 2026', 'August 2026', 'September 2026', 'October 2026', 
  'November 2026', 'December 2026', 'January 2027', 'February 2027', 
  'March 2027', 'April 2027', 'May 2027', 'June 2027'
];

const FOCUS_AREA_OPTIONS = [
  'Peacebuilding & Conflict Prevention',
  'Disease Prevention & Treatment',
  'Water, Sanitation & Hygiene',
  'Maternal & Child Health',
  'Basic Education & Literacy',
  'Community Economic Development',
  'Environment & Sustainability',
  'Rotary Foundation & Youth Leadership'
];

const SECTION_ICONS = {
  clubMeetings: <Users size={18} />,
  clubServices: <HeartHandshake size={18} />,
  communityServices: <Globe size={18} />,
  internationalServices: <Plane size={18} />,
  vocationalServices: <Briefcase size={18} />,
  districtProjects: <Award size={18} />
};

const getWordCount = (text) => {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
};

export default function PortalPage({
  isLoggedIn = false,
  userRole = null,
  setUserRole,
  userSession,
  onLogout,
  onOpenLoginModal,
  clubs = INITIAL_CLUBS
}) {
  const [activePortalTab, setActivePortalTab] = useState('management');
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(() => window.innerWidth >= 768 && window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
      setIsTablet(w >= 768 && w < 1024);
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const [submissions, setSubmissions] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [expandedReportId, setExpandedReportId] = useState(null);
  
  // Monthly Submission Form State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [editingReportId, setEditingReportId] = useState(null);
  
  const [selectedMonth, setSelectedMonth] = useState('August 2026');
  const [activeFormSection, setActiveFormSection] = useState('clubMeetings');
  
  // Compliance Matrix State
  const [complianceMonth, setComplianceMonth] = useState('August 2026');
  const [complianceSearch, setComplianceSearch] = useState('');
  const [complianceFilter, setComplianceFilter] = useState('all'); // 'all' | 'submitted' | 'pending' | 'flagged'
  const [copiedReminderClubId, setCopiedReminderClubId] = useState(null);

  // Sections project array state
  const [sectionsData, setSectionsData] = useState({
    clubMeetings: [],
    clubServices: [],
    communityServices: [],
    internationalServices: [],
    vocationalServices: [],
    districtProjects: []
  });

  const [flaggingSub, setFlaggingSub] = useState(null);
  const [flagComment, setFlagComment] = useState('');

  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementCategory, setAnnouncementCategory] = useState('District Event');
  const [announcementTargetAudience, setAnnouncementTargetAudience] = useState('all'); // 'all' | 'presidents' | 'secretaries' | 'dac'
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementSuccessMsg, setAnnouncementSuccessMsg] = useState('');

  const sessionRole = (userSession?.role || userRole || '').toLowerCase().trim();
  const isDistrictOfficer = sessionRole === 'officer';

  const allDistrictClubs = clubs && clubs.length > 0 ? clubs : INITIAL_CLUBS;

  useEffect(() => {
    async function loadCloudData() {
      const [subs, annos] = await Promise.all([
        dbService.fetchSubmissions(),
        dbService.fetchAnnouncements()
      ]);
      setSubmissions(subs || []);
      setAnnouncements(annos || []);
      if (subs && subs.length > 0) {
        setExpandedReportId(subs[0].id);
      }
    }
    loadCloudData();
  }, []);

  const handleDeleteReport = async (reportId) => {
    if (window.confirm("Are you sure you want to permanently delete this report submission? This will remove it from Supabase.")) {
      const updated = await dbService.deleteSubmission(reportId);
      setSubmissions(updated);
      if (expandedReportId === reportId) {
        setExpandedReportId(null);
      }
    }
  };

  // Helper to create blank project entry
  const createEmptyProject = () => ({
    id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    eventName: '',
    date: new Date().toISOString().split('T')[0],
    venue: '',
    areaOfFocus: 'Disease Prevention & Treatment',
    clubStrength: '',
    initiatedBy: 'Rotaract',
    collaboratingOrgs: '',
    districtOfficials: '',
    beneficiaryCount: '',
    description: '',
    showcaseLink: '',
    driveLink: ''
  });

  // Open modal to submit new report or resume active draft
  const handleOpenNewReport = () => {
    const existingDraft = submissions.find(s => 
      s.status === 'draft' && 
      s.month === selectedMonth &&
      (
        (userSession?.email && s.clubEmail === userSession.email) ||
        (userSession?.clubName && s.clubName === userSession.clubName)
      )
    );

    if (existingDraft) {
      setEditingReportId(existingDraft.id);
      setSectionsData(existingDraft.sections || {
        clubMeetings: [createEmptyProject()],
        clubServices: [],
        communityServices: [],
        internationalServices: [],
        vocationalServices: [],
        districtProjects: []
      });
    } else {
      setEditingReportId(null);
      setSelectedMonth('August 2026');
      setSectionsData({
        clubMeetings: [createEmptyProject()],
        clubServices: [],
        communityServices: [],
        internationalServices: [],
        vocationalServices: [],
        districtProjects: []
      });
    }
    setActiveFormSection('clubMeetings');
    setIsReportModalOpen(true);
  };

  // Open modal to edit existing flagged report
  const handleOpenEditReport = (report) => {
    setEditingReportId(report.id);
    setSelectedMonth(report.month || 'August 2026');
    setSectionsData({
      clubMeetings: report.sections?.clubMeetings || [],
      clubServices: report.sections?.clubServices || [],
      communityServices: report.sections?.communityServices || [],
      internationalServices: report.sections?.internationalServices || [],
      vocationalServices: report.sections?.vocationalServices || [],
      districtProjects: report.sections?.districtProjects || []
    });
    setActiveFormSection('clubMeetings');
    setIsReportModalOpen(true);
  };

  // Add project to a specific section
  const handleAddProjectToSection = (sectionKey) => {
    setSectionsData(prev => ({
      ...prev,
      [sectionKey]: [...(prev[sectionKey] || []), createEmptyProject()]
    }));
  };

  // Delete project from a section
  const handleDeleteProject = (sectionKey, projId) => {
    setSectionsData(prev => ({
      ...prev,
      [sectionKey]: prev[sectionKey].filter(p => p.id !== projId)
    }));
  };

  // Update project field value
  const handleUpdateProjectField = (sectionKey, projId, fieldName, value) => {
    setSectionsData(prev => ({
      ...prev,
      [sectionKey]: prev[sectionKey].map(p => {
        if (p.id === projId) {
          return { ...p, [fieldName]: value };
        }
        return p;
      })
    }));
  };

  // Submit or Save Draft Monthly Report (100% Dynamic from userSession)
  const handleSubmitMonthlyReport = async (e, targetStatus = 'reported') => {
    if (e && e.preventDefault) e.preventDefault();

    if (!userSession || !userSession.email) {
      alert('Session error: Unable to verify logged-in user profile. Please log in again.');
      return;
    }

    const totalProjs = Object.values(sectionsData).reduce((sum, arr) => sum + (arr ? arr.length : 0), 0);
    if (totalProjs === 0) {
      alert('Please add at least 1 project in any section to save or submit your monthly report.');
      return;
    }

    const activeEmail = userSession.email;
    const activeClubName = userSession.clubName || '';
    const activeFullName = userSession.fullName || '';
    const activePost = userSession.post || 'Officer';

    const reportPayload = {
      id: editingReportId || null,
      month: selectedMonth,
      clubName: activeClubName,
      clubEmail: activeEmail,
      submittedBy: activeFullName ? `${activeFullName} (${activePost})` : activePost,
      submittedAt: new Date().toISOString().split('T')[0],
      status: targetStatus, // 'draft' | 'reported' | 'flagged'
      flagComment: null,
      sections: sectionsData
    };

    const updatedSubmissions = await dbService.insertSubmission(reportPayload);
    setSubmissions(updatedSubmissions || []);
    
    if (updatedSubmissions && updatedSubmissions.length > 0) {
      const match = updatedSubmissions.find(s => s.month === selectedMonth && (s.clubEmail === activeEmail || s.clubName === activeClubName));
      if (match) {
        setExpandedReportId(match.id);
      }
    }

    setIsReportModalOpen(false);
    setEditingReportId(null);
  };

  // Confirm flag comment (District Officer) with Email Notification
  const handleConfirmFlag = async () => {
    if (!flaggingSub || !flagComment.trim()) return;
    const updated = await dbService.flagSubmission(flaggingSub.id, flagComment);
    setSubmissions(updated);

    // Trigger Automated Email Dispatch via Resend API
    const recipientEmail = flaggingSub.clubEmail || 'techrid3011@gmail.com';
    const emailRes = await sendReportFlaggedEmail({
      clubName: flaggingSub.clubName,
      month: flaggingSub.month,
      recipientEmail: recipientEmail,
      flagComment: flagComment
    });

    if (!emailRes.success && emailRes.fallbackMailto) {
      const emailSubject = encodeURIComponent(`[District 3011 Alert] Action Required: Monthly Report Flagged - ${flaggingSub.month}`);
      const emailBody = encodeURIComponent(
        `Dear Club Officers of ${flaggingSub.clubName},\n\nYour Monthly Project Report for ${flaggingSub.month} has been flagged by District Secretariat 3011 with the following officer feedback comment:\n\n"${flagComment}"\n\nPlease log into the District Portal to edit and re-submit your report.\n\nRegards,\nRotaract District Organization 3011`
      );
      window.open(`mailto:${recipientEmail},techrid3011@gmail.com?subject=${emailSubject}&body=${emailBody}`, '_blank');
    }

    setFlaggingSub(null);
    setFlagComment('');
  };

  // Post District Announcement with Audience-Targeted Email Broadcast
  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementTitle || !announcementContent) return;

    const authorLabel = userSession?.fullName 
      ? `${userSession.fullName}${userSession.post ? ` (${userSession.post})` : ''}`
      : 'District Secretariat 3011';

    const newAnno = {
      id: `a-${Date.now()}`,
      title: announcementTitle,
      category: announcementCategory,
      targetAudience: announcementTargetAudience,
      author: authorLabel,
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      content: announcementContent,
      sentViaEmail: true
    };

    const updated = await dbService.insertAnnouncement(newAnno);
    setAnnouncements(updated);

    // Fetch target emails dynamically based on selected audience group
    // TEST_GROUP_EMAILS is defined at the top of the announcements render block (line ~1257) — reuse here
    const TEST_GROUP_EMAILS_BROADCAST = [
      'itsdrrarchit@gmail.com',
      'sarthakmanchanda2@gmail.com',
      'rtrshefali2004@gmail.com',
      'himanshugulati.rotary@gmail.com',
      'harshitam2636@gmail.com',
      'jasraj2626@gmail.com',
      'rtrdivyanshu3011@gmail.com',
      'dhruvika038@gmail.com'
    ];

    let recipientEmails = ['techrid3011@gmail.com'];

    if (announcementTargetAudience === 'test_group') {
      recipientEmails = TEST_GROUP_EMAILS_BROADCAST;
    } else if (announcementTargetAudience !== 'all') {
      // Fetch audience emails via secure RPC (avoids direct user_profiles table access)
      try {
        const { data: emailList, error: emailErr } = await dbService.fetchAudienceEmails(announcementTargetAudience);
        if (!emailErr && emailList && emailList.length > 0) {
          recipientEmails = emailList;
        }
      } catch (err) {
        console.warn('Audience email fetch notice:', err);
      }
    }

    const audienceLabel = announcementTargetAudience === 'test_group' ? 'Secretariat & Tech Test Group (8 Members)' :
                          announcementTargetAudience === 'presidents' ? 'Club Presidents' :
                          announcementTargetAudience === 'secretaries' ? 'Club Secretaries' :
                          announcementTargetAudience === 'dac' ? 'DAC District Officers' : 'All Members & Officers';

    const emailResult = await sendAnnouncementBroadcastEmail({
      title: announcementTitle,
      category: announcementCategory,
      author: authorLabel,
      content: announcementContent,
      recipients: recipientEmails,
      audienceLabel: audienceLabel
    });

    if (emailResult && emailResult.success) {
      setAnnouncementSuccessMsg(`Announcement published to Portal & emailed to ${audienceLabel} (${recipientEmails.length} recipients)! ${emailResult.notice || ''}`);
    } else {
      setAnnouncementSuccessMsg(`Announcement published to Portal! (Email Notice: ${emailResult?.error || 'Resend domain restriction - see Resend Dashboard'})`);
    }
    setAnnouncementTitle('');
    setAnnouncementContent('');
    setTimeout(() => setAnnouncementSuccessMsg(''), 7000);
  };

  // Copy Reminder Message to Clipboard for pending clubs
  const handleCopyReminder = (clubName, presidentName) => {
    const reminderText = `Dear Rtr. ${presidentName || 'President'} (President, ${clubName}),\nThis is an official reminder from District Secretariat 3011 to submit your Monthly Project Report for ${complianceMonth} on the District Portal.\n\nPlease submit your report at your earliest convenience.\n- Rotaract District Organization 3011`;
    navigator.clipboard.writeText(reminderText);
    setCopiedReminderClubId(clubName);
    setTimeout(() => setCopiedReminderClubId(null), 3000);
  };

  // State for sending live email reminders
  const [sendingReminderClub, setSendingReminderClub] = useState(null);
  const [reminderEmailStatus, setReminderEmailStatus] = useState({});

  // Direct automated email reminder dispatch via Serverless API
  const handleSendReminderEmail = async (club) => {
    setSendingReminderClub(club.name);
    const targetEmail = club.email || club.secretaryEmail || 'techrid3011@gmail.com';
    const emailRes = await sendReportingReminderEmail({
      clubName: club.name,
      month: complianceMonth,
      recipientEmail: targetEmail
    });
    setSendingReminderClub(null);
    if (emailRes && emailRes.success) {
      setReminderEmailStatus(prev => ({ ...prev, [club.name]: 'sent' }));
    } else {
      setReminderEmailStatus(prev => ({ ...prev, [club.name]: 'failed' }));
    }
    setTimeout(() => {
      setReminderEmailStatus(prev => {
        const next = { ...prev };
        delete next[club.name];
        return next;
      });
    }, 4000);
  };

  const userClubName = (userSession?.clubName || '').toLowerCase().replace(/rotaract|club|of|\s+/g, '');
  const userEmail = (userSession?.email || '').toLowerCase();

  const clubSubmissions = isDistrictOfficer 
    ? submissions 
    : submissions.filter(s => {
        if (!s) return false;
        const subClubName = (s.clubName || '').toLowerCase().replace(/rotaract|club|of|\s+/g, '');
        const subEmail = (s.clubEmail || '').toLowerCase();
        return (
          subEmail === userEmail || 
          (userClubName.length > 3 && subClubName.includes(userClubName)) || 
          (subClubName.length > 3 && userClubName.includes(subClubName))
        );
      });

  // Calculate compliance data for the selected month
  const clubComplianceList = allDistrictClubs.map(c => {
    const matchingReport = submissions.find(s => {
      if (s.month !== complianceMonth) return false;
      const subName = (s.clubName || '').toLowerCase().replace(/rotaract|club|of|\s+/g, '');
      const clubFull = (c.name || '').toLowerCase().replace(/rotaract|club|of|\s+/g, '');
      const clubShort = (c.shortName || '').toLowerCase().replace(/rotaract|club|of|\s+/g, '');
      const subEmail = (s.clubEmail || '').toLowerCase();
      const clubEmail = (c.email || '').toLowerCase();
      const secEmail = (c.secretaryEmail || '').toLowerCase();

      return (
        (subEmail && clubEmail && subEmail === clubEmail) ||
        (subEmail && secEmail && subEmail === secEmail) ||
        (subName && clubFull && subName === clubFull) ||
        (clubShort.length > 3 && subName.includes(clubShort)) ||
        (subName.length > 3 && clubFull.includes(subName))
      );
    });

    let status = 'pending'; // 'submitted' | 'flagged' | 'pending'
    if (matchingReport) {
      status = matchingReport.status === 'flagged' ? 'flagged' : 'submitted';
    }

    return {
      club: c,
      report: matchingReport || null,
      status: status
    };
  });

  const totalClubsCount = clubComplianceList.length;
  const submittedClubsCount = clubComplianceList.filter(item => item.status === 'submitted' || item.status === 'flagged').length;
  const pendingClubsCount = totalClubsCount - submittedClubsCount;
  const flaggedClubsCount = clubComplianceList.filter(item => item.status === 'flagged').length;
  const complianceRate = totalClubsCount > 0 ? Math.round((submittedClubsCount / totalClubsCount) * 100) : 0;

  // Filter compliance list by search & status
  const filteredComplianceList = clubComplianceList.filter(item => {
    const matchesSearch = !complianceSearch || 
      item.club.name.toLowerCase().includes(complianceSearch.toLowerCase()) || 
      item.club.zone.toLowerCase().includes(complianceSearch.toLowerCase()) ||
      (item.club.president && item.club.president.toLowerCase().includes(complianceSearch.toLowerCase()));

    const matchesStatus = complianceFilter === 'all' || 
      (complianceFilter === 'submitted' && (item.status === 'submitted' || item.status === 'flagged')) ||
      (complianceFilter === 'pending' && item.status === 'pending') ||
      (complianceFilter === 'flagged' && item.status === 'flagged');

    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{
      backgroundColor: '#FDF8FA',
      minHeight: '100vh',
      /* Mobile: reduce side padding and add top padding for fixed navbar */
      padding: isMobile ? '80px 12px 60px 12px' : '36px 24px 80px 24px',
      position: 'relative'
    }}>
      <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
        
        {/* UNAUTHENTICATED LOCK SCREEN */}
        {!isLoggedIn && !userSession && (
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '2px solid var(--rotaract-pink)',
            borderRadius: isMobile ? '18px' : '24px',
            padding: isMobile ? '28px 16px' : '40px 32px',
            textAlign: 'center',
            marginBottom: '32px',
            boxShadow: '0 14px 40px rgba(216, 27, 96, 0.12)'
          }}>
            <Lock size={44} style={{ color: 'var(--rotaract-pink)', marginBottom: '14px' }} />
            <h3 style={{ fontSize: '1.7rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '8px' }}>
              District 3011 Portal Login Required
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.96rem', maxWidth: '560px', margin: '0 auto 24px auto', lineHeight: 1.5 }}>
              Access to Monthly Compliance Reporting, Secretariat Matrix, and Internal Announcements requires 2FA authentication via your official Rotary ID or Email.
            </p>
            <button
              onClick={onOpenLoginModal}
              className="btn-rotaract"
              style={{ padding: '14px 32px', fontSize: '1rem' }}
            >
              <ShieldCheck size={20} /> Log In to District Portal
            </button>
          </div>
        )}

        {/* WORKSPACE HEADER */}
        <div 
          style={{ 
            backgroundColor: '#FFFFFF',
            border: '2px solid rgba(216, 27, 96, 0.2)',
            borderRadius: isMobile ? '18px' : '24px',
            padding: isMobile ? '18px 16px' : isTablet ? '20px 24px' : '24px 32px',
            marginBottom: isMobile ? '20px' : '32px',
            boxShadow: '0 10px 35px rgba(216, 27, 96, 0.08)',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span className="pill-pink" style={{ fontSize: '0.74rem' }}>
                DISTRICT 3011 SECURE PORTAL
              </span>
              <span className="pill-gold" style={{ fontSize: '0.74rem' }}>
                <ShieldCheck size={12} /> Google 2FA ({isDistrictOfficer ? 'SECRETARIAT' : 'CLUB OFFICER'})
              </span>
            </div>
            <h2 style={{ fontSize: isMobile ? '1.35rem' : '1.7rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
              Welcome, {userSession?.fullName || 'Officer'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: isMobile ? '0.84rem' : '0.92rem', fontWeight: 800, color: 'var(--rotaract-pink)' }}>
                {isDistrictOfficer 
                  ? (userSession?.post || userSession?.designation || 'District Rotaract Representative') 
                  : `${userSession?.clubName || 'Rotaract Club'} • ${userSession?.post || 'Club Officer'}`
                }
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>•</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {userSession?.rotaryId ? `ID: ${userSession.rotaryId}` : (userSession?.email || 'N/A')}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: isMobile ? '100%' : 'auto' }}>
            {onLogout && (
              <button
                onClick={onLogout}
                style={{
                  background: 'rgba(225, 29, 72, 0.10)',
                  border: '1.5px solid rgba(225, 29, 72, 0.35)',
                  color: '#E11D48',
                  padding: '10px 18px',
                  borderRadius: '14px',
                  fontSize: '0.86rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 14px rgba(225, 29, 72, 0.10)',
                  width: isMobile ? '100%' : 'auto',
                  minHeight: '44px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#E11D48';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(225, 29, 72, 0.10)';
                  e.currentTarget.style.color = '#E11D48';
                }}
                title="Log out of District Portal"
              >
                <LogOut size={16} /> Logout
              </button>
            )}
          </div>
        </div>

        {/* PORTAL TABS — horizontal scrollable on mobile */}
        <div style={{
          display: 'flex',
          gap: isMobile ? '8px' : '12px',
          marginBottom: '28px',
          borderBottom: '2px solid rgba(216, 27, 96, 0.1)',
          paddingBottom: '12px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          /* Hide scrollbar visually but keep it functional */
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          <button
            onClick={() => setActivePortalTab('management')}
            style={{
              background: activePortalTab === 'management' ? 'var(--rotaract-pink)' : 'transparent',
              color: activePortalTab === 'management' ? '#FFFFFF' : 'var(--text-secondary)',
              border: 'none',
              padding: isMobile ? '10px 14px' : '10px 22px',
              borderRadius: '100px',
              fontWeight: 800,
              fontSize: isMobile ? '0.8rem' : '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              minHeight: '44px',
              flexShrink: 0
            }}
          >
            <FileText size={18} />
            {isDistrictOfficer ? 'Master District Submissions' : 'My Monthly Reports'}
          </button>

          {isDistrictOfficer && (
            <button
              onClick={() => setActivePortalTab('compliance')}
              style={{
                background: activePortalTab === 'compliance' ? 'var(--rotaract-pink)' : 'transparent',
                color: activePortalTab === 'compliance' ? '#FFFFFF' : 'var(--text-secondary)',
                border: 'none',
                padding: isMobile ? '10px 14px' : '10px 22px',
                borderRadius: '100px',
                fontWeight: 800,
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                minHeight: '44px',
                flexShrink: 0
              }}
            >
              <BarChart3 size={18} />
              Compliance Matrix ({submittedClubsCount}/{totalClubsCount} Submitted)
            </button>
          )}

          <button
            onClick={() => setActivePortalTab('announcements')}
            style={{
              background: activePortalTab === 'announcements' ? 'var(--rotaract-pink)' : 'transparent',
              color: activePortalTab === 'announcements' ? '#FFFFFF' : 'var(--text-secondary)',
              border: 'none',
              padding: isMobile ? '10px 14px' : '10px 22px',
              borderRadius: '100px',
              fontWeight: 800,
              fontSize: isMobile ? '0.8rem' : '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              minHeight: '44px',
              flexShrink: 0
            }}
          >
            <Bell size={18} />
            Portal Announcements ({announcements.length})
          </button>
        </div>

        {/* TAB 1: MONTHLY PROJECT REPORTING WORKSPACE */}
        {activePortalTab === 'management' && (
          <div>
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'stretch' : 'center',
              marginBottom: '24px',
              gap: '16px'
            }}>
              <div>
                <h3 style={{ fontSize: isMobile ? '1.25rem' : '1.55rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                  {isDistrictOfficer ? 'Master District Monthly Reports Stream' : 'Monthly Project Reporting Workspace'}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: isMobile ? '0.82rem' : '0.88rem', marginTop: '4px' }}>
                  {isDistrictOfficer 
                    ? 'Audit feed of monthly reports submitted across District 3011. Inspect section entries and flag reports requiring changes.' 
                    : 'Submit your monthly report across the 6 Rotary avenues for District Secretariat audit.'}
                </p>
              </div>

              {!isDistrictOfficer && (
                <button 
                  onClick={handleOpenNewReport}
                  className="btn-rotaract"
                  style={{
                    padding: isMobile ? '12px 18px' : '12px 24px',
                    fontSize: '0.92rem',
                    width: isMobile ? '100%' : 'auto',
                    justifyContent: 'center',
                    minHeight: '44px'
                  }}
                >
                  <PlusCircle size={18} /> + Submit Monthly Report
                </button>
              )}
            </div>

            {/* LIST OF MONTHLY REPORTS */}
            <div className="rotaract-card" style={{ padding: isMobile ? '16px 12px' : isTablet ? '20px' : '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ fontSize: isMobile ? '1rem' : '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {isDistrictOfficer ? `All Monthly Reports (${submissions.length})` : `My Club Monthly Reports (${clubSubmissions.length})`}
                </h4>
              </div>

              {clubSubmissions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <FileText size={40} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
                  <div style={{ fontSize: '1rem', fontWeight: 700 }}>No monthly reports submitted yet.</div>
                  <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Click "+ Submit Monthly Project Report" to log your first report.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {clubSubmissions.map((report) => {
                    const totalProjs = Object.values(report.sections || {}).reduce((sum, arr) => sum + (arr ? arr.length : 0), 0);
                    const isExpanded = expandedReportId === report.id;

                    return (
                      <div 
                        key={report.id} 
                        style={{ 
                          background: report.status === 'flagged' ? '#FFF1F2' : '#FFFFFF', 
                          borderRadius: '20px', 
                          border: report.status === 'flagged' ? '2px solid #FECDD3' : '1px solid rgba(216, 27, 96, 0.18)',
                          boxShadow: '0 4px 20px rgba(216, 27, 96, 0.04)',
                          overflow: 'hidden',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {/* Report Header Card */}
                        <div style={{
                          padding: isMobile ? '16px 14px' : '24px',
                          display: 'flex',
                          flexDirection: isMobile ? 'column' : 'row',
                          justifyContent: 'space-between',
                          alignItems: isMobile ? 'stretch' : 'center',
                          gap: '14px',
                          borderBottom: isExpanded ? '1px solid rgba(216, 27, 96, 0.12)' : 'none',
                          background: report.status === 'flagged' ? '#FFF1F2' : '#FDF5F8'
                        }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                              <span className="pill-gold" style={{ fontSize: '0.74rem' }}>
                                <Calendar size={12} /> {report.month || 'August 2026'}
                              </span>
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                By <strong>{report.submittedBy}</strong> ({report.submittedAt})
                              </span>
                            </div>

                            <h4 style={{ fontSize: isMobile ? '1.2rem' : '1.4rem', fontWeight: 900, color: 'var(--rotaract-pink)', margin: 0 }}>
                              {report.clubName}
                            </h4>

                            <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 600 }}>
                              Reported Projects: <strong>{totalProjs} Projects</strong>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
                            {report.status === 'flagged' ? (
                              <span style={{ background: '#FFE4E6', color: '#E11D48', border: '1px solid #FECDD3', padding: '6px 12px', borderRadius: '100px', fontSize: '0.76rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <Flag size={13} /> Flagged
                              </span>
                            ) : (
                              <span style={{ background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0', padding: '6px 12px', borderRadius: '100px', fontSize: '0.76rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <CheckCircle2 size={13} /> Submitted
                              </span>
                            )}

                            {isDistrictOfficer && (
                              <button
                                onClick={() => {
                                  setFlaggingSub(report);
                                  setFlagComment(report.flagComment || '');
                                }}
                                style={{
                                  background: report.status === 'flagged' ? '#E11D48' : '#FFFFFF',
                                  color: report.status === 'flagged' ? '#FFFFFF' : '#E11D48',
                                  border: '1px solid #E11D48',
                                  padding: '6px 12px',
                                  borderRadius: '100px',
                                  fontSize: '0.78rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  minHeight: '38px'
                                }}
                              >
                                <Flag size={13} /> {report.status === 'flagged' ? 'Edit Flag' : 'Flag'}
                              </button>
                            )}

                            {!isDistrictOfficer && report.status === 'flagged' && (
                              <button
                                onClick={() => handleOpenEditReport(report)}
                                className="btn-rotaract"
                                style={{ padding: '6px 14px', fontSize: '0.78rem', minHeight: '38px' }}
                              >
                                Edit & Re-submit
                              </button>
                            )}

                            <button
                              onClick={() => setExpandedReportId(isExpanded ? null : report.id)}
                              style={{
                                background: '#FFFFFF',
                                border: '1px solid rgba(216, 27, 96, 0.25)',
                                color: 'var(--rotaract-pink)',
                                padding: '6px 12px',
                                borderRadius: '100px',
                                fontSize: '0.78rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                minHeight: '38px',
                                flex: isMobile ? '1 1 auto' : 'none',
                                justifyContent: 'center'
                              }}
                            >
                              <Eye size={13} /> {isExpanded ? 'Collapse' : 'Inspect'}
                            </button>

                            {isDistrictOfficer && (
                              <button
                                onClick={() => handleDeleteReport(report.id)}
                                style={{
                                  background: '#FFF1F2',
                                  border: '1px solid #FECDD3',
                                  color: '#E11D48',
                                  padding: '6px 12px',
                                  borderRadius: '100px',
                                  fontSize: '0.78rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  minHeight: '38px'
                                }}
                                title="Delete report submission"
                              >
                                <Trash2 size={13} /> Delete
                              </button>
                            )}
                          </div>
                        </div>

                        {/* FLAGGED NOTE COMMENT */}
                        {report.status === 'flagged' && report.flagComment && (
                          <div style={{ background: '#FFF1F2', borderLeft: '4px solid #E11D48', padding: '12px 16px', fontSize: '0.84rem', color: '#9F1239' }}>
                            <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                              <MessageSquare size={14} /> District Feedback:
                            </div>
                            "{report.flagComment}"
                          </div>
                        )}

                        {/* EXPANDED SECTION BREAKDOWN */}
                        {isExpanded && (
                          <div style={{ padding: isMobile ? '16px 12px' : '24px', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {REPORT_SECTIONS.map((sec) => {
                              const secProjects = report.sections?.[sec.id] || [];
                              return (
                                <div key={sec.id} style={{ background: '#FDF8FA', border: '1px solid rgba(216, 27, 96, 0.12)', borderRadius: '16px', padding: isMobile ? '14px 10px' : '20px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid rgba(216, 27, 96, 0.1)', paddingBottom: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span style={{ color: 'var(--rotaract-pink)' }}>{SECTION_ICONS[sec.id]}</span>
                                      <h5 style={{ fontSize: isMobile ? '0.98rem' : '1.1rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                                        {sec.label}
                                      </h5>
                                    </div>
                                    <span className="pill-pink" style={{ fontSize: '0.72rem' }}>
                                      {secProjects.length} Projects
                                    </span>
                                  </div>

                                  {secProjects.length === 0 ? (
                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 0' }}>
                                      No projects reported under {sec.label} for {report.month}.
                                    </div>
                                  ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
                                      {secProjects.map((proj, pIdx) => (
                                        <div key={pIdx} style={{ background: '#FFFFFF', border: '1px solid #F3E5EB', borderRadius: '12px', padding: isMobile ? '12px' : '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                            <h6 style={{ fontSize: '0.98rem', fontWeight: 900, color: 'var(--rotaract-pink)', margin: 0, lineHeight: 1.3 }}>
                                              {proj.eventName || 'Unnamed Event'}
                                            </h6>
                                            <span style={{ fontSize: '0.68rem', background: '#FDF0F5', color: 'var(--rotaract-pink)', padding: '2px 6px', borderRadius: '6px', fontWeight: 800, whiteSpace: 'nowrap' }}>
                                              {proj.areaOfFocus}
                                            </span>
                                          </div>

                                          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '4px 8px', fontSize: '0.76rem', color: 'var(--text-secondary)', background: '#F9FAFB', padding: '8px 10px', borderRadius: '8px' }}>
                                            <div><strong>Date:</strong> {proj.date || '-'}</div>
                                            <div><strong>Venue:</strong> {proj.venue || '-'}</div>
                                            <div><strong>Strength:</strong> {proj.clubStrength || '-'}</div>
                                            <div><strong>Initiated:</strong> {proj.initiatedBy || '-'}</div>
                                            <div><strong>Collab:</strong> {proj.collaboratingOrgs || 'None'}</div>
                                            <div><strong>Officials:</strong> {proj.districtOfficials || 'None'}</div>
                                            <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}><strong>Beneficiaries:</strong> {proj.beneficiaryCount || '-'}</div>
                                          </div>

                                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '4px 0' }}>
                                            {proj.description}
                                          </p>

                                          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '4px', paddingTop: '6px', borderTop: '1px dashed #E2E8F0' }}>
                                            {proj.showcaseLink && (
                                              <a href={proj.showcaseLink} target="_blank" rel="noreferrer" style={{ fontSize: '0.76rem', color: '#123499', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                                                <Link2 size={12} /> Rotary Showcase <ExternalLink size={10} />
                                              </a>
                                            )}

                                            {proj.driveLink && (
                                              <a href={proj.driveLink} target="_blank" rel="noreferrer" style={{ fontSize: '0.76rem', color: 'var(--rotaract-pink)', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                                                <ExternalLink size={12} /> Drive Media <ExternalLink size={10} />
                                              </a>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: DISTRICT COMPLIANCE MATRIX (70+ CLUBS TRACKER) */}
        {activePortalTab === 'compliance' && isDistrictOfficer && (
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.55rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                  District 3011 Monthly Compliance Matrix
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                  Track which of the 70+ Rotaract Clubs have submitted their monthly reports for the selected Rotary month.
                </p>
              </div>

              {/* Month Selector for Compliance */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#FFFFFF', padding: '8px 16px', borderRadius: '14px', border: '2px solid var(--rotaract-pink)' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 900, color: 'var(--rotaract-pink)' }}>Select Month:</span>
                <select
                  value={complianceMonth}
                  onChange={(e) => setComplianceMonth(e.target.value)}
                  style={{
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--rotaract-pink)',
                    fontWeight: 900,
                    fontSize: '0.92rem',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {MONTH_OPTIONS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* KPI STAT CARDS */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
              gap: isMobile ? '10px' : '16px',
              marginBottom: isMobile ? '20px' : '28px'
            }}>
              <div style={{ background: '#FFFFFF', border: '1px solid rgba(216, 27, 96, 0.18)', borderRadius: '16px', padding: isMobile ? '14px 12px' : '20px', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Total Clubs
                </div>
                <div style={{ fontSize: isMobile ? '1.4rem' : '1.8rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {totalClubsCount} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Active</span>
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--rotaract-pink)', marginTop: '4px', fontWeight: 700 }}>
                  3 Regional Zones
                </div>
              </div>

              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '16px', padding: isMobile ? '14px 12px' : '20px' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>
                  Submitted ({complianceMonth})
                </div>
                <div style={{ fontSize: isMobile ? '1.4rem' : '1.8rem', fontWeight: 900, color: '#15803D', marginTop: '4px' }}>
                  {submittedClubsCount} <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 600 }}>({complianceRate}%)</span>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#166534', marginTop: '4px', fontWeight: 700 }}>
                  Verified Reports
                </div>
              </div>

              <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '16px', padding: isMobile ? '14px 12px' : '20px' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#9F1239', textTransform: 'uppercase' }}>
                  Pending
                </div>
                <div style={{ fontSize: isMobile ? '1.4rem' : '1.8rem', fontWeight: 900, color: '#E11D48', marginTop: '4px' }}>
                  {pendingClubsCount} <span style={{ fontSize: '0.8rem', color: '#9F1239', fontWeight: 600 }}>({100 - complianceRate}%)</span>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#9F1239', marginTop: '4px', fontWeight: 700 }}>
                  Awaiting Report
                </div>
              </div>

              <div style={{ background: '#FEFCE8', border: '1px solid #FEF08A', borderRadius: '16px', padding: isMobile ? '14px 12px' : '20px' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#854D0E', textTransform: 'uppercase' }}>
                  Flagged
                </div>
                <div style={{ fontSize: isMobile ? '1.4rem' : '1.8rem', fontWeight: 900, color: '#CA8A04', marginTop: '4px' }}>
                  {flaggedClubsCount} <span style={{ fontSize: '0.8rem', color: '#854D0E', fontWeight: 600 }}>Clubs</span>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#854D0E', marginTop: '4px', fontWeight: 700 }}>
                  Needs Revision
                </div>
              </div>
            </div>

            {/* SEARCH & FILTER CONTROLS */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid rgba(216, 27, 96, 0.15)',
              borderRadius: isMobile ? '16px' : '20px',
              padding: isMobile ? '16px 14px' : '20px 24px',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'stretch' : 'center',
              justifyContent: 'space-between',
              gap: '14px'
            }}>
              <div style={{ position: 'relative', width: isMobile ? '100%' : '320px', maxWidth: '100%' }}>
                <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search club name, zone, president..."
                  value={complianceSearch}
                  onChange={(e) => setComplianceSearch(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: '100px', border: '1px solid rgba(216,27,96,0.25)', fontSize: '0.86rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
                <button
                  onClick={() => setComplianceFilter('all')}
                  style={{
                    background: complianceFilter === 'all' ? 'var(--rotaract-pink)' : '#F1F5F9',
                    color: complianceFilter === 'all' ? '#FFFFFF' : '#475569',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '100px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    flex: isMobile ? '1 1 calc(50% - 6px)' : 'none',
                    textAlign: 'center',
                    minHeight: '36px'
                  }}
                >
                  All ({totalClubsCount})
                </button>
                <button
                  onClick={() => setComplianceFilter('submitted')}
                  style={{
                    background: complianceFilter === 'submitted' ? '#166534' : '#F0FDF4',
                    color: complianceFilter === 'submitted' ? '#FFFFFF' : '#166534',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '100px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    flex: isMobile ? '1 1 calc(50% - 6px)' : 'none',
                    textAlign: 'center',
                    minHeight: '36px'
                  }}
                >
                  Submitted ({submittedClubsCount})
                </button>
                <button
                  onClick={() => setComplianceFilter('pending')}
                  style={{
                    background: complianceFilter === 'pending' ? '#E11D48' : '#FFF1F2',
                    color: complianceFilter === 'pending' ? '#FFFFFF' : '#E11D48',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '100px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    flex: isMobile ? '1 1 calc(50% - 6px)' : 'none',
                    textAlign: 'center',
                    minHeight: '36px'
                  }}
                >
                  Pending ({pendingClubsCount})
                </button>
                <button
                  onClick={() => setComplianceFilter('flagged')}
                  style={{
                    background: complianceFilter === 'flagged' ? '#CA8A04' : '#FEFCE8',
                    color: complianceFilter === 'flagged' ? '#FFFFFF' : '#854D0E',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '100px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    flex: isMobile ? '1 1 calc(50% - 6px)' : 'none',
                    textAlign: 'center',
                    minHeight: '36px'
                  }}
                >
                  Flagged ({flaggedClubsCount})
                </button>
              </div>
            </div>

            {/* COMPLIANCE CLUBS TABLE / MOBILE CARDS */}
            <div className="rotaract-card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: isMobile ? '14px 16px' : '20px 24px', background: '#FDF5F8', borderBottom: '1px solid rgba(216,27,96,0.15)', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '8px' }}>
                <h4 style={{ fontSize: isMobile ? '0.96rem' : '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  District 3011 Compliance ({filteredComplianceList.length} Clubs)
                </h4>
                <span className="pill-pink" style={{ fontSize: '0.74rem' }}>
                  {submittedClubsCount} of {totalClubsCount} Compliant
                </span>
              </div>

              {isMobile ? (
                /* Mobile Card List View for Club Compliance */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px' }}>
                  {filteredComplianceList.map(({ club, report, status }, idx) => {
                    const totalProjs = report ? Object.values(report.sections || {}).reduce((sum, arr) => sum + (arr ? arr.length : 0), 0) : 0;
                    const isCopied = copiedReminderClubId === club.name;

                    return (
                      <div
                        key={club.id || idx}
                        style={{
                          background: '#FFFFFF',
                          border: status === 'flagged' ? '1.5px solid #FECDD3' : status === 'submitted' ? '1.5px solid #BBF7D0' : '1px solid rgba(216,27,96,0.18)',
                          borderRadius: '14px',
                          padding: '14px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                          <div>
                            <div style={{ fontSize: '0.98rem', fontWeight: 900, color: 'var(--rotaract-pink)' }}>
                              {club.name}
                            </div>
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {club.zone || 'District 3011'}
                            </div>
                          </div>

                          {status === 'submitted' && (
                            <span style={{ background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0', padding: '3px 8px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                              <CheckCircle2 size={12} /> Submitted
                            </span>
                          )}
                          {status === 'flagged' && (
                            <span style={{ background: '#FFE4E6', color: '#E11D48', border: '1px solid #FECDD3', padding: '3px 8px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                              <Flag size={12} /> Flagged
                            </span>
                          )}
                          {status === 'pending' && (
                            <span style={{ background: '#FFF1F2', color: '#9F1239', border: '1px solid #FECDD3', padding: '3px 8px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                              <Clock size={12} /> Pending
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '10px', background: '#F8FAFC', padding: '8px 10px', borderRadius: '8px' }}>
                          <div><strong>President:</strong> {club.president || 'Rtr. President'}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{club.email || 'techrid3011@gmail.com'}</div>
                          {status === 'submitted' && (
                            <div style={{ fontSize: '0.74rem', color: '#166534', marginTop: '3px', fontWeight: 700 }}>
                              {totalProjs} Projects • Submitted {report?.submittedAt}
                            </div>
                          )}
                        </div>

                        {status === 'pending' ? (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <button
                              onClick={() => handleSendReminderEmail(club)}
                              disabled={sendingReminderClub === club.name}
                              style={{
                                background: reminderEmailStatus[club.name] === 'sent' ? '#F0FDF4' : '#FFFFFF',
                                color: reminderEmailStatus[club.name] === 'sent' ? '#166534' : 'var(--rotaract-pink)',
                                border: `1px solid ${reminderEmailStatus[club.name] === 'sent' ? '#BBF7D0' : 'var(--rotaract-pink)'}`,
                                padding: '8px 6px',
                                borderRadius: '100px',
                                fontSize: '0.74rem',
                                fontWeight: 800,
                                cursor: sendingReminderClub === club.name ? 'wait' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                minHeight: '40px'
                              }}
                            >
                              {sendingReminderClub === club.name ? (
                                <><RefreshCw size={12} className="spin" /> Sending...</>
                              ) : reminderEmailStatus[club.name] === 'sent' ? (
                                <><Check size={12} /> Sent!</>
                              ) : (
                                <><Mail size={12} /> Email Reminder</>
                              )}
                            </button>

                            <button
                              onClick={() => handleCopyReminder(club.name, club.president)}
                              style={{
                                background: isCopied ? '#166534' : '#FFFFFF',
                                color: isCopied ? '#FFFFFF' : '#E11D48',
                                border: '1px solid #E11D48',
                                padding: '8px 6px',
                                borderRadius: '100px',
                                fontSize: '0.74rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                minHeight: '40px'
                              }}
                            >
                              {isCopied ? <Check size={12} /> : <Copy size={12} />}
                              {isCopied ? 'Copied!' : 'Copy Notice'}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setActivePortalTab('management');
                              if (report) setExpandedReportId(report.id);
                            }}
                            style={{
                              width: '100%',
                              background: '#FFFFFF',
                              color: 'var(--rotaract-pink)',
                              border: '1px solid rgba(216, 27, 96, 0.3)',
                              padding: '8px 14px',
                              borderRadius: '100px',
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              minHeight: '40px'
                            }}
                          >
                            <Eye size={13} /> View Submitted Report
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Desktop & Tablet Table View */
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 800 }}>
                        <th style={{ padding: '14px 20px' }}>Rotaract Club</th>
                        <th style={{ padding: '14px 20px' }}>Zone</th>
                        <th style={{ padding: '14px 20px' }}>President Contact</th>
                        <th style={{ padding: '14px 20px' }}>{complianceMonth} Status</th>
                        <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredComplianceList.map(({ club, report, status }, idx) => {
                        const totalProjs = report ? Object.values(report.sections || {}).reduce((sum, arr) => sum + (arr ? arr.length : 0), 0) : 0;
                        const isCopied = copiedReminderClubId === club.name;

                        return (
                          <tr key={club.id || idx} style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FDFBFD' }}>
                            
                            {/* Club Name */}
                            <td style={{ padding: '16px 20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                              <div style={{ fontSize: '0.95rem', color: 'var(--rotaract-pink)' }}>{club.name}</div>
                            </td>

                            {/* Zone */}
                            <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.82rem' }}>
                              {club.zone || 'District 3011'}
                            </td>

                            {/* President Contact */}
                            <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                              <div style={{ fontWeight: 700 }}>{club.president || 'Rtr. President'}</div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{club.email || 'techrid3011@gmail.com'}</div>
                            </td>

                            {/* Status */}
                            <td style={{ padding: '16px 20px' }}>
                              {status === 'submitted' && (
                                <div>
                                  <span style={{ background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0', padding: '4px 12px', borderRadius: '100px', fontSize: '0.78rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                    <CheckCircle2 size={13} /> Report Submitted
                                  </span>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    {totalProjs} Projects • Submitted {report?.submittedAt}
                                  </div>
                                </div>
                              )}

                              {status === 'flagged' && (
                                <div>
                                  <span style={{ background: '#FFE4E6', color: '#E11D48', border: '1px solid #FECDD3', padding: '4px 12px', borderRadius: '100px', fontSize: '0.78rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                    <Flag size={13} /> Flagged by District
                                  </span>
                                  <div style={{ fontSize: '0.75rem', color: '#9F1239', marginTop: '4px' }}>
                                    "{report?.flagComment || 'Needs revision'}"
                                  </div>
                                </div>
                              )}

                              {status === 'pending' && (
                                <div>
                                  <span style={{ background: '#FFF1F2', color: '#9F1239', border: '1px solid #FECDD3', padding: '4px 12px', borderRadius: '100px', fontSize: '0.78rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                    <Clock size={13} /> Pending Submission
                                  </span>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    Report not submitted yet
                                  </div>
                                </div>
                              )}
                            </td>

                            {/* Actions */}
                            <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                              {status === 'pending' ? (
                                <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                  <button
                                    onClick={() => handleSendReminderEmail(club)}
                                    disabled={sendingReminderClub === club.name}
                                    style={{
                                      background: reminderEmailStatus[club.name] === 'sent' ? '#F0FDF4' : '#FFFFFF',
                                      color: reminderEmailStatus[club.name] === 'sent' ? '#166534' : 'var(--rotaract-pink)',
                                      border: `1px solid ${reminderEmailStatus[club.name] === 'sent' ? '#BBF7D0' : 'var(--rotaract-pink)'}`,
                                      padding: '6px 12px',
                                      borderRadius: '100px',
                                      fontSize: '0.78rem',
                                      fontWeight: 800,
                                      cursor: sendingReminderClub === club.name ? 'wait' : 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      transition: 'all 0.2s ease'
                                    }}
                                    title={`Send reminder email to ${club.email}`}
                                  >
                                    {sendingReminderClub === club.name ? (
                                      <><RefreshCw size={12} className="spin" /> Sending...</>
                                    ) : reminderEmailStatus[club.name] === 'sent' ? (
                                      <><Check size={12} /> Email Sent!</>
                                    ) : (
                                      <><Mail size={12} /> Email Reminder</>
                                    )}
                                  </button>

                                  <button
                                    onClick={() => handleCopyReminder(club.name, club.president)}
                                    style={{
                                      background: isCopied ? '#166534' : '#FFFFFF',
                                      color: isCopied ? '#FFFFFF' : '#E11D48',
                                      border: '1px solid #E11D48',
                                      padding: '6px 12px',
                                      borderRadius: '100px',
                                      fontSize: '0.78rem',
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      transition: 'all 0.2s ease'
                                    }}
                                    title="Copy WhatsApp reminder text"
                                  >
                                    {isCopied ? <Check size={12} /> : <Copy size={12} />}
                                    {isCopied ? 'Copied!' : 'Copy Notice'}
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setActivePortalTab('management');
                                    if (report) setExpandedReportId(report.id);
                                  }}
                                  style={{
                                    background: '#FFFFFF',
                                    color: 'var(--rotaract-pink)',
                                    border: '1px solid rgba(216, 27, 96, 0.3)',
                                    padding: '6px 14px',
                                    borderRadius: '100px',
                                    fontSize: '0.78rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                  }}
                                >
                                  <Eye size={13} /> Inspect Report
                                </button>
                              )}
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: PORTAL ANNOUNCEMENTS */}
        {activePortalTab === 'announcements' && (
          <div>
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
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : '2fr 1fr 1fr',
                    gap: isMobile ? '12px' : '16px'
                  }}>
                    <div style={{ gridColumn: isTablet ? 'span 2' : 'span 1' }}>
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
                    <div>
                      <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, marginBottom: '6px' }}>Email Target Audience</label>
                      <select
                        value={announcementTargetAudience}
                        onChange={(e) => setAnnouncementTargetAudience(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(216,27,96,0.25)', fontSize: '0.9rem', outline: 'none', backgroundColor: '#FFFFFF', fontWeight: 800, color: 'var(--rotaract-pink)' }}
                      >
                        <option value="all">All Members & Officers</option>
                        <option value="test_group">Test Group</option>
                        <option value="presidents">Club Presidents Only</option>
                        <option value="secretaries">Club Secretaries Only</option>
                        <option value="dac">DAC District Officers Only</option>
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

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '1.55rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                    Official Portal Announcements Feed
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                    Official alerts issued by District Secretariat Officers.
                  </p>
                </div>
                <span className="pill-gold" style={{ fontSize: '0.78rem' }}>
                  <Megaphone size={14} /> Live Portal Stream
                </span>
              </div>

              {(() => {
                const TEST_GROUP_EMAILS = [
                  'itsdrrarchit@gmail.com',
                  'sarthakmanchanda2@gmail.com',
                  'rtrshefali2004@gmail.com',
                  'himanshugulati.rotary@gmail.com',
                  'harshitam2636@gmail.com',
                  'jasraj2626@gmail.com',
                  'rtrdivyanshu3011@gmail.com',
                  'dhruvika038@gmail.com'
                ];

                const visibleAnnouncements = announcements.filter(anno => {
                  if (isDistrictOfficer) return true; // District Officers see all announcements
                  
                  const target = anno.targetAudience || 'all';
                  if (target === 'all') return true;

                  const userPost = (userSession?.post || '').toLowerCase();
                  const userEmail = (userSession?.email || '').toLowerCase();
                  const uRole = (userSession?.role || '').toLowerCase();

                  if (target === 'presidents' && userPost.includes('president')) return true;
                  if (target === 'secretaries' && userPost.includes('secretary')) return true;
                  if (target === 'dac' && (uRole === 'officer' || uRole === 'dac_member')) return true;
                  if (target === 'test_group' && TEST_GROUP_EMAILS.some(e => e.toLowerCase() === userEmail)) return true;

                  return false;
                });

                if (visibleAnnouncements.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '40px', background: '#FFFFFF', borderRadius: '16px', border: '1px solid rgba(216,27,96,0.15)', color: 'var(--text-muted)' }}>
                      No announcements posted for your target group yet.
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {visibleAnnouncements.map((item) => (
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="pill-pink" style={{ fontSize: '0.76rem' }}>
                              {item.category}
                            </span>
                            <span style={{ fontSize: '0.74rem', background: '#F1F5F9', color: '#475569', padding: '3px 10px', borderRadius: '100px', fontWeight: 700 }}>
                              Target: {item.targetAudience === 'test_group' ? 'Test Group' : (item.targetAudience || 'All')}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {item.date} • Issued by <strong style={{ color: 'var(--rotaract-pink)' }}>{item.author || 'District Secretariat'}</strong>
                          </span>
                        </div>
                        <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                          {item.title}
                        </h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                          {item.content}
                        </p>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

      </div>

      {/* MONTHLY REPORT SUBMISSION STUDIO MODAL */}
      {isReportModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 3000, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? '0' : '16px' }}>
          <div 
            className="rotaract-card" 
            style={{ 
              width: '100%', 
              maxWidth: isMobile ? '100%' : '960px', 
              maxHeight: isMobile ? '94svh' : '92vh', 
              overflowY: 'auto', 
              padding: isMobile ? '20px 14px 28px 14px' : isTablet ? '24px 20px' : '32px', 
              position: 'relative', 
              borderRadius: isMobile ? '22px 22px 0 0' : '24px', 
              backgroundColor: '#FFFFFF',
              border: '2px solid var(--rotaract-pink)',
              boxShadow: '0 25px 70px rgba(216, 27, 96, 0.22)'
            }}
          >
            <button 
              onClick={() => setIsReportModalOpen(false)} 
              style={{
                position: 'absolute',
                top: isMobile ? '14px' : '24px',
                right: isMobile ? '14px' : '24px',
                background: '#FDF0F5',
                border: 'none',
                color: 'var(--rotaract-pink)',
                width: isMobile ? '44px' : '36px',
                height: isMobile ? '44px' : '36px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <X size={18} />
            </button>

            {/* Studio Header */}
            <div style={{ marginBottom: '24px', borderBottom: '1px solid rgba(216,27,96,0.15)', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className="pill-pink" style={{ fontSize: '0.76rem' }}>
                  PRESIDENT & SECRETARY REPORTING STUDIO
                </span>
              </div>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                {editingReportId ? 'Edit & Re-submit Monthly Report' : 'Submit Monthly Project Report'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '4px' }}>
                Select the reporting month and add projects under each of the 6 avenues of service.
              </p>
            </div>

            <form onSubmit={handleSubmitMonthlyReport}>
              {/* Step 1: Select Reporting Month */}
              <div style={{ background: '#FDF5F8', border: '1px solid rgba(216, 27, 96, 0.2)', padding: '16px 20px', borderRadius: '16px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 900, color: 'var(--rotaract-pink)' }}>
                    Reporting Month *
                  </label>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Select the specific month for this report submission (RY 2026-27).
                  </span>
                </div>

                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    border: '2px solid var(--rotaract-pink)',
                    backgroundColor: '#FFFFFF',
                    color: 'var(--rotaract-pink)',
                    fontWeight: 900,
                    fontSize: '0.95rem',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {MONTH_OPTIONS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Step 2: 6 Section Tabs */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : isTablet ? 'repeat(3, 1fr)' : 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: isMobile ? '6px' : '8px',
                marginBottom: '20px'
              }}>
                {REPORT_SECTIONS.map((sec) => {
                  const count = (sectionsData[sec.id] || []).length;
                  const isActive = activeFormSection === sec.id;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => setActiveFormSection(sec.id)}
                      style={{
                        background: isActive ? 'var(--rotaract-pink)' : '#F8FAFC',
                        color: isActive ? '#FFFFFF' : '#475569',
                        border: isActive ? '2px solid var(--rotaract-pink)' : '1px solid #E2E8F0',
                        borderRadius: '12px',
                        padding: isMobile ? '8px 4px' : '10px 8px',
                        fontSize: isMobile ? '0.72rem' : '0.8rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.2s ease',
                        minHeight: isMobile ? '56px' : 'auto'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', textAlign: 'center' }}>
                        {SECTION_ICONS[sec.id]}
                        <span style={{ whiteSpace: 'normal', lineHeight: 1.2 }}>{sec.label}</span>
                      </div>
                      <span 
                        style={{ 
                          fontSize: '0.68rem', 
                          background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
                          padding: '1px 6px',
                          borderRadius: '100px'
                        }}
                      >
                        {count} Projects
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Section Project List & Form Cards */}
              {(() => {
                const currentSecObj = REPORT_SECTIONS.find(s => s.id === activeFormSection);
                const projects = sectionsData[activeFormSection] || [];

                return (
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: 'var(--rotaract-pink)' }}>{SECTION_ICONS[activeFormSection]}</span>
                        <h4 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                          {currentSecObj.label} Projects
                        </h4>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddProjectToSection(activeFormSection)}
                        style={{
                          background: '#FFFFFF',
                          border: '1.5px solid var(--rotaract-pink)',
                          color: 'var(--rotaract-pink)',
                          padding: '8px 16px',
                          borderRadius: '100px',
                          fontSize: '0.84rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <PlusCircle size={16} /> + Add Project to {currentSecObj.label}
                      </button>
                    </div>

                    {projects.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '30px 20px', background: '#FFFFFF', borderRadius: '16px', border: '1px dashed #CBD5E1', color: '#64748B' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>No projects added under {currentSecObj.label} yet.</div>
                        <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>Click "+ Add Project" above to create an entry for this section.</div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {projects.map((proj, pIdx) => {
                          const wordCount = getWordCount(proj.description);

                          return (
                            <div 
                              key={proj.id} 
                              style={{ 
                                background: '#FFFFFF', 
                                border: '1px solid #E2E8F0', 
                                borderRadius: '16px', 
                                padding: '20px',
                                boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                                position: 'relative'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                                <span style={{ fontSize: '0.86rem', fontWeight: 900, color: 'var(--rotaract-pink)' }}>
                                  Project Entry #{pIdx + 1}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteProject(activeFormSection, proj.id)}
                                  style={{ background: '#FFF1F2', border: '1px solid #FECDD3', color: '#E11D48', padding: '4px 12px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <Trash2 size={14} /> Remove Entry
                                </button>
                              </div>

                              {/* 12 PROJECT FIELDS */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                  
                                  {/* Row 1: Event Name & Date */}
                                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: '12px' }}>
                                    <div>
                                      <label style={labelStyle}>1. Event Name *</label>
                                      <input
                                        type="text"
                                        required
                                        placeholder="e.g. Mahadan 9.0 Blood Camp"
                                        value={proj.eventName}
                                        onChange={(e) => handleUpdateProjectField(activeFormSection, proj.id, 'eventName', e.target.value)}
                                        style={inputStyle}
                                      />
                                    </div>
                                    <div>
                                      <label style={labelStyle}>2. Event Date *</label>
                                      <input
                                        type="date"
                                        required
                                        value={proj.date}
                                        onChange={(e) => handleUpdateProjectField(activeFormSection, proj.id, 'date', e.target.value)}
                                        style={inputStyle}
                                      />
                                    </div>
                                  </div>

                                  {/* Row 2: Venue & Area of Focus */}
                                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                                    <div>
                                      <label style={labelStyle}>3. Venue Location</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. Connaught Place Metro Station"
                                        value={proj.venue}
                                        onChange={(e) => handleUpdateProjectField(activeFormSection, proj.id, 'venue', e.target.value)}
                                        style={inputStyle}
                                      />
                                    </div>
                                    <div>
                                      <label style={labelStyle}>4. Rotary Area of Focus *</label>
                                      <select
                                        value={proj.areaOfFocus}
                                        onChange={(e) => handleUpdateProjectField(activeFormSection, proj.id, 'areaOfFocus', e.target.value)}
                                        style={{ ...inputStyle, backgroundColor: '#FFFFFF' }}
                                      >
                                        {FOCUS_AREA_OPTIONS.map(f => (
                                          <option key={f} value={f}>{f}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>

                                  {/* Row 3: Club Strength & Initiated By */}
                                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : '1fr 1fr 1fr', gap: '12px' }}>
                                    <div>
                                      <label style={labelStyle}>5. Club Strength at Event</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. 25 Members"
                                        value={proj.clubStrength}
                                        onChange={(e) => handleUpdateProjectField(activeFormSection, proj.id, 'clubStrength', e.target.value)}
                                        style={inputStyle}
                                      />
                                    </div>
                                    <div>
                                      <label style={labelStyle}>6. Initiated by *</label>
                                      <select
                                        value={proj.initiatedBy}
                                        onChange={(e) => handleUpdateProjectField(activeFormSection, proj.id, 'initiatedBy', e.target.value)}
                                        style={{ ...inputStyle, backgroundColor: '#FFFFFF' }}
                                      >
                                        <option value="Rotaract">Rotaract Club</option>
                                        <option value="Rotary">Rotary Sponsor Club</option>
                                        <option value="Other Organisation">Other Organisation</option>
                                      </select>
                                    </div>
                                    <div style={{ gridColumn: (isTablet && !isMobile) ? 'span 2' : 'span 1' }}>
                                      <label style={labelStyle}>9. Beneficiary Count</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. 350 Donors / 500 People"
                                        value={proj.beneficiaryCount}
                                        onChange={(e) => handleUpdateProjectField(activeFormSection, proj.id, 'beneficiaryCount', e.target.value)}
                                        style={inputStyle}
                                      />
                                    </div>
                                  </div>

                                  {/* Row 4: Collaborating Organisations & District Officials */}
                                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                                    <div>
                                      <label style={labelStyle}>7. Collaborating Organisations</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. Indian Red Cross, RAC Delhi Central"
                                        value={proj.collaboratingOrgs}
                                        onChange={(e) => handleUpdateProjectField(activeFormSection, proj.id, 'collaboratingOrgs', e.target.value)}
                                        style={inputStyle}
                                      />
                                    </div>
                                    <div>
                                      <label style={labelStyle}>8. District Officials / Rotarians Present</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. Rtn. DRR, ZRR Zone 2"
                                        value={proj.districtOfficials}
                                        onChange={(e) => handleUpdateProjectField(activeFormSection, proj.id, 'districtOfficials', e.target.value)}
                                        style={inputStyle}
                                      />
                                    </div>
                                  </div>

                                  {/* Row 5: 40-Word Description */}
                                  <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                      <label style={labelStyle}>10. Project Description (Target: ~40 Words) *</label>
                                      <span style={{ fontSize: '0.76rem', fontWeight: 800, color: wordCount > 40 ? '#E11D48' : 'var(--rotaract-pink)' }}>
                                        {wordCount} / 40 Words
                                      </span>
                                    </div>
                                    <textarea
                                      rows={3}
                                      required
                                      placeholder="Provide a concise 40-word summary of project objectives, execution strategy, and measurable community outcomes..."
                                      value={proj.description}
                                      onChange={(e) => handleUpdateProjectField(activeFormSection, proj.id, 'description', e.target.value)}
                                      style={{ ...inputStyle, resize: 'none' }}
                                    />
                                  </div>

                                  {/* Row 6: Rotary Showcase Link & Drive Media Link */}
                                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                                    <div>
                                      <label style={labelStyle}>11. Rotary Showcase Link (URL)</label>
                                      <input
                                        type="url"
                                        placeholder="https://showcase.rotary.org/project/..."
                                        value={proj.showcaseLink}
                                        onChange={(e) => handleUpdateProjectField(activeFormSection, proj.id, 'showcaseLink', e.target.value)}
                                        style={inputStyle}
                                      />
                                    </div>
                                    <div>
                                      <label style={labelStyle}>12. Google Drive Link (Photos & Videos)</label>
                                      <input
                                        type="url"
                                        placeholder="https://drive.google.com/drive/folders/..."
                                        value={proj.driveLink || ''}
                                        onChange={(e) => handleUpdateProjectField(activeFormSection, proj.id, 'driveLink', e.target.value)}
                                        style={inputStyle}
                                      />
                                    </div>
                                  </div>

                                </div>
                              </div>
                            );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Submit & Draft Action Buttons */}
              <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column-reverse' : 'row',
                justifyContent: 'flex-end',
                gap: '10px',
                borderTop: '1px solid #E2E8F0',
                paddingTop: '20px'
              }}>
                <button type="button" onClick={() => setIsReportModalOpen(false)} className="btn-rotaract-outline" style={{ padding: '12px 20px', width: isMobile ? '100%' : 'auto', justifyContent: 'center', minHeight: '44px' }}>
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={(e) => handleSubmitMonthlyReport(e, 'draft')}
                  style={{
                    background: '#F1F5F9',
                    border: '1.5px solid #CBD5E1',
                    color: '#334155',
                    padding: '12px 22px',
                    borderRadius: '100px',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: isMobile ? '100%' : 'auto',
                    minHeight: '44px'
                  }}
                >
                  <FileText size={18} /> Save as Draft
                </button>
                <button 
                  type="button" 
                  onClick={(e) => handleSubmitMonthlyReport(e, 'reported')}
                  className="btn-rotaract" 
                  style={{
                    padding: '12px 28px',
                    fontSize: '0.95rem',
                    width: isMobile ? '100%' : 'auto',
                    justifyContent: 'center',
                    minHeight: '44px'
                  }}
                >
                  Submit Monthly Report to District <Send size={18} />
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* FLAG COMMENT MODAL (DISTRICT OFFICER) */}
      {flaggingSub && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', zIndex: 3000, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? '0' : '20px' }}>
          <div className="rotaract-card" style={{ width: '100%', maxWidth: isMobile ? '100%' : '480px', padding: isMobile ? '20px 16px 28px 16px' : '28px', position: 'relative', borderRadius: isMobile ? '22px 22px 0 0' : '20px', backgroundColor: '#FFFFFF', border: '2px solid #E11D48' }}>
            <button onClick={() => setFlaggingSub(null)} style={{ position: 'absolute', top: isMobile ? '12px' : '16px', right: isMobile ? '12px' : '16px', background: '#FFF1F2', border: 'none', color: '#E11D48', width: isMobile ? '44px' : '30px', height: isMobile ? '44px' : '30px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Flag size={22} color="#E11D48" />
              <h3 style={{ fontSize: isMobile ? '1.15rem' : '1.3rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                Flag Report with Feedback Note
              </h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Monthly Report: <strong>"{flaggingSub.month}"</strong> by {flaggingSub.clubName}
            </p>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, marginBottom: '6px' }}>Flag Feedback Comment for Club Officer *</label>
              <textarea
                rows={4}
                placeholder="e.g. Please provide Rotary Showcase links for Community Services entries and check beneficiary counts..."
                value={flagComment}
                onChange={(e) => setFlagComment(e.target.value)}
                style={{ ...inputStyle, resize: 'none', border: '1px solid #FECDD3' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: isMobile ? 'column-reverse' : 'row', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button type="button" onClick={() => setFlaggingSub(null)} className="btn-rotaract-outline" style={{ padding: '10px 16px', width: isMobile ? '100%' : 'auto', justifyContent: 'center', minHeight: '44px' }}>
                Cancel
              </button>
              <button onClick={handleConfirmFlag} style={{ background: '#E11D48', color: '#FFFFFF', border: 'none', padding: '10px 20px', borderRadius: '100px', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: isMobile ? '100%' : 'auto', minHeight: '44px' }}>
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

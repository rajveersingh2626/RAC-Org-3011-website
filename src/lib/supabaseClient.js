import { createClient } from '@supabase/supabase-js';
import { findUserCredential } from '../data/userRegistry';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('YOUR_SUPABASE')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const MOCK_STORAGE_KEY = 'district3011_monthly_reports_v3';
const MOCK_ANNOUNCEMENTS_KEY = 'district3011_announcements_v2';

export const REPORT_SECTIONS = [
  { id: 'clubMeetings', label: 'Club Meetings', icon: 'Users' },
  { id: 'clubServices', label: 'Club Services', icon: 'HeartHandshake' },
  { id: 'communityServices', label: 'Community Services', icon: 'Globe' },
  { id: 'internationalServices', label: 'International Services', icon: 'Plane' },
  { id: 'vocationalServices', label: 'Vocational Services', icon: 'Briefcase' },
  { id: 'districtProjects', label: 'District Projects', icon: 'Award' }
];

export const INITIAL_STRUCTURED_REPORT = null;

const parseSubFromDB = (item) => {
  let sections = {
    clubMeetings: [],
    clubServices: [],
    communityServices: [],
    internationalServices: [],
    vocationalServices: [],
    districtProjects: []
  };
  let month = item.month || 'August 2026';

  try {
    if (item.sections_json) {
      const sec = typeof item.sections_json === 'string' ? JSON.parse(item.sections_json) : item.sections_json;
      sections = { ...sections, ...sec };
    } else if (item.description && (item.description.startsWith('{') || item.description.startsWith('['))) {
      const parsed = JSON.parse(item.description);
      if (parsed.sections) {
        sections = { ...sections, ...parsed.sections };
        month = parsed.month || item.title?.replace('Monthly Report - ', '') || month;
      }
    } else if (item.title && item.title.includes('Monthly')) {
      sections.communityServices.push({
        id: `legacy-${item.id}`,
        eventName: item.title,
        date: item.submitted_at ? item.submitted_at.split('T')[0] : '2026-08-15',
        venue: 'Delhi NCR',
        areaOfFocus: item.category || 'Disease Prevention & Treatment',
        clubStrength: '30 Members',
        initiatedBy: 'Rotaract',
        collaboratingOrgs: 'District 3011',
        districtOfficials: 'District Officials',
        beneficiaryCount: item.beneficiaries || '200 People',
        description: item.description || item.narrative || 'Legacy project submission.',
        showcaseLink: item.proof_url || '',
        driveLink: ''
      });
      month = item.category?.includes('Monthly') ? item.category.replace('Monthly Report (', '').replace(')', '') : 'August 2026';
    }
  } catch (err) {
    console.warn('Parser warning:', err);
  }

  return {
    id: item.id,
    month: month,
    clubName: item.club_name || item.clubName || '',
    clubEmail: item.club_email || item.clubEmail || '',
    submittedBy: item.submitted_by || item.submittedBy || 'Rotaract Officer',
    submittedAt: item.submitted_at ? item.submitted_at.split('T')[0] : item.submittedAt || new Date().toISOString().split('T')[0],
    status: item.status || 'reported',
    flagComment: item.flag_comment || item.flagComment || null,
    sections: item.sections || sections
  };
};

export const dbService = {
  authenticateUser: async (rotaryIdInput, passwordInput) => {
    const cleanId = rotaryIdInput ? rotaryIdInput.trim() : '';
    const cleanPass = passwordInput ? passwordInput.trim() : '';

    if (!cleanId) {
      return { success: false, error: 'Please enter your official Rotary ID or Email.' };
    }

    // Check Supabase Database & Auth if Supabase is connected
    if (isSupabaseConfigured && supabase) {
      try {
        // Secure Server-Side RPC Function (100% Locked Table Authentication)
        const { data: rpcUser, error: rpcErr } = await supabase
          .rpc('authenticate_rotaract_user', {
            p_identity: cleanId,
            p_password: cleanPass
          });

        if (!rpcErr && rpcUser && rpcUser.length > 0) {
          const row = rpcUser[0];
          
          if (!row.role) {
            return { success: false, error: 'Access Denied: Role is missing in Supabase database.' };
          }

          const rawRole = String(row.role).toLowerCase().trim();

          if (rawRole === 'dac_member') {
            return { success: false, error: 'Access Denied: DAC Members do not have access to District or Club Portals.' };
          }

          if (rawRole !== 'officer' && rawRole !== 'president') {
            return { success: false, error: `Access Denied: Role '${row.role}' is not authorized for portal access.` };
          }

          return {
            success: true,
            user: {
              id: row.id,
              rotaryId: row.rotary_id || cleanId,
              email: row.email || cleanId,
              role: rawRole,
              fullName: row.full_name || row.fullName || null,
              clubName: row.club_name || row.clubName || null,
              post: row.post || row.designation || null,
              totpSecret: row.totp_secret || null
            }
          };
        }

        if (rpcErr) {
          console.warn('RPC authentication notice:', rpcErr.message || rpcErr);
        }
      } catch (err) {
        console.warn('Supabase auth error:', err);
      }
    }

    return { success: false, error: 'Incorrect Rotary ID/Email or Portal Password.' };
  },

  fetchClubs: async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        // Fetch from dedicated 'clubs' table in Supabase if it exists
        const { data: clubsTableData, error: clubsErr } = await supabase
          .from('clubs')
          .select('*');

        if (!clubsErr && clubsTableData && clubsTableData.length > 0) {
          return clubsTableData.map((c, idx) => ({
            id: c.id || `sp-club-${idx}`,
            name: c.name || c.club_name,
            shortName: (c.name || c.club_name || '').replace(/^(Rotaract\s+(Club\s+of\s+)?|RAC\s+)/i, '').trim(),
            president: c.president || c.president_name || 'Rtr. President',
            isDirector: c.is_director || c.isDirector || '',
            zone: c.zone || 'District 3011',
            phone: c.phone || '',
            email: c.email || '',
            lat: c.lat || 28.6139,
            lng: c.lng || 77.2090,
            initiatives: c.initiatives || []
          }));
        }
      } catch (err) {
        console.warn('Supabase fetchClubs notice:', err);
      }
    }
    return null;
  },

  fetchSubmissions: async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        // 1. Try fetching from dedicated monthly_reports table first
        const { data: reportData, error: reportErr } = await supabase
          .from('monthly_reports')
          .select('*')
          .order('submitted_at', { ascending: false });

        if (!reportErr && reportData) {
          return reportData.map(parseSubFromDB);
        }

        // 2. Fallback to project_submissions table
        const { data: subData, error: subErr } = await supabase
          .from('project_submissions')
          .select('*')
          .order('submitted_at', { ascending: false });

        if (!subErr && subData) {
          return subData.map(parseSubFromDB);
        }
      } catch (err) {
        console.error('Supabase fetch error:', err);
      }
    }
    return mockStore.getSubmissions();
  },

  insertSubmission: async (newReport) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const totalProjs = Object.values(newReport.sections || {}).reduce((sum, arr) => sum + (arr ? arr.length : 0), 0);

        // 1. Insert/Upsert to dedicated monthly_reports table
        const reportPayload = {
          id: newReport.id && !newReport.id.startsWith('report-17') ? newReport.id : undefined,
          month: newReport.month,
          club_name: newReport.clubName,
          club_email: newReport.clubEmail,
          submitted_by: newReport.submittedBy,
          status: newReport.status || 'reported',
          sections_json: newReport.sections
        };

        const { error: mrErr } = await supabase
          .from('monthly_reports')
          .upsert([reportPayload]);

        if (!mrErr) {
          console.log('Successfully upserted report to Supabase monthly_reports table!');
          return await dbService.fetchSubmissions();
        } else {
          console.warn('Supabase monthly_reports insert notice:', mrErr.message || mrErr);
        }

        // 2. Fallback insert to project_submissions table
        const subPayload = {
          club_name: newReport.clubName,
          club_email: newReport.clubEmail,
          submitted_by: newReport.submittedBy,
          title: `${newReport.month} Monthly Report (${totalProjs} Projects)`,
          category: `Monthly Report (${newReport.month})`,
          description: JSON.stringify({ month: newReport.month, sections: newReport.sections }),
          budget: `₹${totalProjs * 25000}`,
          beneficiaries: `${totalProjs * 150} People`,
          proof_url: 'https://showcase.rotary.org',
          status: newReport.status || 'reported'
        };

        const { error: subErr } = await supabase
          .from('project_submissions')
          .insert([subPayload]);

        if (!subErr) {
          console.log('Successfully saved report to Supabase project_submissions table!');
          return await dbService.fetchSubmissions();
        } else {
          console.warn('Supabase project_submissions insert notice:', subErr.message || subErr);
        }
      } catch (err) {
        console.error('Supabase insert submission error:', err);
      }
    }
    return mockStore.addSubmission(newReport);
  },

  flagSubmission: async (id, comment) => {
    if (isSupabaseConfigured && supabase) {
      try {
        // Try updating monthly_reports
        const { error: mrErr } = await supabase
          .from('monthly_reports')
          .update({ status: 'flagged', flag_comment: comment })
          .eq('id', id);

        if (!mrErr) {
          return await dbService.fetchSubmissions();
        }

        // Fallback update project_submissions
        const { error: subErr } = await supabase
          .from('project_submissions')
          .update({ status: 'flagged', flag_comment: comment })
          .eq('id', id);

        if (!subErr) {
          return await dbService.fetchSubmissions();
        }
      } catch (err) {
        console.warn('Supabase flag notice:', err);
      }
    }
    return mockStore.flagSubmission(id, comment);
  },

  deleteSubmission: async (id) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error: mrErr } = await supabase
          .from('monthly_reports')
          .delete()
          .eq('id', id);

        const { error: subErr } = await supabase
          .from('project_submissions')
          .delete()
          .eq('id', id);

        if (!mrErr || !subErr) {
          console.log(`Successfully deleted report ${id} from Supabase!`);
          return await dbService.fetchSubmissions();
        }
      } catch (err) {
        console.error('Supabase delete error:', err);
      }
    }
    return mockStore.deleteSubmission(id);
  },

  fetchAnnouncements: async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map(a => ({
            id: a.id,
            title: a.title,
            category: a.category,
            author: a.author_name || 'District Secretariat',
            date: a.created_at ? new Date(a.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'August 2026',
            content: a.content,
            sentViaEmail: a.sent_via_email
          }));
        }
      } catch (err) {
        console.warn('Supabase announcements fetch notice:', err);
      }
    }
    return mockStore.getAnnouncements();
  },

  insertAnnouncement: async (announcement) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('announcements')
          .insert([{
            title: announcement.title,
            category: announcement.category,
            content: announcement.content,
            author_name: announcement.author || 'District Secretariat',
            sent_via_email: Boolean(announcement.sentViaEmail)
          }]);

        if (!error) {
          return await dbService.fetchAnnouncements();
        }
      } catch (err) {
        console.warn('Supabase announcement insert notice:', err);
      }
    }
    return mockStore.addAnnouncement(announcement);
  }
};

export const mockStore = {
  getSubmissions: () => {
    try {
      const data = localStorage.getItem(MOCK_STORAGE_KEY);
      if (data) {
        const raw = JSON.parse(data);
        return raw.filter(Boolean).map(parseSubFromDB);
      }
      return [];
    } catch {
      return [];
    }
  },

  saveSubmissions: (submissions) => {
    try {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(submissions));
    } catch (e) {
      console.error('Local storage save error', e);
    }
  },

  addSubmission: (newSub) => {
    const subs = mockStore.getSubmissions();
    const updated = [newSub, ...subs.filter(s => s.id !== newSub.id)];
    mockStore.saveSubmissions(updated);
    return updated;
  },

  flagSubmission: (id, comment) => {
    const subs = mockStore.getSubmissions();
    const updated = subs.map(s => s.id === id ? { ...s, status: 'flagged', flagComment: comment } : s);
    mockStore.saveSubmissions(updated);
    return updated;
  },

  deleteSubmission: (id) => {
    const subs = mockStore.getSubmissions();
    const updated = subs.filter(s => s.id !== id);
    mockStore.saveSubmissions(updated);
    return updated;
  },

  getAnnouncements: () => {
    try {
      const data = localStorage.getItem(MOCK_ANNOUNCEMENTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addAnnouncement: (newAnno) => {
    const annos = mockStore.getAnnouncements();
    const updated = [newAnno, ...annos];
    try {
      localStorage.setItem(MOCK_ANNOUNCEMENTS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Local storage save error', e);
    }
    return updated;
  }
};

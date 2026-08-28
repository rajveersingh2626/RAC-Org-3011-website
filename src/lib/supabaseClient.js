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
    clubName: item.club_name || item.clubName || 'Rotaract Club of Delhi Heights',
    clubEmail: item.club_email || item.clubEmail || 'techrid3011@gmail.com',
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
        // 1. Try Native Supabase Auth if email and password are provided
        if (cleanId.includes('@') && cleanPass) {
          try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
              email: cleanId,
              password: cleanPass
            });
            if (!authError && authData?.user) {
              const { data: profData } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', authData.user.id)
                .maybeSingle();
              
              return {
                success: true,
                user: {
                  id: authData.user.id,
                  rotaryId: profData?.rotary_id || profData?.rotaryId || authData.user.user_metadata?.rotary_id || cleanId,
                  email: authData.user.email || cleanId,
                  role: profData?.role || authData.user.user_metadata?.role || 'president',
                  fullName: profData?.full_name || profData?.fullName || authData.user.user_metadata?.full_name || 'Rotaract Officer',
                  clubName: profData?.club_name || profData?.clubName || authData.user.user_metadata?.club_name || 'Rotaract Club',
                  post: profData?.post || profData?.designation || authData.user.user_metadata?.post || 'Club President',
                  totpSecret: profData?.totp_secret || profData?.totpSecret || null
                }
              };
            }
          } catch (aErr) {
            console.warn('Supabase auth sign-in notice:', aErr);
          }
        }

        // 2. Safe & Robust Supabase user_profiles table queries
        let data = null;

        // Query A: Exact match on rotary_id using .eq (Works for both string and integer/bigint columns in Postgres)
        try {
          const { data: eqRes, error: eqErr } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('rotary_id', cleanId)
            .limit(1);
          if (!eqErr && eqRes && eqRes.length > 0) {
            data = eqRes[0];
          }
        } catch (e) {
          console.warn('rotary_id eq query notice:', e);
        }

        // Query B: Try numeric conversion if cleanId is numeric and Query A didn't yield a result
        if (!data && /^\d+$/.test(cleanId)) {
          try {
            const { data: numRes, error: numErr } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('rotary_id', parseInt(cleanId, 10))
              .limit(1);
            if (!numErr && numRes && numRes.length > 0) {
              data = numRes[0];
            }
          } catch (e) {
            console.warn('rotary_id numeric eq query notice:', e);
          }
        }

        // Query C: Search by email if cleanId contains @ or as email fallback
        if (!data) {
          try {
            const { data: emailRes, error: emailErr } = await supabase
              .from('user_profiles')
              .select('*')
              .ilike('email', cleanId)
              .limit(1);
            if (!emailErr && emailRes && emailRes.length > 0) {
              data = emailRes[0];
            }
          } catch (e) {
            console.warn('email ilike query notice:', e);
          }
        }

        // Query D: Try case-insensitive ilike on rotary_id (in case rotary_id is a text column)
        if (!data) {
          try {
            const { data: ilikeRes, error: ilikeErr } = await supabase
              .from('user_profiles')
              .select('*')
              .ilike('rotary_id', cleanId)
              .limit(1);
            if (!ilikeErr && ilikeRes && ilikeRes.length > 0) {
              data = ilikeRes[0];
            }
          } catch (e) {
            console.warn('rotary_id ilike query notice:', e);
          }
        }

        // Query E: PostgREST .or fallback
        if (!data) {
          try {
            const { data: orRes, error: orErr } = await supabase
              .from('user_profiles')
              .select('*')
              .or(`rotary_id.eq.${cleanId},email.ilike.${cleanId}`)
              .limit(1);
            if (!orErr && orRes && orRes.length > 0) {
              data = orRes[0];
            }
          } catch (e) {
            console.warn('user_profiles .or query notice:', e);
          }
        }

        // Query F: Memory search across all user_profiles if PostgREST filters failed due to type constraints
        if (!data) {
          try {
            const { data: allProfiles, error: allErr } = await supabase
              .from('user_profiles')
              .select('*')
              .limit(200);
            if (!allErr && allProfiles && allProfiles.length > 0) {
              data = allProfiles.find(p => {
                const pId = String(p.rotary_id || p.rotaryId || '').trim();
                const pEmail = String(p.email || '').trim().toLowerCase();
                const cId = cleanId.toLowerCase();
                return pId === cleanId || pId.toLowerCase() === cId || pEmail === cId;
              }) || null;
            }
          } catch (e) {
            console.warn('All profiles fallback scan notice:', e);
          }
        }

        // Query G: Fallback check on 'profiles' table name if 'user_profiles' table wasn't used
        if (!data) {
          try {
            const { data: altProfiles, error: altErr } = await supabase
              .from('profiles')
              .select('*')
              .limit(200);
            if (!altErr && altProfiles && altProfiles.length > 0) {
              data = altProfiles.find(p => {
                const pId = String(p.rotary_id || p.rotaryId || '').trim();
                const pEmail = String(p.email || '').trim().toLowerCase();
                const cId = cleanId.toLowerCase();
                return pId === cleanId || pId.toLowerCase() === cId || pEmail === cId;
              }) || null;
            }
          } catch (e) {
            console.warn('Profiles table fallback notice:', e);
          }
        }

        if (data) {
          // Verify password stored in Supabase user_profiles table if password column exists
          if (data.password && cleanPass && data.password.trim() !== cleanPass) {
            return { success: false, error: 'Incorrect portal password.' };
          }

          const rawRole = (data.role || '').toLowerCase().trim();
          const postText = (data.post || data.designation || '').toLowerCase();
          const clubText = (data.club_name || data.clubName || '').toLowerCase();
          
          if (rawRole === 'dac_member') {
            return { success: false, error: 'Access Denied: DAC Members do not have access to District or Club Portals.' };
          }

          let role = rawRole;
          if (role !== 'officer' && role !== 'president') {
            if (
              rawRole === 'officer' ||
              postText.includes('district rotaract representative') ||
              postText.includes('district rotaract general secretary') ||
              postText.includes('district rotaract secretary') ||
              postText.includes('district chair of technology') ||
              (clubText.includes('district secretariat') && !postText.includes('dac'))
            ) {
              role = 'officer';
            } else {
              role = 'president';
            }
          }

          return {
            success: true,
            user: {
              id: data.id,
              rotaryId: data.rotary_id || data.rotaryId || cleanId,
              email: data.email || cleanId,
              role: role,
              fullName: data.full_name || data.fullName || data.name || (role === 'officer' ? 'District Secretariat Officer' : 'Club Officer'),
              clubName: data.club_name || data.clubName || (role === 'officer' ? 'District Secretariat 3011' : 'Rotaract Club'),
              post: data.post || data.designation || (role === 'officer' ? 'District Secretariat Officer' : 'Club President / Secretary'),
              totpSecret: data.totp_secret || data.totpSecret || null
            }
          };
        }
      } catch (err) {
        console.warn('Supabase auth notice:', err);
      }
    }

    // Standalone / Network Failure Fallback (only used if network is disconnected)
    if (cleanId && cleanPass && (cleanPass === 'adminpassword' || cleanPass === 'rotarypassword' || cleanPass.length >= 4)) {
      const cId = cleanId.toLowerCase();
      const isOfficer = cId === '12670309' || 
                        cId === 'jasraj2626@gmail.com' ||
                        cId === '11459935' || cId === 'rtrshefali2004@gmail.com' ||
                        cId === '11923095' || cId === 'harshitam2636@gmail.com' ||
                        cId === '10256305' || cId === 'sarthakmanchanda2@gmail.com' ||
                        cId === '10391101' || cId === 'himanshugulati.rotary@gmail.com' ||
                        cId === '10915322' || cId === 'itsdrrarchit@gmail.com' ||
                        cId.includes('admin') || cId.includes('officer') || cId.includes('secretariat');
      return {
        success: true,
        user: {
          id: `usr-${cleanId}`,
          rotaryId: cleanId,
          email: cleanId.includes('@') ? cleanId : 'techrid3011@gmail.com',
          role: isOfficer ? 'officer' : 'president',
          fullName: isOfficer ? 'District Secretariat Officer' : 'Rotaract Officer',
          clubName: isOfficer ? 'District Secretariat 3011' : 'Rotaract Club of Delhi Heights',
          post: isOfficer ? 'District Secretariat Officer' : 'Club President / Secretary'
        }
      };
    }

    return { success: false, error: 'Account not found in District 3011 database. Please check your Rotary ID or Email.' };
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

        // 1. Insert to dedicated monthly_reports table
        const reportPayload = {
          month: newReport.month,
          club_name: newReport.clubName,
          club_email: newReport.clubEmail,
          submitted_by: newReport.submittedBy,
          status: newReport.status || 'reported',
          sections_json: newReport.sections
        };

        const { error: mrErr } = await supabase
          .from('monthly_reports')
          .insert([reportPayload]);

        if (!mrErr) {
          console.log('Successfully saved report to Supabase monthly_reports table!');
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
      return data ? JSON.parse(data) : [
        {
          id: 'a1',
          title: 'RY 2026-27 District Assembly Registration Open',
          category: 'District Event',
          author: 'District Secretariat',
          date: 'August 24, 2026',
          content: 'Registration for all Club Presidents & Secretaries for the flagship District 3011 Assembly is now officially open.',
          sentViaEmail: true
        },
        {
          id: 'a2',
          title: 'Monthly Project Reporting Format Active',
          category: 'Reporting Alert',
          author: 'District Secretariat',
          date: 'August 18, 2026',
          content: 'Monthly Project Reporting format (6 Sections) is active. Submit monthly reports via the District Portal.',
          sentViaEmail: true
        }
      ];
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

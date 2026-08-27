import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('YOUR_SUPABASE'));

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

export const INITIAL_STRUCTURED_REPORT = {
  id: 'report-demo-aug-2026',
  month: 'August 2026',
  clubName: 'Rotaract Club of Delhi Heights',
  clubEmail: 'techrid3011@gmail.com',
  submittedBy: 'Rtr. Officer (techrid3011@gmail.com)',
  submittedAt: '2026-08-24',
  status: 'reported',
  flagComment: null,
  sections: {
    clubMeetings: [
      {
        id: 'pm-1',
        eventName: '1st General Body & Planning Assembly',
        date: '2026-08-04',
        venue: 'Rotary Service Center, Delhi',
        areaOfFocus: 'Youth Service & Leadership',
        clubStrength: '34 Members',
        initiatedBy: 'Rotaract',
        collaboratingOrgs: 'Rotary Sponsor Club Delhi Heights',
        districtOfficials: 'ZRR Zone 2 & District Council Members',
        beneficiaryCount: 'N/A (Internal Assembly)',
        description: 'Held the first General Body Assembly of RY 2026-27 to finalize the annual project roadmap, budget allocations, and avenue chair appointments.',
        showcaseLink: 'https://showcase.rotary.org/project/gb-assembly',
        driveLink: 'https://drive.google.com/drive/folders/demo-assembly-photos'
      }
    ],
    clubServices: [
      {
        id: 'pm-2',
        eventName: 'Fellowship Night & Orientation',
        date: '2026-08-10',
        venue: 'Cultural Center Auditorium',
        areaOfFocus: 'Community Economic Development',
        clubStrength: '40 Members',
        initiatedBy: 'Rotaract',
        collaboratingOrgs: 'RAC Delhi Central',
        districtOfficials: 'District Fellowship Chair',
        beneficiaryCount: '50 Rotaractors',
        description: 'Conducted new member orientation session explaining Rotary International history, avenue roles, and district participation guidelines.',
        showcaseLink: '',
        driveLink: 'https://drive.google.com/drive/folders/demo-orientation-media'
      }
    ],
    communityServices: [
      {
        id: 'pm-3',
        eventName: 'Mahadan 9.0 Mega Blood Drive',
        date: '2026-08-15',
        venue: 'Connaught Place Central Park',
        areaOfFocus: 'Disease Prevention & Treatment',
        clubStrength: '28 Members',
        initiatedBy: 'Rotaract',
        collaboratingOrgs: 'Indian Red Cross Society',
        districtOfficials: 'District Governor & DRR',
        beneficiaryCount: '320 Donors',
        description: 'Organized flagship blood donation camp collecting 320 blood units for government hospital blood banks.',
        showcaseLink: 'https://showcase.rotary.org/project/mahadan-9',
        driveLink: 'https://drive.google.com/drive/folders/demo-mahadan-photos'
      }
    ],
    internationalServices: [
      {
        id: 'pm-4',
        eventName: 'Indo-Sri Lanka Twin Club Cultural Exchange',
        date: '2026-08-20',
        venue: 'Zoom Online Portal',
        areaOfFocus: 'Peacebuilding & Conflict Prevention',
        clubStrength: '22 Members',
        initiatedBy: 'Rotaract',
        collaboratingOrgs: 'RAC Colombo West (RID 3220)',
        districtOfficials: 'District International Service Director',
        beneficiaryCount: '65 Youth Participants',
        description: 'Conducted virtual twin club interaction exchanging culture, service best practices, and joint peace initiatives.',
        showcaseLink: '',
        driveLink: ''
      }
    ],
    vocationalServices: [],
    districtProjects: []
  }
};

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

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('rotary_id', cleanId)
          .single();

        if (error || !data) {
          return { success: false, error: `Rotary ID "${cleanId}" not found in District 3011 database.` };
        }

        if (data.password && data.password !== cleanPass) {
          return { success: false, error: 'Incorrect portal password.' };
        }

        return {
          success: true,
          user: {
            id: data.id,
            rotaryId: data.rotary_id,
            email: 'techrid3011@gmail.com',
            role: data.role || 'president',
            fullName: data.full_name || 'Rotaract Officer',
            totpSecret: data.totp_secret || null
          }
        };
      } catch (err) {
        console.warn('Supabase auth notice, checking fallback:', err);
      }
    }

    if (cleanPass === 'adminpassword' || cleanPass === 'rotarypassword' || cleanPass.length >= 4) {
      const isOfficer = cleanId.toLowerCase().includes('admin') || cleanId.toLowerCase().includes('officer');
      return {
        success: true,
        user: {
          id: `usr-${cleanId}`,
          rotaryId: cleanId,
          email: 'techrid3011@gmail.com',
          role: isOfficer ? 'officer' : 'president',
          fullName: `Officer ${cleanId}`
        }
      };
    }

    return { success: false, error: 'Invalid Rotary ID or password.' };
  },

  fetchSubmissions: async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        // Try fetching from dedicated monthly_reports table first
        const { data: reportData, error: reportErr } = await supabase
          .from('monthly_reports')
          .select('*')
          .order('submitted_at', { ascending: false });

        if (!reportErr && reportData && reportData.length > 0) {
          return reportData.map(parseSubFromDB);
        }

        // Fallback to project_submissions table
        const { data: subData, error: subErr } = await supabase
          .from('project_submissions')
          .select('*')
          .order('submitted_at', { ascending: false });

        if (!subErr && subData && subData.length > 0) {
          return subData.map(parseSubFromDB);
        }
      } catch (err) {
        console.warn('Supabase fetch notice, using fallback store:', err);
      }
    }
    return mockStore.getSubmissions();
  },

  insertSubmission: async (newReport) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const totalProjs = Object.values(newReport.sections || {}).reduce((sum, arr) => sum + (arr ? arr.length : 0), 0);
        
        // 1. Try inserting to dedicated monthly_reports table
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
          return await dbService.fetchSubmissions();
        }

        // 2. Fallback to project_submissions table
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
          return await dbService.fetchSubmissions();
        }
      } catch (err) {
        console.warn('Supabase insert notice, using fallback store:', err);
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
        return raw.map(parseSubFromDB);
      }
      return [INITIAL_STRUCTURED_REPORT];
    } catch {
      return [INITIAL_STRUCTURED_REPORT];
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

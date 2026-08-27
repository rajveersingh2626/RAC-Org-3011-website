import { INITIAL_CLUBS } from './districtData';

// Core Secretariat & Key Officer Roster
export const CORE_OFFICERS = [
  {
    rotaryId: '10915322',
    email: 'itsdrrarchit@gmail.com',
    role: 'officer',
    fullName: 'Rtn. Rtr. Archit Bhatia',
    clubName: 'District Rotaract Representative',
    post: 'District Rotaract Representative'
  },
  {
    rotaryId: '10915320',
    email: 'jasraj2626@gmail.com',
    role: 'officer',
    fullName: 'Rtr. Jasraj Singh',
    clubName: 'District Secretariat 3011',
    post: 'District Tech & Digital Systems Director'
  },
  {
    rotaryId: '10915321',
    email: 'sarthakmanchanda2@gmail.com',
    role: 'officer',
    fullName: 'Rtr. Sarthak Manchanda',
    clubName: 'District Secretariat 3011',
    post: 'District General Secretary'
  },
  {
    rotaryId: '10915323',
    email: 'rtrshefali2004@gmail.com',
    role: 'officer',
    fullName: 'Rtr. Shefali',
    clubName: 'District Secretariat 3011',
    post: 'District Joint Secretary'
  },
  {
    rotaryId: '10915324',
    email: 'himanshugulati.rotary@gmail.com',
    role: 'officer',
    fullName: 'Rtr. Himanshu Gulati',
    clubName: 'District Secretariat 3011',
    post: 'District Director - Administration'
  },
  {
    rotaryId: '3011-ADMIN',
    email: 'techrid3011@gmail.com',
    role: 'officer',
    fullName: 'District Secretariat Officer',
    clubName: 'District Secretariat 3011',
    post: 'District Secretariat Chair'
  }
];

export function findUserCredential(identifier) {
  if (!identifier) return null;
  const cleanId = identifier.trim().toLowerCase();

  // 1. Match Core Officer Roster
  const officerMatch = CORE_OFFICERS.find(o => 
    o.rotaryId.toLowerCase() === cleanId ||
    o.email.toLowerCase() === cleanId ||
    cleanId.includes('admin') ||
    cleanId.includes('officer')
  );
  if (officerMatch) {
    return {
      id: `usr-${officerMatch.rotaryId}`,
      ...officerMatch
    };
  }

  // 2. Match Club Roster from INITIAL_CLUBS
  const matchedClub = INITIAL_CLUBS.find(c => 
    (c.email && c.email.toLowerCase() === cleanId) ||
    (c.phone && c.phone.replace(/\s+/g, '') === cleanId.replace(/\s+/g, '')) ||
    (c.shortName && c.shortName.toLowerCase().replace(/\s+/g, '') === cleanId.replace(/\s+/g, '')) ||
    (c.id && c.id.toLowerCase() === cleanId) ||
    (c.president && c.president.toLowerCase().includes(cleanId)) ||
    cleanId.includes(c.id) ||
    (c.shortName && cleanId.includes(c.shortName.toLowerCase()))
  );

  if (matchedClub) {
    const isSec = cleanId.includes('secretary') || cleanId.includes('sec');
    return {
      id: `usr-${matchedClub.id}`,
      rotaryId: `3011-${(matchedClub.shortName || matchedClub.name).toUpperCase().replace(/[^A-Z0-9]/g, '')}`,
      email: matchedClub.email || `${(matchedClub.shortName || 'club').toLowerCase()}@rotaract3011.org`,
      role: 'president',
      fullName: isSec ? (matchedClub.secretary || 'Club Secretary') : matchedClub.president,
      clubName: matchedClub.name,
      post: isSec ? 'Club Secretary' : 'Club President'
    };
  }

  // 3. Fallback for valid Rotary IDs or Emails
  if (cleanId.length >= 3) {
    const isOfficer = cleanId.includes('drr') || cleanId.includes('officer') || cleanId.includes('admin') || cleanId.includes('sec');
    return {
      id: `usr-${cleanId}`,
      rotaryId: cleanId,
      email: cleanId.includes('@') ? cleanId : 'techrid3011@gmail.com',
      role: isOfficer ? 'officer' : 'president',
      fullName: isOfficer ? 'District Secretariat Officer' : 'Rotaract Club Officer',
      clubName: isOfficer ? 'District Secretariat 3011' : 'Rotaract Club 3011',
      post: isOfficer ? 'District Secretariat Member' : 'Club President / Secretary'
    };
  }

  return null;
}

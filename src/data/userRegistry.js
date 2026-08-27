import { INITIAL_CLUBS } from './districtData';

export const ADMIN_USERS = [
  {
    rotaryId: '3011-ADMIN',
    email: 'techrid3011@gmail.com',
    role: 'officer',
    fullName: 'District Secretariat Officer',
    clubName: 'District Secretariat 3011',
    post: 'District Secretariat Chair'
  },
  {
    rotaryId: '3011-DRR',
    email: 'drr@rotaract3011.org',
    role: 'officer',
    fullName: 'DRR Rtr. Ananya Sharma',
    clubName: 'Rotaract District 3011',
    post: 'District Rotaract Representative'
  }
];

export function findUserCredential(identifier) {
  if (!identifier) return null;
  const cleanId = identifier.trim().toLowerCase();

  // 1. Check Admin / Secretariat Roster
  const adminMatch = ADMIN_USERS.find(a => 
    a.rotaryId.toLowerCase() === cleanId ||
    a.email.toLowerCase() === cleanId ||
    cleanId.includes('admin') ||
    cleanId.includes('officer')
  );
  if (adminMatch) {
    return {
      id: `usr-${adminMatch.rotaryId}`,
      ...adminMatch
    };
  }

  // 2. Check Club Presidents Roster from districtData
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
    return {
      id: `usr-${matchedClub.id}`,
      rotaryId: `3011-${(matchedClub.shortName || matchedClub.name).toUpperCase().replace(/[^A-Z0-9]/g, '')}`,
      email: matchedClub.email || `${matchedClub.shortName.toLowerCase()}@rotaract3011.org`,
      role: 'president',
      fullName: matchedClub.president,
      clubName: matchedClub.name,
      post: 'Club President'
    };
  }

  return null;
}


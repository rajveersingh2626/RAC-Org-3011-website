import { makeCrud } from './crud';
import {
  achievementSchema,
  districtTeamMemberSchema,
  enquirySchema,
  partnerSchema,
  pastDrrSchema,
  publicationSchema,
  resourceSchema,
  sisterClubRequestSchema,
} from './types';

export const achievementsApi = makeCrud('/achievements', achievementSchema);
export const partnersApi = makeCrud('/partners', partnerSchema);
export const publicationsApi = makeCrud('/publications', publicationSchema);
export const resourcesApi = makeCrud('/resources', resourceSchema);
export const pastDrrsApi = makeCrud('/past-drrs', pastDrrSchema);
export const districtTeamApi = makeCrud('/district-team', districtTeamMemberSchema);
export const enquiriesApi = makeCrud('/enquiries', enquirySchema);
export const sisterClubRequestsApi = makeCrud('/sister-club-requests', sisterClubRequestSchema);

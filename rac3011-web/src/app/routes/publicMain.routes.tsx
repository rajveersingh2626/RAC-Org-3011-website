import type { RouteObject } from 'react-router';
import { ComingSoon } from '@/pages/ComingSoon';
import { RequireAuth } from './guards';
import { HomePage } from '@/pages/public/HomePage';
import { MapPage } from '@/pages/public/MapPage';
import { ShowcasePage } from '@/pages/public/ShowcasePage';
import { ShowcaseDetailPage } from '@/pages/public/ShowcaseDetailPage';
import { ClubShowcasePage } from '@/pages/public/ClubShowcasePage';
import { HeritagePage } from '@/pages/public/HeritagePage';
import { DrrProfilePage } from '@/pages/public/DrrProfilePage';
import { LeadershipPage } from '@/pages/public/LeadershipPage';
import { ClubLeadershipPage } from '@/pages/public/ClubLeadershipPage';
import { InitiativesPage } from '@/pages/public/InitiativesPage';
import { ResourcesPage } from '@/pages/public/ResourcesPage';
import { ResourceCategoryPage } from '@/pages/public/ResourceCategoryPage';
import { GuestKitPage } from '@/pages/public/GuestKitPage';
import { SisterClubFormPage } from '@/pages/public/SisterClubFormPage';
import { PublicationsPage } from '@/pages/public/PublicationsPage';
import { NewClubPage } from '@/pages/public/NewClubPage';
import { SponsorPage } from '@/pages/public/SponsorPage';
import { AchievementsPage } from '@/pages/public/AchievementsPage';
import { PartnersPage } from '@/pages/public/PartnersPage';
import { ContactPage } from '@/pages/public/ContactPage';
import { CalendarPage } from '@/pages/public/CalendarPage';
import { EventPage } from '@/pages/public/EventPage';
import { PrivacyPolicyPage } from '@/pages/public/PrivacyPolicyPage';
import { TermsOfServicePage } from '@/pages/public/TermsOfServicePage';

export const publicMainRouteObjects: RouteObject[] = [
  { index: true, element: <HomePage /> },
  { path: '/map', element: <MapPage /> },
  { path: '/showcase', element: <ShowcasePage /> },
  { path: '/showcase/:slug', element: <ShowcaseDetailPage /> },
  { path: '/showcase/clubs/:clubSlug', element: <ClubShowcasePage /> },
  { path: '/heritage', element: <HeritagePage /> },
  { path: '/heritage/:slug', element: <DrrProfilePage /> },
  { path: '/leadership', element: <LeadershipPage /> },
  { path: '/leadership/clubs/:slug', element: <ClubLeadershipPage /> },
  { path: '/initiatives', element: <InitiativesPage /> },
  { path: '/resources', element: <ResourcesPage /> },
  { path: '/resources/documents', element: <ResourceCategoryPage category="documents" /> },
  { path: '/resources/guest-kit', element: <GuestKitPage /> },
  { element: <RequireAuth />, children: [{ path: '/resources/sister-club', element: <SisterClubFormPage /> }] },
  { path: '/resources/:category', element: <ResourceCategoryPage /> },
  { path: '/publications', element: <PublicationsPage /> },
  { path: '/get-involved/new-club', element: <NewClubPage /> },
  { path: '/get-involved/sponsor', element: <SponsorPage /> },
  { path: '/achievements', element: <AchievementsPage /> },
  { path: '/partners', element: <PartnersPage /> },
  { path: '/contact', element: <ContactPage /> },
  { path: '/calendar', element: <CalendarPage /> },
  { path: '/calendar/:slug', element: <EventPage /> },
  { path: '/drr-calendar', element: <ComingSoon title="DRR calendar" /> },
  { path: '/drr-calendar/book/:slot', element: <ComingSoon title="Book DRR slot" /> },
  { path: '/drr-calendar/admin', element: <ComingSoon title="DRR calendar admin" description="Requires drr_calendar:manage in the real build." /> },
  { path: '/privacy-policy', element: <PrivacyPolicyPage /> },
  { path: '/terms-of-service', element: <TermsOfServicePage /> },
];

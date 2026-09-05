import { useNavigate, useParams } from 'react-router';
import { useAuth } from '@/app/auth';
import { useDocumentMeta } from '@/lib/meta';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { AchievementsAdmin } from './AchievementsAdmin';
import { DistrictTeamAdmin } from './DistrictTeamAdmin';
import { EnquiriesAdmin } from './EnquiriesAdmin';
import { PartnersAdmin } from './PartnersAdmin';
import { PastDrrsAdmin } from './PastDrrsAdmin';
import { PublicationsAdmin } from './PublicationsAdmin';
import { ResourcesAdmin } from './ResourcesAdmin';
import { SisterClubRequestsAdmin } from './SisterClubRequestsAdmin';

const TABS: TabItem[] = [
  { id: 'achievements', label: 'Achievements' },
  { id: 'partners', label: 'Partners' },
  { id: 'publications', label: 'Publications' },
  { id: 'resources', label: 'Resources' },
  { id: 'past-drrs', label: 'Past DRRs' },
  { id: 'district-team', label: 'District team' },
  { id: 'enquiries', label: 'Enquiries' },
  { id: 'sister-club-requests', label: 'Sister-club requests' },
];

export function PublicContentPage() {
  useDocumentMeta({ title: 'Public content' });
  const { can } = useAuth();
  const { kind = 'achievements' } = useParams<{ kind: string }>();
  const navigate = useNavigate();
  const canWrite = can('public_content:manage');

  return (
    <Container width="wide">
      <Section title="Public content" description="Simple CRUD tables for the public-facing content that lives outside pages: achievements, partners, publications, resources, past DRRs, district team, enquiries and sister-club requests.">
        <Tabs
          tabs={TABS}
          value={kind}
          onChange={(id) => navigate(`/portal/admin/public-content/${id}`)}
          label="Public content sections"
        />
        <div className="mt-5">
          {kind === 'achievements' && <AchievementsAdmin canWrite={canWrite} />}
          {kind === 'partners' && <PartnersAdmin canWrite={canWrite} />}
          {kind === 'publications' && <PublicationsAdmin canWrite={canWrite} />}
          {kind === 'resources' && <ResourcesAdmin canWrite={canWrite} />}
          {kind === 'past-drrs' && <PastDrrsAdmin canWrite={canWrite} />}
          {kind === 'district-team' && <DistrictTeamAdmin canWrite={canWrite} />}
          {kind === 'enquiries' && <EnquiriesAdmin canWrite={canWrite} />}
          {kind === 'sister-club-requests' && <SisterClubRequestsAdmin canWrite={canWrite} />}
        </div>
      </Section>
    </Container>
  );
}

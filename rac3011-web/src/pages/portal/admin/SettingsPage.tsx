import { useQuery } from '@tanstack/react-query';
import { fetchSettings } from '@/lib/settings/api';
import { useDocumentMeta } from '@/lib/meta';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { DrrCalendarSection, EnquiryRoutingSection, RclCareerbridgeSection, ReportingSection } from './SettingsSections';
import { SubdomainsSection } from './SubdomainsSection';
import { HomeAndSponsorSection } from './HomeAndSponsorSection';

export function SettingsPage() {
  useDocumentMeta({ title: 'District settings' });
  const query = useQuery({ queryKey: ['settings'], queryFn: fetchSettings });

  if (query.isPending) {
    return (
      <Container width="wide">
        <Skeleton shape="rect" className="h-96" />
      </Container>
    );
  }
  if (query.isError) {
    return (
      <Container width="wide">
        <ErrorState title="Couldn't load settings" onRetry={() => void query.refetch()} />
      </Container>
    );
  }

  const settings = query.data;

  return (
    <Container width="wide">
      <Section title="District settings" description="Every change here is audited and takes effect immediately.">
        <div className="flex flex-col gap-5">
          <SubdomainsSection settings={settings} />
          <ReportingSection settings={settings} />
          <DrrCalendarSection settings={settings} />
          <RclCareerbridgeSection settings={settings} />
          <HomeAndSponsorSection settings={settings} />
          <EnquiryRoutingSection settings={settings} />
        </div>
      </Section>
    </Container>
  );
}

import { useDocumentMeta } from '@/lib/meta';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { EmptyState } from '@/components/ui/EmptyState';

export interface ComingSoonProps {
  title: string;
  description?: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  useDocumentMeta({ title });
  return (
    <Container>
      <Section title={title}>
        <EmptyState title="Coming soon" body={description ?? `${title} is being built. Check back soon.`} />
      </Section>
    </Container>
  );
}

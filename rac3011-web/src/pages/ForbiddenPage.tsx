import { useDocumentMeta } from '@/lib/meta';
import { Container } from '@/components/ui/Container';
import { EmptyState } from '@/components/ui/EmptyState';

export function ForbiddenPage() {
  useDocumentMeta({ title: "You don't have access" });
  return (
    <Container className="py-16">
      <EmptyState title="You don't have access to this page" body="If you think this is wrong, contact your club president or the district office." />
    </Container>
  );
}

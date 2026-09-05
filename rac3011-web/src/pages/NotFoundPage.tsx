import { useDocumentMeta } from '@/lib/meta';
import { Container } from '@/components/ui/Container';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

export function NotFoundPage() {
  useDocumentMeta({ title: 'Page not found' });
  return (
    <Container className="py-16">
      <EmptyState
        title="Page not found"
        body="The page you're looking for doesn't exist or has moved."
        action={
          <Button variant="secondary" onClick={() => (window.location.href = '/')}>
            Back to home
          </Button>
        }
      />
    </Container>
  );
}

import { useDocumentMeta } from '@/lib/meta';
import { useContentQuery, richTextOf } from '@/lib/publicApi/content';
import { Container } from '@/components/ui/Container';
import { RichText } from '@/components/public/RichText';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';

export function TermsOfServicePage() {
  useDocumentMeta({ title: 'Terms of service' });
  const { data, isPending, isError, refetch } = useContentQuery('terms-of-service');
  const body = richTextOf(data, 'body');

  return (
    <Container className="py-10" width="narrow">
      <h1 className="m-0 mb-6 text-[27px] font-extrabold text-fg">Terms of service</h1>
      {isPending ? (
        <Skeleton lines={6} />
      ) : isError ? (
        <ErrorState title="Couldn't load this page" onRetry={() => void refetch()} />
      ) : body ? (
        <RichText html={body} />
      ) : (
        <EmptyState title="This page hasn't been published yet" />
      )}
    </Container>
  );
}

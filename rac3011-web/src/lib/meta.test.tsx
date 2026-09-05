import { render } from '@testing-library/react';
import { useDocumentMeta } from './meta';

function Page({ title, description }: { title: string; description?: string }) {
  useDocumentMeta({ title, description });
  return null;
}

describe('useDocumentMeta', () => {
  it('sets title with site suffix and description meta', () => {
    render(<Page title="Showcase" description="Projects" />);
    expect(document.title).toBe('Showcase · Rotaract District 3011');
    expect(document.head.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('Projects');
  });
  it('removes description when absent', () => {
    render(<Page title="Home" />);
    expect(document.head.querySelector('meta[name="description"]')).toBeNull();
  });
});

import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server, mswSetup } from '@/test/msw';
import { renderPage } from '@/test/render';
import { PendingPage } from './PendingPage';

mswSetup();

describe('PendingPage', () => {
  it('tells the visitor their account is awaiting approval', () => {
    server.use(http.get('/me', () => HttpResponse.json({ statusCode: 401, error: 'Unauthorized' }, { status: 401 })));
    renderPage(<PendingPage />);
    expect(screen.getByText('Almost there')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to sign in' })).toHaveAttribute('href', '/portal/login');
  });
});

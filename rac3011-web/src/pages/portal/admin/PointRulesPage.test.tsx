import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server, mswSetup } from '@/test/msw';
import { renderPage } from '@/test/render';
import { PointRulesPage } from './PointRulesPage';

mswSetup();

const ME = {
  user: { id: 'usr_1', name: 'Rtr. Super Admin', email: 'admin@example.org', twoFactorEnabled: false },
  profile: null,
  roles: [{ roleKey: 'super_admin', scope: { type: 'none' } }],
  grants: {},
  clubs: [],
  theme: 'light',
};

const CATEGORIES = [
  { id: 'cat_club', key: 'club_services', name: 'Club Services', order: 3 },
  { id: 'cat_intl', key: 'international_services', name: 'International Services', order: 2 },
];

const RULES = [
  {
    id: 'rule_meetings',
    categoryId: 'cat_club',
    categoryKey: 'club_services',
    key: 'club_physical_meetings',
    label: 'Physical club meetings',
    ruleType: 'per_unit',
    period: 'monthly',
    sourceType: 'report_field',
    sourceKey: 'physical_meetings',
    numeratorKey: null,
    denominatorKey: null,
    points: 20,
    perUnitCap: 4,
    isActive: true,
    ryYear: 2026,
    tiers: [],
  },
];

function installHandlers() {
  server.use(
    http.get('/me', () => HttpResponse.json(ME)),
    http.get('/point-categories', () => HttpResponse.json(CATEGORIES)),
    http.get('/point-rules', () => HttpResponse.json({ items: RULES })),
    http.patch('/point-rules/:id', () => HttpResponse.json({ ...RULES[0], points: 25 })),
  );
}

describe('PointRulesPage', () => {
  it('groups rules by category and shows their type/period badges', async () => {
    installHandlers();
    renderPage(<PointRulesPage />);

    expect(await screen.findByText('Physical club meetings')).toBeInTheDocument();
    expect(screen.getByText('Club Services')).toBeInTheDocument();
    expect(screen.getByText('PER_UNIT')).toBeInTheDocument();
    expect(screen.getByText('MONTHLY')).toBeInTheDocument();
  });

  it('edits a rule through the modal and PATCHes it', async () => {
    installHandlers();
    renderPage(<PointRulesPage />);
    await screen.findByText('Physical club meetings');

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByText('Edit Physical club meetings')).toBeInTheDocument();

    const points = screen.getByLabelText('Points');
    await user.clear(points);
    await user.type(points, '25');
    await user.click(screen.getByRole('button', { name: 'Save rule' }));

    await waitFor(() => expect(screen.queryByText('Edit Physical club meetings')).not.toBeInTheDocument());
  });

  it('opens the "New rule" modal for creating a rule', async () => {
    installHandlers();
    renderPage(<PointRulesPage />);
    await screen.findByText('Physical club meetings');

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'New rule' }));
    expect(screen.getByText('New point rule')).toBeInTheDocument();
  });
});

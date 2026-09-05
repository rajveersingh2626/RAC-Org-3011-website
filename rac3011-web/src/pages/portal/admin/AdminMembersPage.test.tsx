import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server, mswSetup } from '@/test/msw';
import { renderPage } from '@/test/render';
import { AdminMembersPage } from './AdminMembersPage';

mswSetup();

const ME = {
  user: { id: 'usr_president', name: 'Rtr. President', email: 'president@example.org', twoFactorEnabled: false },
  profile: { id: 'mp_1', clubId: 'club_dse', status: 'approved' },
  roles: [{ roleKey: 'president', scope: { type: 'club', id: 'club_dse' } }],
  grants: { 'members:approve': [{ type: 'club', id: 'club_dse' }] },
  clubs: [{ id: 'club_dse', name: 'Rotaract Club of Delhi South East', shortName: 'DSE', zoneId: 'zone_agni' }],
  theme: 'light',
};

let membersStore: Array<Record<string, unknown>>;

function resetStore() {
  membersStore = [
    {
      id: 'mp_pending',
      userId: 'usr_pending',
      fullName: 'Ishita Rao',
      email: 'ishita@example.com',
      phone: null,
      rotaryId: null,
      clubId: 'club_dse',
      club: { id: 'club_dse', name: 'Rotaract Club of Delhi South East', shortName: 'DSE' },
      photoUrl: null,
      bio: null,
      skills: [],
      interests: [],
      membershipAnniversary: null,
      status: 'pending',
      approvedById: null,
      approvedAt: null,
      rejectionReason: null,
      directoryOptIn: false,
      isDacMember: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'mp_approved',
      userId: 'usr_approved',
      fullName: 'Kartik Kumar',
      email: 'kartik@example.com',
      phone: null,
      rotaryId: null,
      clubId: 'club_dse',
      club: { id: 'club_dse', name: 'Rotaract Club of Delhi South East', shortName: 'DSE' },
      photoUrl: null,
      bio: null,
      skills: ['data'],
      interests: [],
      membershipAnniversary: null,
      status: 'approved',
      approvedById: 'usr_president',
      approvedAt: new Date().toISOString(),
      rejectionReason: null,
      directoryOptIn: true,
      isDacMember: false,
      createdAt: new Date().toISOString(),
    },
  ];
}

function installHandlers() {
  resetStore();
  server.use(
    http.get('/me', () => HttpResponse.json(ME)),
    http.get('/members', () => HttpResponse.json({ items: membersStore, total: membersStore.length, page: 1, pageSize: 200 })),
    http.patch('/members/:id', async ({ params, request }) => {
      const body = (await request.json()) as { status: string; rejectionReason?: string | null };
      const idx = membersStore.findIndex((m) => m.id === params.id);
      membersStore[idx] = { ...membersStore[idx], status: body.status, rejectionReason: body.rejectionReason ?? null };
      return HttpResponse.json(membersStore[idx]);
    }),
  );
}

describe('AdminMembersPage', () => {
  it('approves a pending member from the waiting-for-approval list', async () => {
    installHandlers();
    renderPage(<AdminMembersPage />);

    expect(await screen.findByText('Ishita Rao')).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Approve' }));

    await waitFor(() => expect(screen.queryByText('WAITING FOR APPROVAL · 1', { exact: false })).not.toBeInTheDocument());
  });

  it('declines a pending member with a reason via "Not ours"', async () => {
    installHandlers();
    renderPage(<AdminMembersPage />);

    await screen.findByText('Ishita Rao');
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Not ours' }));

    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByRole('textbox'), 'Wrong club');
    await user.click(within(dialog).getByRole('button', { name: 'Decline this account' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('shows the roster with existing members and lets an officer suspend one', async () => {
    installHandlers();
    renderPage(<AdminMembersPage />);

    expect(await screen.findByText('Kartik Kumar')).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Suspend' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Reinstate' })).toBeInTheDocument());
  });
});

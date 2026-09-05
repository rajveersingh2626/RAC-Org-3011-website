import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import express, { type Request, type Response, type NextFunction } from 'express';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string): unknown => JSON.parse(readFileSync(join(here, 'fixtures', name), 'utf8')) as unknown;

const PORT = Number(process.env.MOCK_API_PORT ?? 3001);
const SESSION_COOKIE = 'e2e_session';

const app = express();
app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  if (typeof origin === 'string') res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

function hasSession(req: Request): boolean {
  return (req.headers.cookie ?? '').includes(`${SESSION_COOKIE}=1`);
}

app.get('/health', (_req, res) => void res.json({ ok: true }));

app.get('/me', (req, res) => {
  if (!hasSession(req)) {
    res.status(401).json({ statusCode: 401, error: 'Unauthorized' });
    return;
  }
  res.json(fixture('me.json'));
});

app.patch('/me', (_req, res) => void res.json(fixture('me.json')));

app.post('/auth/sign-in/email', (req, res) => {
  const body = req.body as { email?: string; password?: string };
  if (!body.email || !body.password) {
    res.status(400).json({ statusCode: 400, error: 'ValidationError', details: [{ path: 'email', message: 'Enter the email you registered with' }] });
    return;
  }
  if (body.password === 'wrong') {
    res.status(401).json({ statusCode: 401, message: 'That email and password do not match an account' });
    return;
  }
  // An authenticator-app account gets better-auth's own twoFactorRedirect shape (no user/token);
  // everyone else gets the normal shape and always goes through email OTP next.
  if (body.email === 'totp-user@example.com') {
    res.json({ twoFactorRedirect: true, twoFactorMethods: ['totp'] });
    return;
  }
  res.json({ redirect: false, token: 'mock-token', user: { email: body.email, twoFactorEnabled: false } });
});

app.post('/second-factor/verify', (req, res) => {
  const body = req.body as { code?: string };
  if (body.code !== '417293') {
    res.status(401).json({ statusCode: 401, message: 'That code is not right. Check the latest email and try again.' });
    return;
  }
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=1; Path=/; SameSite=Lax`);
  res.json({ status: 'verified' });
});

app.post('/second-factor/resend', (_req, res) => void res.json({ status: 'sent' }));

app.post('/auth/two-factor/verify-totp', (req, res) => {
  const body = req.body as { code?: string };
  if (body.code !== '654321') {
    res.status(401).json({ statusCode: 401, message: 'That code is not right. Check your authenticator app and try again.' });
    return;
  }
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=1; Path=/; SameSite=Lax`);
  res.json({ token: 'mock-totp-token', user: { email: 'totp-user@example.com', twoFactorEnabled: true } });
});
app.post('/auth/sign-out', (_req, res) => {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; Max-Age=0`);
  res.json({ ok: true });
});

app.get('/public/home', (_req, res) => void res.json(fixture('home.json')));
app.get('/public/live', (_req, res) => void res.json({ year: 2026, count: 12480 }));
app.post('/public/visits', (_req, res) => void res.json({ year: 2026, count: 12481 }));

app.get('/public/clubs', (_req, res) => void res.json(fixture('clubs.json')));
app.get('/public/clubs/:slug', (_req, res) => void res.json(fixture('club-detail.json')));

app.get('/public/projects', (_req, res) => void res.json(fixture('projects.json')));
app.get('/public/projects/:slug', (_req, res) => void res.json(fixture('project-detail.json')));

app.get('/public/past-drrs', (_req, res) => void res.json(fixture('past-drrs.json')));
app.get('/public/past-drrs/:slug', (_req, res) => void res.json(fixture('past-drr-detail.json')));

app.get('/public/district-team', (_req, res) => void res.json(fixture('district-team.json')));
app.get('/public/achievements', (_req, res) => void res.json(fixture('achievements.json')));
app.get('/public/partners', (_req, res) => void res.json(fixture('partners.json')));
app.get('/public/publications', (_req, res) => void res.json(fixture('publications.json')));
app.get('/public/resources', (_req, res) => void res.json(fixture('resources.json')));

app.get('/public/content/:pageKey', (req, res) => {
  const blocks = (fixture('public-content.json') as Record<string, unknown>)[req.params.pageKey] ?? {};
  res.json(blocks);
});

app.get('/public/initiatives', (_req, res) => void res.json(fixture('initiatives.json')));

app.get('/public/events', (_req, res) => void res.json(fixture('events.json')));
app.get('/public/events/:slug', (_req, res) => void res.json(fixture('event-detail.json')));
app.get('/public/calendar.ics', (_req, res) => void res.type('text/calendar').send('BEGIN:VCALENDAR\nEND:VCALENDAR'));

app.post('/public/enquiries', (_req, res) => void res.json({ received: true, routedTo: 'District Secretariat' }));

app.post('/files/grants', (_req, res) => void res.status(201).json({ grantId: 'grant_e2e', uploadUrl: `http://localhost:${PORT}/mock-provider` }));
app.patch('/files/grants/:grantId', (req, res) =>
  void res.json({ id: 'file_e2e', tier: 'dynamic', key: (req.body as { providerKey?: string }).providerKey ?? 'k', url: null, name: 'photo.jpg', mimeType: 'image/jpeg', size: 1024 }),
);
app.put('/mock-provider', (_req, res) => void res.sendStatus(204));

app.get('/zones', (_req, res) => void res.json(fixture('zones.json')));

const CLUB_DSE = { id: 'club_dse', name: 'Rotaract Club of Delhi South East', shortName: 'Delhi South East', zoneId: 'zone_agni', slug: 'delhi-south-east' };

let reportsStore = fixture('reports.json') as Array<Record<string, unknown>>;
let schemaStore = [fixture('report-schema.json') as Record<string, unknown>];
let requestStore = fixture('report-requests.json') as Array<Record<string, unknown>>;

app.get('/reports', (req, res) => {
  const clubId = req.query['filter[clubId]'] as string | undefined;
  const status = req.query['filter[status]'] as string | undefined;
  const include = String(req.query.include ?? '');
  let items = reportsStore;
  if (clubId) items = items.filter((r) => r.clubId === clubId);
  if (status) items = items.filter((r) => r.status === status);
  const mapped = items.map((r) => ({
    ...r,
    ...(include.includes('club') ? { club: CLUB_DSE } : {}),
    ...(include.includes('queries') ? { queries: r.queries ?? [] } : {}),
  }));
  res.json({ items: mapped, total: mapped.length, page: 1, pageSize: mapped.length || 1 });
});

app.get('/reports/:id', (req, res) => {
  const r = reportsStore.find((x) => x.id === req.params.id);
  if (!r) {
    res.status(404).json({ statusCode: 404, error: 'NotFound' });
    return;
  }
  const include = String(req.query.include ?? '');
  res.json({ ...r, ...(include.includes('club') ? { club: CLUB_DSE } : {}), ...(include.includes('queries') ? { queries: r.queries ?? [] } : {}) });
});

app.post('/reports', (req, res) => {
  const body = req.body as { clubId: string; month: string };
  const created = {
    id: `rep_${reportsStore.length + 1}`,
    clubId: body.clubId,
    ryYear: 2026,
    month: `${body.month}-01`,
    schemaVersion: 4,
    status: 'draft',
    values: { activities: [] },
    notes: null,
    submittedById: null,
    submittedAt: null,
    filedOnTime: null,
    scoredAt: null,
  };
  reportsStore = [...reportsStore, created];
  res.status(201).json(created);
});

app.patch('/reports/:id', (req, res) => {
  const idx = reportsStore.findIndex((x) => x.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ statusCode: 404, error: 'NotFound' });
    return;
  }
  const body = req.body as { values?: unknown; notes?: string | null; status?: string };
  const updated = {
    ...reportsStore[idx],
    ...(body.values !== undefined ? { values: { ...(reportsStore[idx].values as object), ...(body.values as object) } } : {}),
    ...(body.notes !== undefined ? { notes: body.notes } : {}),
    ...(body.status === 'submitted' ? { status: 'submitted', submittedAt: new Date().toISOString(), submittedById: 'usr_e2e', filedOnTime: true } : {}),
  };
  reportsStore[idx] = updated;
  res.json(updated);
});

app.get('/reports/:id/assist', (_req, res) => void res.json({ summary: '', suggestions: [] }));

app.post('/reports/:id/queries', (req, res) => {
  const idx = reportsStore.findIndex((x) => x.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ statusCode: 404, error: 'NotFound' });
    return;
  }
  const question = (req.body as { question: string }).question;
  const queries = [...((reportsStore[idx].queries as unknown[]) ?? []), { id: `q${Date.now()}`, reportId: req.params.id, askedById: 'usr_officer', question, reply: null, repliedById: null, repliedAt: null, createdAt: new Date().toISOString() }];
  reportsStore[idx] = { ...reportsStore[idx], status: 'queried', queries };
  res.json({ ...reportsStore[idx], queries });
});

app.patch('/reports/:id/queries/:queryId', (req, res) => {
  const idx = reportsStore.findIndex((x) => x.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ statusCode: 404, error: 'NotFound' });
    return;
  }
  const reply = (req.body as { reply: string }).reply;
  const queries = ((reportsStore[idx].queries as Array<Record<string, unknown>>) ?? []).map((q) =>
    q.id === req.params.queryId ? { ...q, reply, repliedById: 'usr_e2e', repliedAt: new Date().toISOString() } : q,
  );
  reportsStore[idx] = { ...reportsStore[idx], status: 'submitted', queries };
  res.json({ ...reportsStore[idx], queries });
});

app.get('/report-schemas', (req, res) => {
  const includeFields = String(req.query.include ?? '').includes('fields');
  const version = req.query['filter[version]'] as string | undefined;
  let items = schemaStore;
  if (version) items = items.filter((s) => String(s.version) === version);
  res.json({ items: items.map((s) => (includeFields ? s : { id: s.id, version: s.version, status: s.status, publishedAt: s.publishedAt })) });
});

app.post('/report-schemas', (_req, res) => {
  const active = schemaStore.find((s) => s.status === 'active') ?? schemaStore[0];
  const nextVersion = Math.max(...schemaStore.map((s) => s.version as number)) + 1;
  const draft = { ...active, id: `sc${nextVersion}`, version: nextVersion, status: 'draft', publishedAt: null };
  schemaStore = [...schemaStore, draft];
  res.status(201).json(draft);
});

app.patch('/report-schemas/:version', (req, res) => {
  const idx = schemaStore.findIndex((s) => s.version === Number(req.params.version));
  if (idx === -1) {
    res.status(404).json({ statusCode: 404, error: 'NotFound' });
    return;
  }
  const body = req.body as { fields?: unknown[]; status?: string };
  if (body.fields) schemaStore[idx] = { ...schemaStore[idx], fields: body.fields };
  if (body.status === 'active') {
    schemaStore = schemaStore.map((s) => (s.status === 'active' ? { ...s, status: 'retired' } : s));
    schemaStore[idx] = { ...schemaStore[idx], status: 'active', publishedAt: new Date().toISOString() };
  }
  res.json(schemaStore[idx]);
});

app.get('/report-requests', (_req, res) => void res.json({ items: requestStore }));

app.get('/report-requests/:id', (req, res) => {
  const r = requestStore.find((x) => x.id === req.params.id);
  if (!r) {
    res.status(404).json({ statusCode: 404, error: 'NotFound' });
    return;
  }
  res.json(r);
});

app.post('/report-requests', (req, res) => {
  const created = { id: `req_${requestStore.length + 1}`, createdById: 'usr_e2e', ...(req.body as object) };
  requestStore = [...requestStore, created];
  res.status(201).json(created);
});

app.patch('/report-requests/:id', (req, res) => {
  const idx = requestStore.findIndex((x) => x.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ statusCode: 404, error: 'NotFound' });
    return;
  }
  requestStore[idx] = { ...requestStore[idx], ...(req.body as object) };
  res.json(requestStore[idx]);
});

app.delete('/report-requests/:id', (req, res) => {
  requestStore = requestStore.filter((x) => x.id !== req.params.id);
  res.json({ ok: true });
});

app.put('/report-requests/:id/responses/:clubId', (req, res) =>
  void res.json({ id: 'resp_e2e', requestId: req.params.id, clubId: req.params.clubId, answers: (req.body as { answers: unknown }).answers, submittedById: 'usr_e2e' }),
);

let projectsStore = fixture('my-projects.json') as Array<Record<string, unknown>>;

app.get('/projects', (req, res) => {
  const status = req.query['filter[status]'] as string | undefined;
  let items = projectsStore;
  if (status) items = items.filter((p) => p.status === status);
  res.json({ items, total: items.length, page: 1, pageSize: items.length || 1 });
});

app.get('/projects/:id', (req, res) => {
  const p = projectsStore.find((x) => x.id === req.params.id);
  if (!p) {
    res.status(404).json({ statusCode: 404, error: 'NotFound' });
    return;
  }
  res.json(p);
});

app.post('/projects', (req, res) => {
  const body = req.body as Record<string, unknown>;
  const created = {
    id: `proj_${projectsStore.length + 1}`,
    slug: null,
    title: body.title,
    category: body.category,
    date: body.date,
    summary: body.summary,
    body: body.body ?? null,
    beneficiaries: body.beneficiaries ?? null,
    photos: body.photos ?? [],
    submittedById: 'usr_e2e',
    status: 'draft',
    consentConfirmed: body.consentConfirmed ?? false,
    submittedAt: null,
    publishedTitle: null,
    publishedSummary: null,
    publishedBody: null,
    editorNotes: null,
    rejectionReason: null,
    publishedAt: null,
    publishedById: null,
    clubs: [
      { role: 'lead', club: CLUB_DSE },
      ...((body.collaboratingClubIds as string[] | undefined) ?? []).map((id) => ({ role: 'collaborator', club: { id, name: id, shortName: null, zoneId: null } })),
    ],
  };
  projectsStore = [...projectsStore, created];
  res.status(201).json(created);
});

app.patch('/projects/:id', (req, res) => {
  const idx = projectsStore.findIndex((x) => x.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ statusCode: 404, error: 'NotFound' });
    return;
  }
  const body = req.body as Record<string, unknown>;
  const submitting = body.status === 'submitted';
  projectsStore[idx] = {
    ...projectsStore[idx],
    ...body,
    ...(submitting ? { submittedAt: new Date().toISOString() } : {}),
  };
  res.json(projectsStore[idx]);
});

app.delete('/projects/:id', (req, res) => {
  projectsStore = projectsStore.filter((x) => x.id !== req.params.id);
  res.status(204).send();
});

let membersStore = fixture('members.json') as Array<Record<string, unknown>>;

app.post('/members/register', (req, res) => {
  const body = req.body as { email: string };
  if (membersStore.some((m) => m.email === body.email)) {
    res.status(409).json({ statusCode: 409, error: 'Conflict', code: 'ALREADY_EXISTS', message: 'An account already exists for this email' });
    return;
  }
  res.status(201).json({ id: `mp_${membersStore.length + 1}`, status: 'pending' });
});

app.get('/members', (req, res) => {
  const clubId = req.query['filter[clubId]'] as string | undefined;
  const status = req.query['filter[status]'] as string | undefined;
  let items = membersStore;
  if (clubId) items = items.filter((m) => m.clubId === clubId);
  if (status) items = items.filter((m) => m.status === status);
  res.json({ items, total: items.length, page: 1, pageSize: items.length || 1 });
});

app.get('/members/:id', (req, res) => {
  const m = membersStore.find((x) => x.id === req.params.id);
  if (!m) {
    res.status(404).json({ statusCode: 404, error: 'NotFound' });
    return;
  }
  res.json(m);
});

app.patch('/members/:id', (req, res) => {
  const idx = membersStore.findIndex((x) => x.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ statusCode: 404, error: 'NotFound' });
    return;
  }
  const body = req.body as { status: string; rejectionReason?: string | null };
  membersStore[idx] = {
    ...membersStore[idx],
    status: body.status,
    rejectionReason: body.rejectionReason ?? null,
    approvedAt: body.status === 'approved' ? new Date().toISOString() : membersStore[idx].approvedAt,
  };
  res.json(membersStore[idx]);
});

app.post('/members/imports', (req, res) => {
  const body = req.body as { clubId: string; csv: string };
  const lines = body.csv.trim().split('\n').slice(1).filter(Boolean);
  const rows = lines.map((line, i) => {
    const [fullName, email, phone, rotaryId] = line.split(',').map((c) => c.trim());
    const existing = membersStore.some((m) => m.email === email);
    return { lineNumber: i + 2, fullName, email, phone: phone || null, rotaryId: rotaryId || null, outcome: existing ? 'duplicate' : 'new', errors: [] as string[] };
  });
  res.status(201).json({
    id: 'imp_1',
    clubId: body.clubId,
    rows,
    summary: {
      total: rows.length,
      new: rows.filter((r) => r.outcome === 'new').length,
      duplicate: rows.filter((r) => r.outcome === 'duplicate').length,
      invalid: 0,
    },
  });
});

app.patch('/members/imports/:id', (req, res) => {
  const body = req.body as { clubId: string; rows: { fullName: string; email: string }[] };
  const created = body.rows.map((r, i) => {
    const id = `mp_import_${membersStore.length + i + 1}`;
    membersStore = [
      ...membersStore,
      {
        id,
        userId: `usr_import_${i}`,
        fullName: r.fullName,
        email: r.email,
        phone: null,
        rotaryId: null,
        clubId: body.clubId,
        club: { id: body.clubId, name: 'Rotaract Club of Delhi South East', shortName: 'DSE' },
        photoUrl: null,
        bio: null,
        skills: [],
        interests: [],
        membershipAnniversary: null,
        status: 'approved',
        approvedById: 'usr_e2e',
        approvedAt: new Date().toISOString(),
        rejectionReason: null,
        directoryOptIn: false,
        isDacMember: false,
        createdAt: new Date().toISOString(),
      },
    ];
    return id;
  });
  res.json({ id: req.params.id, clubId: body.clubId, committed: created.length, skipped: 0, memberIds: created });
});

let privacyAccepted = false;
app.get('/directory', (_req, res) => {
  if (!privacyAccepted) {
    res.status(409).json({ statusCode: 409, error: 'Conflict', code: 'PRIVACY_NOT_ACCEPTED', message: 'Accept the privacy policy first' });
    return;
  }
  const items = fixture('directory.json') as unknown[];
  res.json({ items, total: items.length, page: 1, pageSize: items.length });
});

app.post('/me/privacy-acceptances', (_req, res) => {
  privacyAccepted = true;
  res.json({ accepted: true });
});

app.get('/skill-tags', (_req, res) => void res.json(fixture('skill-tags.json')));
app.get('/me/club', (_req, res) => void res.json(fixture('me-club.json')));
app.get('/me/card', (_req, res) => void res.json(fixture('me-card.json')));
app.get('/me/qr.svg', (_req, res) => void res.type('image/svg+xml').send('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>'));

app.get('/auth/trusted-devices', (_req, res) =>
  void res.json([{ id: 'td_1', userAgent: 'Chrome on Android', createdAt: '2026-01-01T00:00:00Z', expiresAt: '2026-01-01T05:00:00Z' }]),
);
app.delete('/auth/trusted-devices/:id', (_req, res) => void res.json({ ok: true }));
app.post('/auth/two-factor/enable', (_req, res) =>
  void res.json({ method: 'totp', totpURI: 'otpauth://totp/Rotaract:e2e@example.org?secret=ABC', backupCodes: ['aaa111', 'bbb222'] }),
);
app.post('/auth/two-factor/verify-totp', (_req, res) => void res.json({ ok: true }));
app.post('/auth/two-factor/disable', (_req, res) => void res.json({ ok: true }));

app.get('/public/mission3011/dashboard', (_req, res) => void res.json(fixture('mission3011-dashboard.json')));
app.get('/public/drishti/dashboard', (_req, res) => void res.json(fixture('drishti-dashboard.json')));

let m3011CampsStore = fixture('mission3011-camps.json') as Array<Record<string, unknown>>;

app.get('/mission3011/camps', (req, res) => {
  const status = req.query['filter[status]'] as string | undefined;
  let items = m3011CampsStore;
  if (status) items = items.filter((c) => c.status === status);
  res.json({ items, total: items.length, page: 1, pageSize: items.length || 1 });
});

app.get('/mission3011/camps/:id', (req, res) => {
  const c = m3011CampsStore.find((x) => x.id === req.params.id);
  if (!c) {
    res.status(404).json({ statusCode: 404, error: 'NotFound' });
    return;
  }
  res.json(c);
});

app.post('/mission3011/camps', (req, res) => {
  const body = req.body as Record<string, unknown>;
  const created = {
    id: `camp_${m3011CampsStore.length + 1}`,
    leadClub: CLUB_DSE,
    date: body.date,
    venue: body.venue,
    city: body.city ?? null,
    unitsCollected: body.unitsCollected,
    donorsRegistered: body.donorsRegistered ?? null,
    partnerBloodBank: body.partnerBloodBank ?? null,
    photos: body.photos ?? [],
    status: 'submitted',
    submittedById: 'usr_e2e',
    reviewedById: null,
    reviewedAt: null,
    rejectionReason: null,
    participatingClubs: [],
    createdAt: new Date().toISOString(),
  };
  m3011CampsStore = [...m3011CampsStore, created];
  res.status(201).json(created);
});

app.patch('/mission3011/camps/:id', (req, res) => {
  const idx = m3011CampsStore.findIndex((x) => x.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ statusCode: 404, error: 'NotFound' });
    return;
  }
  const body = req.body as Record<string, unknown>;
  const isReview = body.status === 'approved' || body.status === 'rejected';
  m3011CampsStore[idx] = {
    ...m3011CampsStore[idx],
    ...body,
    ...(isReview ? { reviewedById: 'usr_e2e', reviewedAt: new Date().toISOString() } : {}),
  };
  res.json(m3011CampsStore[idx]);
});

let drishtiBeneficiariesStore = fixture('drishti-beneficiaries.json') as Array<Record<string, unknown>>;

app.get('/drishti/beneficiaries', (req, res) => {
  const stage = req.query['filter[stage]'] as string | undefined;
  let items = drishtiBeneficiariesStore;
  if (stage) items = items.filter((b) => b.stage === stage);
  res.json({ items, total: items.length, page: 1, pageSize: items.length || 1 });
});

app.get('/drishti/beneficiaries/:id', (req, res) => {
  const b = drishtiBeneficiariesStore.find((x) => x.id === req.params.id);
  if (!b) {
    res.status(404).json({ statusCode: 404, error: 'NotFound' });
    return;
  }
  res.json(b);
});

app.post('/drishti/beneficiaries', (req, res) => {
  const body = req.body as Record<string, unknown>;
  const created = {
    id: `ben_${drishtiBeneficiariesStore.length + 1}`,
    club: (body.clubId as string | undefined) ? { id: body.clubId, name: 'Rotaract Club of Saket', shortName: 'Saket' } : CLUB_DSE,
    name: body.name,
    age: body.age ?? null,
    gender: body.gender ?? null,
    phone: body.phone ?? null,
    eye: body.eye,
    screenedOn: body.screenedOn,
    campLocation: body.campLocation ?? null,
    stage: 'screened',
    notes: body.notes ?? null,
    surgeries: [],
    createdAt: new Date().toISOString(),
  };
  drishtiBeneficiariesStore = [...drishtiBeneficiariesStore, created];
  res.status(201).json(created);
});

app.patch('/drishti/beneficiaries/:id', (req, res) => {
  const idx = drishtiBeneficiariesStore.findIndex((x) => x.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ statusCode: 404, error: 'NotFound' });
    return;
  }
  const body = req.body as {
    stage?: string;
    notes?: string | null;
    surgery?: { hospital: string; operatedOn: string; outcome?: string | null; followupOn?: string | null };
  };
  const existing = drishtiBeneficiariesStore[idx];
  const surgeries = body.surgery
    ? [
        ...(existing.surgeries as unknown[]),
        {
          id: `sur_${Date.now()}`,
          hospital: body.surgery.hospital,
          operatedOn: body.surgery.operatedOn,
          outcome: body.surgery.outcome ?? null,
          followupOn: body.surgery.followupOn ?? null,
        },
      ]
    : existing.surgeries;
  drishtiBeneficiariesStore[idx] = {
    ...existing,
    ...(body.stage ? { stage: body.stage } : {}),
    ...(body.notes !== undefined ? { notes: body.notes } : {}),
    surgeries,
  };
  res.json(drishtiBeneficiariesStore[idx]);
});

const RCL_CLUBS: Record<string, { id: string; name: string; shortName: string }> = {
  club_dse: { id: 'club_dse', name: 'Rotaract Club of Delhi South East', shortName: 'Delhi South East' },
  club_agni: { id: 'club_agni', name: 'Rotaract Club of Agni Zone Central', shortName: 'Agni Central' },
  club_saket: { id: 'club_saket', name: 'Rotaract Club of Saket', shortName: 'Saket' },
};

let rclTeamsStore = fixture('rcl-teams.json') as Array<Record<string, unknown>>;
let rclFixturesStore = fixture('rcl-fixtures.json') as Array<Record<string, unknown>>;

app.get('/rcl/teams', (req, res) => {
  const clubId = req.query['filter[clubId]'] as string | undefined;
  const season = req.query['filter[season]'] as string | undefined;
  const status = req.query['filter[status]'] as string | undefined;
  let items = rclTeamsStore;
  if (clubId) items = items.filter((t) => t.clubId === clubId);
  if (season) items = items.filter((t) => String(t.season) === season);
  if (status) items = items.filter((t) => t.status === status);
  res.json({ items, total: items.length, page: 1, pageSize: items.length || 1 });
});

app.get('/rcl/teams/:id', (req, res) => {
  const t = rclTeamsStore.find((x) => x.id === req.params.id);
  if (!t) {
    res.status(404).json({ statusCode: 404, error: 'NotFound' });
    return;
  }
  res.json(t);
});

app.post('/rcl/teams', (req, res) => {
  const body = req.body as Record<string, unknown>;
  const clubId = body.clubId as string;
  const players = (body.players as Array<{ memberId?: string | null; name: string; role?: string | null }>) ?? [];
  if (players.length > 15) {
    res.status(400).json({ statusCode: 400, error: 'ValidationError', message: 'A roster can have at most 15 players' });
    return;
  }
  const id = `team_${rclTeamsStore.length + 1}`;
  const now = new Date().toISOString();
  const created = {
    id,
    season: body.season,
    clubId,
    club: RCL_CLUBS[clubId] ?? { id: clubId, name: clubId, shortName: clubId },
    name: body.name,
    captainName: body.captainName,
    captainPhone: body.captainPhone,
    status: 'registered',
    players: players.map((p, i) => ({ id: `${id}_ply_${i}`, teamId: id, memberId: p.memberId ?? null, name: p.name, role: p.role ?? null })),
    createdById: 'usr_e2e',
    createdAt: now,
    updatedAt: now,
  };
  rclTeamsStore = [...rclTeamsStore, created];
  res.status(201).json(created);
});

app.patch('/rcl/teams/:id', (req, res) => {
  const idx = rclTeamsStore.findIndex((x) => x.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ statusCode: 404, error: 'NotFound' });
    return;
  }
  const body = req.body as Record<string, unknown>;
  const players = body.players as Array<{ memberId?: string | null; name: string; role?: string | null }> | undefined;
  if (players && players.length > 15) {
    res.status(400).json({ statusCode: 400, error: 'ValidationError', message: 'A roster can have at most 15 players' });
    return;
  }
  const id = req.params.id;
  rclTeamsStore[idx] = {
    ...rclTeamsStore[idx],
    ...body,
    ...(players ? { players: players.map((p, i) => ({ id: `${id}_ply_${i}`, teamId: id, memberId: p.memberId ?? null, name: p.name, role: p.role ?? null })) } : {}),
    updatedAt: new Date().toISOString(),
  };
  res.json(rclTeamsStore[idx]);
});

app.get('/rcl/fixtures', (req, res) => {
  const season = req.query['filter[season]'] as string | undefined;
  const status = req.query['filter[status]'] as string | undefined;
  let items = rclFixturesStore;
  if (season) items = items.filter((f) => String(f.season) === season);
  if (status) items = items.filter((f) => f.status === status);
  res.json({ items, total: items.length, page: 1, pageSize: items.length || 1 });
});

app.post('/rcl/fixtures', (req, res) => {
  const body = req.body as Record<string, unknown>;
  const homeTeam = rclTeamsStore.find((t) => t.id === body.homeTeamId);
  const awayTeam = rclTeamsStore.find((t) => t.id === body.awayTeamId);
  const id = `fix_${rclFixturesStore.length + 1}`;
  const created = {
    id,
    season: body.season,
    homeTeamId: body.homeTeamId,
    homeTeam: homeTeam ? { id: homeTeam.id, name: homeTeam.name, clubId: homeTeam.clubId } : { id: body.homeTeamId, name: body.homeTeamId, clubId: '' },
    awayTeamId: body.awayTeamId,
    awayTeam: awayTeam ? { id: awayTeam.id, name: awayTeam.name, clubId: awayTeam.clubId } : { id: body.awayTeamId, name: body.awayTeamId, clubId: '' },
    scheduledAt: body.scheduledAt,
    venue: body.venue ?? null,
    status: 'scheduled',
    result: null,
  };
  rclFixturesStore = [...rclFixturesStore, created];
  res.status(201).json(created);
});

app.put('/rcl/fixtures/:id', (req, res) => {
  const idx = rclFixturesStore.findIndex((x) => x.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ statusCode: 404, error: 'NotFound' });
    return;
  }
  const body = req.body as { status?: string; venue?: string | null; scheduledAt?: string; result?: Record<string, unknown> };
  const existing = rclFixturesStore[idx];
  rclFixturesStore[idx] = {
    ...existing,
    ...(body.status ? { status: body.status } : {}),
    ...(body.venue !== undefined ? { venue: body.venue } : {}),
    ...(body.scheduledAt !== undefined ? { scheduledAt: body.scheduledAt } : {}),
    ...(body.result ? { result: { ...body.result, fixtureId: req.params.id, enteredById: 'usr_e2e' } } : {}),
  };
  res.json(rclFixturesStore[idx]);
});

app.get('/public/rcl/fixtures', (_req, res) => void res.json(rclFixturesStore));

app.get('/public/rcl/standings', (_req, res) => void res.json(fixture('rcl-standings.json')));

let cbListingsStore = fixture('careerbridge-listings.json') as Array<Record<string, unknown>>;
const cbVerifyTokens = new Map<string, string>();

function isCbLive(item: Record<string, unknown>): boolean {
  return item.status === 'verified' || item.status === 'filled';
}

app.get('/public/careerbridge/listings', (req, res) => {
  const type = req.query['filter[type]'] as string | undefined;
  let items = cbListingsStore.filter(isCbLive);
  if (type) items = items.filter((l) => l.type === type);
  res.json({ items, total: items.length, page: 1, pageSize: items.length || 1 });
});

app.get('/public/careerbridge/listings/:id', (req, res) => {
  const l = cbListingsStore.find((x) => x.id === req.params.id && isCbLive(x));
  if (!l) {
    res.status(404).json({ statusCode: 404, error: 'NotFound' });
    return;
  }
  res.json(l);
});

app.post('/public/careerbridge/listings', (req, res) => {
  const body = req.body as Record<string, unknown>;
  if (typeof body.website === 'string' && body.website.length > 0) {
    res.status(201).json({ id: `cb_bot_${Date.now()}`, status: 'pending_email' });
    return;
  }
  const id = `cb_${cbListingsStore.length + 1}`;
  const now = new Date().toISOString();
  const created = {
    id,
    title: body.title,
    company: body.company,
    type: body.type,
    location: body.location,
    mode: body.mode,
    stipend: body.stipend ?? null,
    description: body.description,
    applyUrl: body.applyUrl ?? null,
    contactEmail: body.contactEmail,
    postedByName: body.postedByName,
    postedByEmail: body.postedByEmail,
    rotaryAffiliation: body.rotaryAffiliation ?? null,
    status: 'pending_email',
    verifiedById: null,
    verifiedAt: null,
    filledAt: null,
    expiresAt: null,
    rejectionReason: null,
    createdAt: now,
    updatedAt: now,
  };
  cbListingsStore = [...cbListingsStore, created];
  // Mock-only convenience: the real API emails this token, Playwright can't read email.
  const token = `token_${id}`;
  cbVerifyTokens.set(token, id);
  res.status(201).json({ id, status: 'pending_email', _testVerifyToken: token });
});

app.post('/public/careerbridge/listings/verify', (req, res) => {
  const body = req.body as { token?: string };
  const id = body.token ? cbVerifyTokens.get(body.token) : undefined;
  if (!id) {
    res.status(400).json({ statusCode: 400, error: 'BadRequest', message: 'Invalid or already-used verification token' });
    return;
  }
  cbVerifyTokens.delete(body.token as string);
  const idx = cbListingsStore.findIndex((x) => x.id === id);
  if (idx !== -1) cbListingsStore[idx] = { ...cbListingsStore[idx], status: 'pending' };
  res.status(201).json({ id, status: 'pending' });
});

app.get('/careerbridge/listings', (req, res) => {
  const status = req.query['filter[status]'] as string | undefined;
  let items = cbListingsStore;
  if (status) items = items.filter((l) => l.status === status);
  res.json({ items, total: items.length, page: 1, pageSize: items.length || 1 });
});

app.get('/careerbridge/listings/stats', (_req, res) => {
  const countOf = (status: string) => cbListingsStore.filter((l) => l.status === status).length;
  res.json({
    pending: countOf('pending'),
    verified: countOf('verified'),
    filled: countOf('filled'),
    rejected: countOf('rejected'),
    expired: countOf('expired'),
    totalPosted: cbListingsStore.length,
  });
});

app.get('/careerbridge/listings/:id', (req, res) => {
  const l = cbListingsStore.find((x) => x.id === req.params.id);
  if (!l) {
    res.status(404).json({ statusCode: 404, error: 'NotFound' });
    return;
  }
  res.json(l);
});

app.patch('/careerbridge/listings/:id', (req, res) => {
  const idx = cbListingsStore.findIndex((x) => x.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ statusCode: 404, error: 'NotFound' });
    return;
  }
  const body = req.body as { status?: string; rejectionReason?: string | null };
  const now = new Date().toISOString();
  cbListingsStore[idx] = {
    ...cbListingsStore[idx],
    ...(body.status ? { status: body.status } : {}),
    ...(body.status === 'verified' ? { verifiedById: 'usr_e2e', verifiedAt: now, expiresAt: '2026-12-01T00:00:00Z' } : {}),
    ...(body.status === 'filled' ? { filledAt: now } : {}),
    ...(body.status === 'rejected' ? { rejectionReason: body.rejectionReason ?? null } : {}),
    updatedAt: now,
  };
  res.json(cbListingsStore[idx]);
});

let rideSupportClubsStore = fixture('ride-support-clubs.json') as Array<Record<string, unknown>>;
let rideDelegationsStore = fixture('ride-delegations.json') as Array<Record<string, unknown>>;
let rideGalleryStore = fixture('ride-gallery.json') as Array<Record<string, unknown>>;

function publicDelegation(d: Record<string, unknown>) {
  const { contactName: _contactName, contactEmail: _contactEmail, hosts, ...rest } = d;
  void _contactName;
  void _contactEmail;
  return { ...rest, hosts: (hosts as Array<{ club: unknown }>).map((h) => h.club) };
}

app.get('/public/ride/incoming', (_req, res) => {
  const items = rideDelegationsStore.filter((d) => d.status !== 'cancelled').map(publicDelegation);
  res.json({ items });
});

app.get('/public/ride/gallery', (req, res) => {
  const year = req.query.year as string | undefined;
  let items = rideGalleryStore;
  if (year) items = items.filter((g) => String(g.year) === year);
  const years = [...new Set(rideGalleryStore.map((g) => g.year as number))].sort((a, b) => b - a);
  res.json({ items, years });
});

app.get('/public/ride/dashboard', (_req, res) => {
  const delegationsThisRy = rideDelegationsStore.filter((d) => d.ryYear === 2026).length;
  const hostClubIds = new Set(
    rideDelegationsStore.flatMap((d) => (d.hosts as Array<{ club: { id: string } }>).map((h) => h.club.id)),
  );
  res.json({ delegationsThisRy, hostClubsThisRy: hostClubIds.size, updatedAt: new Date().toISOString() });
});

app.get('/ride/support-clubs', (req, res) => {
  const clubId = req.query['filter[clubId]'] as string | undefined;
  let items = rideSupportClubsStore;
  if (clubId) items = items.filter((c) => (c.club as { id: string }).id === clubId);
  res.json({ items, total: items.length, page: 1, pageSize: items.length || 1 });
});

app.post('/ride/support-clubs', (req, res) => {
  const body = req.body as Record<string, unknown>;
  const clubId = (body.clubId as string | undefined) ?? 'club_dse';
  const existingIdx = rideSupportClubsStore.findIndex((c) => (c.club as { id: string }).id === clubId);
  const now = new Date().toISOString();
  const club = RCL_CLUBS[clubId] ?? CLUB_DSE;
  const saved = {
    id: existingIdx === -1 ? `rsc_${rideSupportClubsStore.length + 1}` : rideSupportClubsStore[existingIdx].id,
    ryYear: (body.ryYear as number | undefined) ?? 2026,
    club,
    capacityDelegates: body.capacityDelegates,
    homestayAvailable: body.homestayAvailable,
    preferredMonths: body.preferredMonths ?? [],
    contactMemberId: body.contactMemberId ?? null,
    contactPhone: body.contactPhone,
    notes: body.notes ?? null,
    createdAt: existingIdx === -1 ? now : rideSupportClubsStore[existingIdx].createdAt,
    updatedAt: now,
  };
  if (existingIdx === -1) rideSupportClubsStore = [...rideSupportClubsStore, saved];
  else rideSupportClubsStore = rideSupportClubsStore.map((c, i) => (i === existingIdx ? saved : c));
  res.status(201).json(saved);
});

app.get('/ride/delegations', (req, res) => {
  const status = req.query['filter[status]'] as string | undefined;
  let items = rideDelegationsStore;
  if (status) items = items.filter((d) => d.status === status);
  res.json({ items, total: items.length, page: 1, pageSize: items.length || 1 });
});

app.get('/ride/delegations/:id', (req, res) => {
  const d = rideDelegationsStore.find((x) => x.id === req.params.id);
  if (!d) {
    res.status(404).json({ statusCode: 404, error: 'NotFound' });
    return;
  }
  res.json(d);
});

app.post('/ride/delegations', (req, res) => {
  const body = req.body as Record<string, unknown>;
  const created = {
    id: `del_${rideDelegationsStore.length + 1}`,
    ryYear: body.ryYear,
    visitingDistrict: body.visitingDistrict,
    country: body.country,
    startsAt: body.startsAt,
    endsAt: body.endsAt,
    headcount: body.headcount,
    contactName: body.contactName,
    contactEmail: body.contactEmail ?? null,
    status: body.status ?? 'planned',
    hosts: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  rideDelegationsStore = [...rideDelegationsStore, created];
  res.status(201).json(created);
});

app.patch('/ride/delegations/:id', (req, res) => {
  const idx = rideDelegationsStore.findIndex((x) => x.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ statusCode: 404, error: 'NotFound' });
    return;
  }
  rideDelegationsStore[idx] = { ...rideDelegationsStore[idx], ...(req.body as Record<string, unknown>), updatedAt: new Date().toISOString() };
  res.json(rideDelegationsStore[idx]);
});

app.put('/ride/delegations/:id/hosts', (req, res) => {
  const idx = rideDelegationsStore.findIndex((x) => x.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ statusCode: 404, error: 'NotFound' });
    return;
  }
  const body = req.body as { hosts: { clubId: string; daysHosted: number; membersSent: number }[] };
  const hosts = body.hosts.map((h, i) => ({
    id: `host_${req.params.id}_${i}`,
    club: RCL_CLUBS[h.clubId] ?? CLUB_DSE,
    daysHosted: h.daysHosted,
    membersSent: h.membersSent,
  }));
  rideDelegationsStore[idx] = { ...rideDelegationsStore[idx], hosts, updatedAt: new Date().toISOString() };
  res.json(rideDelegationsStore[idx]);
});

app.get('/ride/gallery-items', (req, res) => {
  const year = req.query['filter[year]'] as string | undefined;
  let items = rideGalleryStore;
  if (year) items = items.filter((g) => String(g.year) === year);
  res.json({ items, total: items.length, page: 1, pageSize: items.length || 1 });
});

app.post('/ride/gallery-items', (req, res) => {
  const body = req.body as Record<string, unknown>;
  const created = {
    id: `rg_${rideGalleryStore.length + 1}`,
    year: body.year,
    url: body.url,
    kind: body.kind,
    caption: body.caption ?? null,
    order: body.order ?? 0,
    createdAt: new Date().toISOString(),
  };
  rideGalleryStore = [...rideGalleryStore, created];
  res.status(201).json(created);
});

app.delete('/ride/gallery-items/:id', (req, res) => {
  const exists = rideGalleryStore.some((g) => g.id === req.params.id);
  if (!exists) {
    res.status(404).json({ statusCode: 404, error: 'NotFound' });
    return;
  }
  rideGalleryStore = rideGalleryStore.filter((g) => g.id !== req.params.id);
  res.status(204).end();
});

app.use((_req, res) => void res.status(404).json({ statusCode: 404, error: 'NotFound' }));

app.listen(PORT, () => console.log(`mock-api listening on ${PORT}`));

import { test, expect } from '@playwright/test';

const CASES: { path: string; content: string }[] = [
  { path: '/', content: 'Service above self, across Delhi NCR' },
  { path: '/showcase', content: 'Blood donation camp' },
  { path: '/leadership', content: 'Rtn. Sanjeev Rai Mehra' },
  { path: '/heritage', content: 'Rtr. Archit Bhatia' },
];

for (const { path, content } of CASES) {
  test(`${path} ships real content in the first HTTP response, before any JS runs`, async ({ request, baseURL }) => {
    const res = await request.get(`${baseURL}${path}`);
    expect(res.ok()).toBe(true);

    const html = await res.text();
    expect(html).toContain(content);
    expect(html).toContain('window.__RAC_PRERENDERED__=true');
  });
}

import { useState } from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server, mswSetup } from '@/test/msw';
import { installXhrStub } from '@/test/xhr-stub';
import { FileUpload, type FileUploadValue } from './FileUpload';
import type { FileUploadProps } from './FileUpload';

mswSetup();

// MSW's server.listen() makes globalThis.XMLHttpRequest non-writable; re-flag it writable (same value) so installXhrStub()'s plain assignment can swap it in.
function unlockXhrGlobal(): void {
  Object.defineProperty(globalThis, 'XMLHttpRequest', {
    value: globalThis.XMLHttpRequest,
    writable: true,
    configurable: true,
  });
}

// jsdom's AbortSignal fails undici's webidl check; strip it and emulate abort ourselves instead.
let mswFetch: typeof fetch;
beforeAll(() => {
  mswFetch = globalThis.fetch;
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    if (!init?.signal) return mswFetch(input, init);
    const { signal, ...rest } = init;
    if (signal.aborted) return Promise.reject(new DOMException('The operation was aborted.', 'AbortError'));
    return new Promise<Response>((resolve, reject) => {
      const onAbort = () => reject(new DOMException('The operation was aborted.', 'AbortError'));
      signal.addEventListener('abort', onAbort, { once: true });
      mswFetch(input, rest).then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
    });
  }) as typeof fetch;
});

function Harness(props: Omit<FileUploadProps, 'value' | 'onChange'> & { onChangeSpy?: (v: FileUploadValue | null) => void }) {
  const [value, setValue] = useState<FileUploadValue | null>(null);
  return (
    <FileUpload
      {...props}
      value={value}
      onChange={(v) => {
        setValue(v);
        props.onChangeSpy?.(v);
      }}
    />
  );
}

function jpeg(name: string, size: number): File {
  return new File([new Uint8Array(size)], name, { type: 'image/jpeg' });
}

describe('FileUpload', () => {
  it('renders the idle drop zone with tier-derived accepted-types hint', () => {
    render(<Harness tier="permanent" resourceType="club_logo" label="Club logo" />);
    expect(screen.getByRole('button', { name: 'Choose file' })).toBeInTheDocument();
    expect(screen.getByText(/JPG, PNG, WebP, AVIF, PDF/)).toHaveTextContent('up to 5 MB');
    expect(screen.getByRole('button', { name: 'Paste a link instead' })).toBeInTheDocument();
  });

  it('uploads with progress and shows the success card', async () => {
    unlockXhrGlobal();
    const stub = installXhrStub({ auto: false });
    let patchBody: { providerKey?: string } = {};
    server.use(
      http.post('/files/grants', () => HttpResponse.json({ grantId: 'g1', uploadUrl: 'https://provider.example/upload/key1' })),
      http.patch('/files/grants/:grantId', async ({ request }) => {
        patchBody = (await request.json()) as { providerKey?: string };
        return HttpResponse.json({ id: 'f1', tier: 'permanent', key: patchBody.providerKey, url: 'https://cdn.example/key1', name: 'photo.jpg', mimeType: 'image/jpeg', size: 2048 });
      }),
    );
    const onChangeSpy = vi.fn();
    render(<Harness tier="permanent" resourceType="club_logo" label="Club logo" onChangeSpy={onChangeSpy} />);

    const input = screen.getByLabelText('Club logo');
    await userEvent.upload(input, jpeg('photo.jpg', 2048));

    await waitFor(() => expect(stub.requests).toHaveLength(1));
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    act(() => stub.requests[0].progress(50, 100));
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
    expect(screen.getByText('Uploading, 50 percent complete')).toBeInTheDocument();

    await act(async () => stub.requests[0].succeed(200));

    await waitFor(() => expect(onChangeSpy).toHaveBeenCalledWith({ kind: 'file', file: expect.objectContaining({ name: 'photo.jpg' }) }));
    expect(screen.getByText('photo.jpg')).toBeInTheDocument();
    expect(screen.getByText('2 KB')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove file' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Replace' })).toBeInTheDocument();
    stub.restore();
  });

  it('rejects an oversized file before any network call', async () => {
    let grantCalls = 0;
    server.use(http.post('/files/grants', () => { grantCalls++; return HttpResponse.json({ grantId: 'g1', uploadUrl: 'https://provider.example/x' }); }));
    const onChangeSpy = vi.fn();
    render(<Harness tier="permanent" resourceType="club_logo" label="Club logo" onChangeSpy={onChangeSpy} />);

    await userEvent.upload(screen.getByLabelText('Club logo'), jpeg('huge.jpg', 6 * 1024 * 1024));

    expect(await screen.findByRole('alert')).toHaveTextContent(/under 5 MB/);
    expect(grantCalls).toBe(0);
    expect(onChangeSpy).not.toHaveBeenCalled();
  });

  it('rejects a disallowed MIME type dropped onto the drop zone, before any network call', async () => {
    let grantCalls = 0;
    server.use(http.post('/files/grants', () => { grantCalls++; return HttpResponse.json({ grantId: 'g1', uploadUrl: 'https://provider.example/x' }); }));
    const onChangeSpy = vi.fn();
    render(<Harness tier="permanent" resourceType="club_logo" label="Club logo" onChangeSpy={onChangeSpy} />);

    // dropping bypasses the input's accept filter, unlike userEvent.upload
    const textFile = new File(['hello'], 'notes.txt', { type: 'text/plain' });
    const dropzone = screen.getByRole('button', { name: 'Choose file' }).closest('div') as HTMLElement;
    fireEvent.drop(dropzone, { dataTransfer: { files: [textFile] } });

    expect(await screen.findByRole('alert')).toHaveTextContent(/not accepted/);
    expect(grantCalls).toBe(0);
    expect(onChangeSpy).not.toHaveBeenCalled();
  });

  it('shows an error with retry when the provider leg fails, and recovers on retry', async () => {
    unlockXhrGlobal();
    const stub = installXhrStub({ auto: false });
    let grantCalls = 0;
    server.use(
      http.post('/files/grants', () => {
        grantCalls++;
        return HttpResponse.json({ grantId: 'g1', uploadUrl: 'https://provider.example/upload/key1' });
      }),
      http.patch('/files/grants/:grantId', () => HttpResponse.json({ id: 'f1', tier: 'permanent', key: 'key1', url: 'https://cdn.example/key1', name: 'photo.jpg', mimeType: 'image/jpeg', size: 2048 })),
    );
    render(<Harness tier="permanent" resourceType="club_logo" label="Club logo" />);

    await userEvent.upload(screen.getByLabelText('Club logo'), jpeg('photo.jpg', 2048));
    await waitFor(() => expect(stub.requests).toHaveLength(1));
    await act(async () => stub.requests[0].fail(500));

    expect(await screen.findByRole('alert')).toHaveTextContent(/Upload to storage failed/);
    expect(grantCalls).toBe(1);

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(grantCalls).toBe(2));
    await waitFor(() => expect(stub.requests).toHaveLength(2));
    await act(async () => stub.requests[1].succeed(200));

    expect(await screen.findByText('photo.jpg')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    stub.restore();
  });

  it('paste-a-link mode never calls the grants endpoints', async () => {
    let grantCalls = 0;
    server.use(http.post('/files/grants', () => { grantCalls++; return HttpResponse.json({ grantId: 'g1', uploadUrl: 'https://provider.example/x' }); }));
    const onChangeSpy = vi.fn();
    render(<Harness tier="dynamic" resourceType="event_photo" label="Event photos" onChangeSpy={onChangeSpy} />);

    await userEvent.click(screen.getByRole('button', { name: 'Paste a link instead' }));
    const linkInput = screen.getByRole('textbox');
    await userEvent.type(linkInput, 'https://photos.google.com/album/xyz');
    await userEvent.click(screen.getByRole('button', { name: 'Save link' }));

    expect(onChangeSpy).toHaveBeenCalledWith({ kind: 'link', url: 'https://photos.google.com/album/xyz' });
    expect(screen.getByText('https://photos.google.com/album/xyz')).toBeInTheDocument();
    expect(grantCalls).toBe(0);
    expect(screen.getByRole('button', { name: 'Upload a file instead' })).toBeInTheDocument();
  });

  it('cancels an in-flight upload and returns to idle', async () => {
    unlockXhrGlobal();
    const stub = installXhrStub({ auto: false });
    let grantCalls = 0;
    let patchCalls = 0;
    server.use(
      http.post('/files/grants', () => {
        grantCalls++;
        return HttpResponse.json({ grantId: 'g1', uploadUrl: 'https://provider.example/upload/key1' });
      }),
      http.patch('/files/grants/:grantId', () => {
        patchCalls++;
        return HttpResponse.json({ id: 'f1', tier: 'permanent', key: 'key1', url: 'https://cdn.example/key1', name: 'photo.jpg', mimeType: 'image/jpeg', size: 2048 });
      }),
    );
    const onChangeSpy = vi.fn();
    render(<Harness tier="permanent" resourceType="club_logo" label="Club logo" onChangeSpy={onChangeSpy} />);

    await userEvent.upload(screen.getByLabelText('Club logo'), jpeg('photo.jpg', 2048));
    await waitFor(() => expect(stub.requests).toHaveLength(1));
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Choose file' })).toBeInTheDocument());
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(onChangeSpy).not.toHaveBeenCalled();
    expect(grantCalls).toBe(1);
    expect(patchCalls).toBe(0);
    stub.restore();
  });
});

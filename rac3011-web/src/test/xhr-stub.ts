export interface StubRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: unknown;
  withCredentials: boolean;
  aborted: boolean;
  progress: (loaded: number, total: number) => void;
  succeed: (status?: number) => void;
  fail: (status?: number) => void;
}

interface StubOptions {
  auto?: boolean;
  status?: number;
}

export function installXhrStub(options: StubOptions = {}): { requests: StubRequest[]; restore: () => void } {
  const auto = options.auto ?? true;
  const requests: StubRequest[] = [];
  const original = globalThis.XMLHttpRequest;

  class StubXhr {
    upload: { onprogress: ((event: ProgressEvent) => void) | null } = { onprogress: null };
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    onabort: (() => void) | null = null;
    status = 0;
    withCredentials = false;
    private method = '';
    private url = '';
    private headers: Record<string, string> = {};

    open(method: string, url: string): void {
      this.method = method;
      this.url = url;
    }
    setRequestHeader(name: string, value: string): void {
      this.headers[name] = value;
    }
    abort(): void {
      if (this.entry) this.entry.aborted = true;
      this.onabort?.();
    }
    private entry: StubRequest | undefined;
    send(body?: unknown): void {
      const entry: StubRequest = {
        method: this.method,
        url: this.url,
        headers: this.headers,
        body,
        withCredentials: this.withCredentials,
        aborted: false,
        progress: (loaded, total) => {
          this.upload.onprogress?.({ lengthComputable: true, loaded, total } as ProgressEvent);
        },
        succeed: (status = options.status ?? 204) => {
          this.status = status;
          this.onload?.();
        },
        fail: (status = 500) => {
          this.status = status;
          if (status === 0) this.onerror?.();
          else this.onload?.();
        },
      };
      this.entry = entry;
      requests.push(entry);
      if (auto) {
        entry.progress(50, 100);
        entry.succeed();
      }
    }
  }

  globalThis.XMLHttpRequest = StubXhr as unknown as typeof XMLHttpRequest;
  return { requests, restore: () => (globalThis.XMLHttpRequest = original) };
}

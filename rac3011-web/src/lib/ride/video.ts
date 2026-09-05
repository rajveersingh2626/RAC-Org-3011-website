// Converts a pasted share/watch link into an <iframe>-embeddable URL for the hosts the spec
// calls out (youtube.com, youtu.be, drive.google.com /file). Unrecognized hosts get a plain link-out.
export function videoEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.endsWith('youtube.com')) {
      const id = u.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (u.pathname.startsWith('/embed/')) return url;
      return null;
    }
    if (u.hostname === 'drive.google.com' && u.pathname.includes('/file/')) {
      return url.replace('/view', '/preview');
    }
    return null;
  } catch {
    return null;
  }
}

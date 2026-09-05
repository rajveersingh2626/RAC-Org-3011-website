import { describe, expect, it } from 'vitest';
import { videoEmbedUrl } from './video';

describe('videoEmbedUrl', () => {
  it('converts a youtube.com watch link to an embed url', () => {
    expect(videoEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
    );
  });

  it('converts a youtu.be short link to an embed url', () => {
    expect(videoEmbedUrl('https://youtu.be/dQw4w9WgXcQ')).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
  });

  it('passes through an already-embed youtube url', () => {
    expect(videoEmbedUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
    );
  });

  it('converts a drive.google.com file view link to a preview link', () => {
    expect(videoEmbedUrl('https://drive.google.com/file/d/abc123/view')).toBe(
      'https://drive.google.com/file/d/abc123/preview',
    );
  });

  it('returns null for an unrecognized host', () => {
    expect(videoEmbedUrl('https://vimeo.com/12345')).toBeNull();
  });

  it('returns null for a malformed url', () => {
    expect(videoEmbedUrl('not a url')).toBeNull();
  });
});

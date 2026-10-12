import { describe, it, expect } from 'vitest';
import { extractYouTubeVideoId } from '../src/lib/server/gemini';

describe('YouTube URL Normalization & Video ID Extraction', () => {
  it('extracts video ID from standard watch URL', () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    expect(extractYouTubeVideoId(url)).toBe('dQw4w9WgXcQ');
  });

  it('extracts video ID from short youtu.be URL', () => {
    const url = 'https://youtu.be/dQw4w9WgXcQ';
    expect(extractYouTubeVideoId(url)).toBe('dQw4w9WgXcQ');
  });

  it('extracts video ID from embed URL', () => {
    const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
    expect(extractYouTubeVideoId(url)).toBe('dQw4w9WgXcQ');
  });

  it('extracts video ID with additional query parameters', () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s&feature=shared';
    expect(extractYouTubeVideoId(url)).toBe('dQw4w9WgXcQ');
  });

  it('extracts video ID from shorts URL', () => {
    const url = 'https://www.youtube.com/shorts/dQw4w9WgXcQ';
    expect(extractYouTubeVideoId(url)).toBe('dQw4w9WgXcQ');
  });

  it('returns null for invalid or non-YouTube URLs', () => {
    expect(extractYouTubeVideoId('https://vimeo.com/123456')).toBeNull();
    expect(extractYouTubeVideoId('https://example.com/watch?v=123')).toBeNull();
    expect(extractYouTubeVideoId('')).toBeNull();
  });
});

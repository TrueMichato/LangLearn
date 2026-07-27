import { jaLyrics } from './ja-lyrics';
import { ruLyrics } from './ru-lyrics';
import { ptLyrics } from './pt-lyrics';
import { esLyrics } from './es-lyrics';
import { arLyrics } from './ar-lyrics';
import type { Song } from './types';

export type { Song, LyricLine, SongVocab } from './types';

export const allLyrics: Song[] = [...jaLyrics, ...ruLyrics, ...ptLyrics, ...esLyrics, ...arLyrics];

export function getLyricsByLanguage(language: string): Song[] {
  return allLyrics.filter((s) => s.language === language);
}

export function getSongById(id: string): Song | undefined {
  return allLyrics.find((s) => s.id === id);
}

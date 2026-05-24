// @ts-nocheck
import type {
  TmdbMovie, TmdbShow, TmdbVideo, TmdbGenre,
  TmdbListResult, TmdbTrendingItem, TmdbCastMember,
} from '../types/tmdb'

const WASSI_USER_ID = 'ed5393aeaf7b41ebb87ac02792cae013'

export function tmdbImg(path: string | null | undefined, size = 'w500'): string | null {
  if (!path) return null
  return `${import.meta.env.VITE_PLEX_URL}/Items/${path}/Images/Primary?api_key=${import.meta.env.VITE_API_KEY}`
}

async function getJellyfinItems(itemType: 'Movie' | 'Series', limit = 20, page = 1): Promise<any[]> {
  const url = `${import.meta.env.VITE_PLEX_URL}/Users/${WASSI_USER_ID}/Items?IncludeItemTypes=${itemType}&Recursive=true&Fields=Overview,Genres,ProviderIds&Limit=${limit}&StartIndex=${(page - 1) * limit}&api_key=${import.meta.env.VITE_API_KEY}`
  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    return data.Items || []
  } catch (e) {
    return []
  }
}

function mapJellyfinToMovie(item: any): TmdbMovie {
  return {
    id: item.Id,
    title: item.Name,
    overview: item.Overview || '',
    poster_path: item.Id,
    backdrop_path: item.Id,
    release_date: item.ProductionYear?.toString() || '',
    vote_average: item.CommunityRating || 0,
    genre_ids: [],
    media_type: 'movie',
  }
}

function mapJellyfinToShow(item: any): TmdbShow {
  return {
    id: item.Id,
    name: item.Name,
    overview: item.Overview || '',
    poster_path: item.Id,
    backdrop_path: item.Id,
    first_air_date: item.ProductionYear?.toString() || '',
    vote_average: item.CommunityRating || 0,
    genre_ids: [],
    media_type: 'tv',
  }
}

// ── Trending ────────────────────────────────────────────────────────────────
export async function getTrending(): Promise<TmdbTrendingItem[]> {
  const m = await getJellyfinItems('Movie', 10)
  const s = await getJellyfinItems('Series', 10)
  return [...m.map(mapJellyfinToMovie), ...s.map(mapJellyfinToShow)] as any
}

// ── Search ──────────────────────────────────────────────────────────────────
export async function searchMulti(query: string, page = 1): Promise<TmdbTrendingItem[]> {
  const url = `${import.meta.env.VITE_PLEX_URL}/Users/${WASSI_USER_ID}/Items?SearchTerm=${encodeURIComponent(query)}&Recursive=true&IncludeItemTypes=Movie,Series&Fields=Overview&Limit=20&StartIndex=${(page - 1) * 20}&api_key=${import.meta.env.VITE_API_KEY}`
  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    return (data.Items || []).map((i: any) => i.Type === 'Movie' ? mapJellyfinToMovie(i) : mapJellyfinToShow(i))
  } catch {
    return []
  }
}

// ── Movies ──────────────────────────────────────────────────────────────────
export async function getPopularMovies(page = 1): Promise<TmdbMovie[]> {
  const items = await getJellyfinItems('Movie', 20, page)
  return items.map(mapJellyfinToMovie)
}

export async function getTopRatedMovies(page = 1): Promise<TmdbMovie[]> {
  return getPopularMovies(page)
}

export async function getNowPlayingMovies(page = 1): Promise<TmdbMovie[]> {
  return getPopularMovies(page)
}

export async function getMoviesByGenre(genreId: number, page = 1): Promise<TmdbMovie[]> {
  return getPopularMovies(page)
}

export async function getMovieVideos(_id: number): Promise<TmdbVideo[]> {
  return []
}

export async function getMovieDetail(id: number | string): Promise<any> {
  const url = `${import.meta.env.VITE_PLEX_URL}/Users/${WASSI_USER_ID}/Items/${id}?api_key=${import.meta.env.VITE_API_KEY}`
  try {
    const res = await fetch(url)
    const item = await res.json()
    return { ...mapJellyfinToMovie(item), videos: { results: [] }, credits: { cast: [] } }
  } catch {
    return { id, title: 'Unknown', videos: { results: [] }, credits: { cast: [] } }
  }
}

export async function getMovieGenres(): Promise<TmdbGenre[]> {
  return []
}

// ── TV Shows ────────────────────────────────────────────────────────────────
export async function getPopularShows(page = 1): Promise<TmdbShow[]> {
  const items = await getJellyfinItems('Series', 20, page)
  return items.map(mapJellyfinToShow)
}

export async function getTopRatedShows(page = 1): Promise<TmdbShow[]> {
  return getPopularShows(page)
}

export async function getShowsByGenre(genreId: number, page = 1): Promise<TmdbShow[]> {
  return getPopularShows(page)
}

export async function getShowVideos(_id: number): Promise<TmdbVideo[]> {
  return []
}

export async function getShowDetail(id: number | string): Promise<any> {
  const url = `${import.meta.env.VITE_PLEX_URL}/Users/${WASSI_USER_ID}/Items/${id}?api_key=${import.meta.env.VITE_API_KEY}`
  try {
    const res = await fetch(url)
    const item = await res.json()
    return { ...mapJellyfinToShow(item), videos: { results: [] }, credits: { cast: [] } }
  } catch {
    return { id, name: 'Unknown', videos: { results: [] }, credits: { cast: [] } }
  }
}

export async function getTVGenres(): Promise<TmdbGenre[]> {
  return []
}

// ── Videos helper ───────────────────────────────────────────────────────────
export function pickBestTrailer(_videos: TmdbVideo[]): TmdbVideo | null {
  return null
}

// ── Genre ID maps ────────────────────────────────────────────────────────────
export const FILM_GENRE_IDS: (number | null)[] = [null, 28, 878, 18, 53, 35, 27, 99]
export const SERIES_GENRE_IDS: (number | null)[] = [null, 18, 10765, 9648, 35, 16, 99]

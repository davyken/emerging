// @ts-nocheck
import type {
  TmdbMovie, TmdbShow, TmdbVideo, TmdbGenre,
  TmdbListResult, TmdbTrendingItem, TmdbCastMember,
} from '../types/tmdb'

// ── Jellyfin VOD (jellyfin.emergingstream.com)
// Use a dev-time proxy at `/jellyfin` to avoid CORS when running locally
const JBASE = import.meta.env.DEV ? '/jellyfin' : (import.meta.env.VITE_JELLYFIN_URL || 'https://jellyfin.emergingstream.com')
const JKEY  = import.meta.env.VITE_API_KEY || ''
const JUSER = import.meta.env.VITE_JELLYFIN_USER_ID || ''

function jImg(itemId: string, type: 'Primary' | 'Backdrop' = 'Primary'): string {
  return `${JBASE}/Items/${itemId}/Images/${type}?api_key=${JKEY}&fillWidth=400&quality=90`
}

// ── Image helpers ─────────────────────────────────────────────────────────────
export function tmdbImg(path: string | null | undefined, _size = 'w500'): string | null {
  if (!path) return null
  // If the path is already a full URL (or a dev-proxied Jellyfin path), return it directly
  if (path.startsWith('http') || path.startsWith('/jellyfin')) return path
  // TMDB-format path from enrichment (/abc.jpg)
  return `https://image.tmdb.org/t/p/${_size}${path}`
}

const TMDB_IMG = 'https://image.tmdb.org/t/p'
export function tmdbProfileImg(path: string | null | undefined, size = 'w185'): string | null {
  // TMDB-profile images disabled: only return full URLs (Jellyfin)
  if (!path) return null
  if (path.startsWith('http')) return path
  return null
}

// ── fetch helpers ─────────────────────────────────────────────────────────────
async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(id)
  }
}

// ── In-memory cache ───────────────────────────────────────────────────────────
const CACHE_TTL = 30 * 60 * 1000
const cache: Record<string, { data: any[]; ts: number }> = {}

async function jellyfinItems(itemType: 'Movie' | 'Series', limit = 20, page = 1): Promise<any[]> {
   const start = (page - 1) * limit
   const url = `${JBASE}/Users/${JUSER}/Items?IncludeItemTypes=${itemType}&Recursive=true&Fields=Overview,Genres,CommunityRating,BackdropImageTags,ImageTags&Limit=${limit}&StartIndex=${start}&SortBy=DateCreated&SortOrder=Descending&api_key=${JKEY}`
   const hit = cache[url]
   if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data
   try {
     const res = await fetchWithTimeout(url, 12000)
     if (!res.ok) return hit?.data ?? []
     const data = await res.json()
     const items = (data?.Items ?? []).filter((item: any) => !item.IsFolder && item.Type === itemType)
     if (items.length) cache[url] = { data: items, ts: Date.now() }
     return items.length ? items : (hit?.data ?? [])
   } catch {
     return hit?.data ?? []
   }
 }

function mapJellyfinToMovie(item: any): TmdbMovie {
  const poster = item.ImageTags?.Primary ? jImg(item.Id, 'Primary') : null
  const backdrop = (item.BackdropImageTags?.length ?? 0) > 0 ? jImg(item.Id, 'Backdrop') : poster
  return {
    id: item.Id,
    title: item.Name || '',
    overview: item.Overview || '',
    poster_path: poster,
    backdrop_path: backdrop,
    release_date: item.PremiereDate?.split('T')[0] || item.ProductionYear?.toString() || '',
    vote_average: item.CommunityRating || 0,
    vote_count: 0,
    genre_ids: [],
    popularity: 0,
    original_language: 'en',
    media_type: 'movie',
    container_extension: 'mkv',
  }
}

function mapJellyfinToShow(item: any): TmdbShow {
  const poster = item.ImageTags?.Primary ? jImg(item.Id, 'Primary') : null
  const backdrop = (item.BackdropImageTags?.length ?? 0) > 0 ? jImg(item.Id, 'Backdrop') : poster
  return {
    id: item.Id,
    name: item.Name || '',
    overview: item.Overview || '',
    poster_path: poster,
    backdrop_path: backdrop,
    first_air_date: item.PremiereDate?.split('T')[0] || item.ProductionYear?.toString() || '',
    vote_average: item.CommunityRating || 0,
    vote_count: 0,
    genre_ids: [],
    popularity: 0,
    original_language: 'en',
    media_type: 'tv',
  }
}

// ── TMDB enrichment (trailers + cast via real TMDB API)
// TMDB integration disabled — external Movie DB calls are turned off
// const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY
const TMDB_KEY = ''

export interface TmdbEnrichment {
  videos: TmdbVideo[]
  cast: TmdbCastMember[]
  genres: { id: number; name: string }[]
}

const enrichmentCache = new Map<string, TmdbEnrichment | null>()
const trailerCache = new Map<string, string | null>()

async function tmdbSearchId(_title: string, _type: 'movie' | 'tv'): Promise<number | null> {
  // Disabled: TMDB external search is turned off
  return null
}

export async function getTmdbEnrichment(_title: string, _type: 'movie' | 'tv'): Promise<TmdbEnrichment | null> {
  // Disabled: TMDB enrichment is turned off
  return null
}

export async function getTrailerKey(_title: string, _type: 'movie' | 'tv'): Promise<string | null> {
  // Disabled: TMDB trailer lookup
  return null
}

// ── Trending ──────────────────────────────────────────────────────────────────
export async function getTrending(): Promise<TmdbTrendingItem[]> {
  const [movies, shows] = await Promise.all([jellyfinItems('Movie', 8), jellyfinItems('Series', 8)])
  return [...movies.map(mapJellyfinToMovie), ...shows.map(mapJellyfinToShow)] as any
}

// ── Search (Jellyfin search) ──────────────────────────────────────────────────
export async function searchMulti(query: string, _page = 1): Promise<TmdbTrendingItem[]> {
  try {
    const url = `${JBASE}/Items?searchTerm=${encodeURIComponent(query)}&Recursive=true&IncludeItemTypes=Movie,Series&Fields=Overview,ImageTags,BackdropImageTags,CommunityRating&Limit=40&api_key=${JKEY}`
    const res = await fetchWithTimeout(url, 10000)
    if (!res.ok) return []
    const data = await res.json()
    return (data?.Items ?? []).map((item: any) =>
      item.Type === 'Series' ? mapJellyfinToShow(item) : mapJellyfinToMovie(item)
    ) as any
  } catch {
    return []
  }
}

// ── Movies ────────────────────────────────────────────────────────────────────
export async function getPopularMovies(page = 1): Promise<TmdbMovie[]> {
  return (await jellyfinItems('Movie', 20, page)).map(mapJellyfinToMovie)
}

export async function getTopRatedMovies(page = 1): Promise<TmdbMovie[]> {
  try {
    const url = `${JBASE}/Users/${JUSER}/Items?IncludeItemTypes=Movie&Recursive=true&Fields=Overview,Genres,CommunityRating,BackdropImageTags,ImageTags&Limit=20&StartIndex=${(page - 1) * 20}&SortBy=CommunityRating&SortOrder=Descending&api_key=${JKEY}`
    const res = await fetchWithTimeout(url, 12000)
    if (!res.ok) return getPopularMovies(page)
    const data = await res.json()
    const items = data?.Items ?? []
    return items.length ? items.map(mapJellyfinToMovie) : getPopularMovies(page)
  } catch {
    return getPopularMovies(page)
  }
}

export async function getNowPlayingMovies(page = 1): Promise<TmdbMovie[]> {
  try {
    const url = `${JBASE}/Users/${JUSER}/Items/Latest?IncludeItemTypes=Movie&Fields=Overview,ImageTags,BackdropImageTags,CommunityRating&Limit=20&api_key=${JKEY}`
    const res = await fetchWithTimeout(url, 12000)
    if (!res.ok) return getPopularMovies(page)
    const items = await res.json()
    return Array.isArray(items) ? items.map(mapJellyfinToMovie) : getPopularMovies(page)
  } catch {
    return getPopularMovies(page)
  }
}

export async function getMoviesByGenre(_genreId: number, page = 1): Promise<TmdbMovie[]> {
  return getPopularMovies(page)
}

export async function getMovieVideos(_id: number): Promise<TmdbVideo[]> {
  return []
}

export async function getMovieDetail(id: number | string): Promise<any> {
  try {
    const res = await fetchWithTimeout(
      `${JBASE}/Users/${JUSER}/Items/${id}?Fields=Overview,Genres,CommunityRating,BackdropImageTags,ImageTags&api_key=${JKEY}`,
      10000,
    )
    if (!res.ok) throw new Error('not ok')
    const item = await res.json()
    const poster = item.ImageTags?.Primary ? jImg(item.Id, 'Primary') : null
    const backdrop = (item.BackdropImageTags?.length ?? 0) > 0 ? jImg(item.Id, 'Backdrop') : poster
    return {
      id: item.Id,
      title: item.Name || 'Unknown',
      overview: item.Overview || '',
      poster_path: poster,
      backdrop_path: backdrop,
      release_date: item.PremiereDate?.split('T')[0] || item.ProductionYear?.toString() || '',
      vote_average: item.CommunityRating || 0,
      vote_count: 0,
      popularity: 0,
      original_language: 'en',
      container_extension: 'mkv',
      videos: { results: [] },
      credits: { cast: [] },
    }
  } catch {
    return { id, title: 'Unknown', container_extension: 'mkv', videos: { results: [] }, credits: { cast: [] } }
  }
}

export async function getMovieGenres(): Promise<TmdbGenre[]> {
  return []
}

// ── TV Shows ──────────────────────────────────────────────────────────────────
export async function getPopularShows(page = 1): Promise<TmdbShow[]> {
  return (await jellyfinItems('Series', 20, page)).map(mapJellyfinToShow)
}

export async function getTopRatedShows(page = 1): Promise<TmdbShow[]> {
  try {
    const url = `${JBASE}/Users/${JUSER}/Items?IncludeItemTypes=Series&Recursive=true&Fields=Overview,Genres,CommunityRating,BackdropImageTags,ImageTags&Limit=20&StartIndex=${(page - 1) * 20}&SortBy=CommunityRating&SortOrder=Descending&api_key=${JKEY}`
    const res = await fetchWithTimeout(url, 12000)
    if (!res.ok) return getPopularShows(page)
    const data = await res.json()
    const items = data?.Items ?? []
    return items.length ? items.map(mapJellyfinToShow) : getPopularShows(page)
  } catch {
    return getPopularShows(page)
  }
}

export async function getShowsByGenre(_genreId: number, page = 1): Promise<TmdbShow[]> {
  return getPopularShows(page)
}

export async function getShowVideos(_id: number): Promise<TmdbVideo[]> {
  return []
}

export async function getShowDetail(id: number | string): Promise<any> {
  try {
    const res = await fetchWithTimeout(
      `${JBASE}/Users/${JUSER}/Items/${id}?Fields=Overview,Genres,CommunityRating,BackdropImageTags,ImageTags&api_key=${JKEY}`,
      10000,
    )
    if (!res.ok) throw new Error('not ok')
    const item = await res.json()
    const poster = item.ImageTags?.Primary ? jImg(item.Id, 'Primary') : null
    const backdrop = (item.BackdropImageTags?.length ?? 0) > 0 ? jImg(item.Id, 'Backdrop') : poster
    return {
      id: item.Id,
      name: item.Name || 'Unknown',
      overview: item.Overview || '',
      poster_path: poster,
      backdrop_path: backdrop,
      first_air_date: item.PremiereDate?.split('T')[0] || item.ProductionYear?.toString() || '',
      vote_average: item.CommunityRating || 0,
      vote_count: 0,
      popularity: 0,
      original_language: 'en',
      videos: { results: [] },
      credits: { cast: [] },
    }
  } catch {
    return { id, name: 'Unknown', videos: { results: [] }, credits: { cast: [] } }
  }
}

export async function getTVGenres(): Promise<TmdbGenre[]> {
  return []
}

// ── Videos helper ─────────────────────────────────────────────────────────────
export function pickBestTrailer(_videos: TmdbVideo[]): TmdbVideo | null {
  return null
}

// ── Genre ID maps (unused with Jellyfin but kept for API compatibility) ────────
export const FILM_GENRE_IDS: (number | null)[] = [null, 28, 878, 18, 53, 35, 27, 99]
export const SERIES_GENRE_IDS: (number | null)[] = [null, 18, 10765, 9648, 35, 16, 99]

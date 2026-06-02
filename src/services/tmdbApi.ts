// @ts-nocheck
import type {
  TmdbMovie, TmdbShow, TmdbVideo, TmdbGenre,
  TmdbListResult, TmdbTrendingItem, TmdbCastMember,
} from '../types/tmdb'

// ── Xtream API — routed through our backend proxy to avoid mixed-content blocks
const XTREAM_API = '/api/xtream'

// ── Jellyfin / VITE_PLEX_URL approach (commented out) ────────────────────────
// const WASSI_USER_ID = import.meta.env.VITE_JELLYFIN_USER_ID || 'ed5393aeaf7b41ebb87ac02792cae013'
//
// async function getJellyfinItems(itemType: 'Movie' | 'Series', limit = 20, page = 1): Promise<any[]> {
//   const url = `${import.meta.env.VITE_PLEX_URL}/Users/${WASSI_USER_ID}/Items?IncludeItemTypes=${itemType}&Recursive=true&Fields=Overview,Genres,ProviderIds&Limit=${limit}&StartIndex=${(page - 1) * limit}&api_key=${import.meta.env.VITE_API_KEY}`
//   try {
//     const res = await fetchWithTimeout(url)
//     if (!res.ok) return []
//     const data = await res.json()
//     return data.Items || []
//   } catch (e) {
//     return []
//   }
// }
//
// function mapJellyfinToMovie(item: any): TmdbMovie {
//   return {
//     id: item.Id,
//     title: item.Name,
//     overview: item.Overview || '',
//     poster_path: item.Id,
//     backdrop_path: item.Id,
//     release_date: item.ProductionYear?.toString() || '',
//     vote_average: item.CommunityRating || 0,
//     genre_ids: [],
//     media_type: 'movie',
//   }
// }
//
// function mapJellyfinToShow(item: any): TmdbShow {
//   return {
//     id: item.Id,
//     name: item.Name,
//     overview: item.Overview || '',
//     poster_path: item.Id,
//     backdrop_path: item.Id,
//     first_air_date: item.ProductionYear?.toString() || '',
//     vote_average: item.CommunityRating || 0,
//     genre_ids: [],
//     media_type: 'tv',
//   }
// }

// ── Image helper ─────────────────────────────────────────────────────────────
/**
 * Previously built a Jellyfin image URL from an item ID:
 *   return `${VITE_PLEX_URL}/Items/${path}/Images/Primary?api_key=${VITE_API_KEY}`
 *
 * Now poster_path / backdrop_path already hold the full Xtream stream_icon URL,
 * so we just return it directly (the `size` param is unused but kept for compat).
 */
export function tmdbImg(path: string | null | undefined, _size = 'w500'): string | null {
  if (!path) return null
  return path
}

/** fetch with 8 s timeout to avoid hanging if the server is unreachable */
async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(id)
  }
}

// ── In-memory cache (30 min TTL) ─────────────────────────────────────────────
const CACHE_TTL = 30 * 60 * 1000
const cache: Record<string, { data: any[]; ts: number }> = {}

async function cachedFetch(url: string): Promise<any[]> {
  const hit = cache[url]
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data
  try {
    const res = await fetchWithTimeout(url, 15000)
    if (!res.ok) return hit?.data ?? []
    const data = await res.json()
    if (!Array.isArray(data)) return hit?.data ?? []
    cache[url] = { data, ts: Date.now() }
    return data
  } catch {
    return hit?.data ?? []
  }
}

// ── Xtream VOD (movies) ───────────────────────────────────────────────────────
async function getXtreamVOD(limit = 20, page = 1): Promise<any[]> {
  const data = await cachedFetch(`${XTREAM_API}&action=get_vod_streams`)
  const start = (page - 1) * limit
  return data.slice(start, start + limit)
}

// ── Xtream Series (TV shows) ──────────────────────────────────────────────────
async function getXtreamSeries(limit = 20, page = 1): Promise<any[]> {
  const data = await cachedFetch(`${XTREAM_API}&action=get_series`)
  const start = (page - 1) * limit
  return data.slice(start, start + limit)
}

function mapXtreamToMovie(item: any): TmdbMovie {
  const year = item.releaseDate
    ? item.releaseDate.split('-')[0]
    : item.added
      ? new Date(Number(item.added) * 1000).getFullYear().toString()
      : ''
  return {
    id: item.stream_id,
    title: item.name,
    overview: item.plot || '',
    poster_path: item.stream_icon || null,
    backdrop_path: item.backdrop_path?.[0] || item.stream_icon || null,
    release_date: year,
    vote_average: parseFloat(item.rating) || 0,
    vote_count: 0,
    genre_ids: [],
    popularity: 0,
    original_language: 'en',
    media_type: 'movie',
    // stored so Watch.tsx can build the correct stream URL
    container_extension: item.container_extension || 'mp4',
  }
}

function mapXtreamToShow(item: any): TmdbShow {
  return {
    id: item.series_id,
    name: item.name,
    overview: item.plot || '',
    poster_path: item.cover || null,
    backdrop_path: item.backdrop_path?.[0] || item.cover || null,
    first_air_date: item.releaseDate || '',
    vote_average: parseFloat(item.rating) || 0,
    vote_count: 0,
    genre_ids: [],
    popularity: 0,
    original_language: 'en',
    media_type: 'tv',
  }
}

// ── TMDB enrichment (trailers + cast + genres by title search) ────────────────
const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY
const TMDB_IMG = 'https://image.tmdb.org/t/p'

export function tmdbProfileImg(path: string | null | undefined, size = 'w185'): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${TMDB_IMG}/${size}${path}`
}

export interface TmdbEnrichment {
  videos: TmdbVideo[]
  cast: TmdbCastMember[]
  genres: { id: number; name: string }[]
}

const enrichmentCache = new Map<string, TmdbEnrichment | null>()
const trailerCache = new Map<string, string | null>()

async function tmdbSearchId(title: string, type: 'movie' | 'tv'): Promise<number | null> {
  if (!TMDB_KEY) return null
  try {
    const endpoint = type === 'movie' ? 'movie' : 'tv'
    const res = await fetchWithTimeout(
      `https://api.themoviedb.org/3/search/${endpoint}?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}&page=1`,
      6000,
    )
    if (!res.ok) return null
    const { results } = await res.json()
    return results?.[0]?.id ?? null
  } catch { return null }
}

export async function getTmdbEnrichment(title: string, type: 'movie' | 'tv'): Promise<TmdbEnrichment | null> {
  if (!TMDB_KEY || !title) return null
  const cacheKey = `enrich:${type}:${title}`
  if (enrichmentCache.has(cacheKey)) return enrichmentCache.get(cacheKey)!
  try {
    const id = await tmdbSearchId(title, type)
    if (!id) { enrichmentCache.set(cacheKey, null); return null }
    const endpoint = type === 'movie' ? 'movie' : 'tv'
    const res = await fetchWithTimeout(
      `https://api.themoviedb.org/3/${endpoint}/${id}?api_key=${TMDB_KEY}&append_to_response=videos,credits`,
      8000,
    )
    if (!res.ok) { enrichmentCache.set(cacheKey, null); return null }
    const data = await res.json()
    const result: TmdbEnrichment = {
      videos: (data.videos?.results ?? []).filter((v: any) => v.site === 'YouTube'),
      cast: data.credits?.cast?.slice(0, 12) ?? [],
      genres: data.genres ?? [],
    }
    enrichmentCache.set(cacheKey, result)
    return result
  } catch {
    enrichmentCache.set(cacheKey, null)
    return null
  }
}

export async function getTrailerKey(title: string, type: 'movie' | 'tv'): Promise<string | null> {
  if (!TMDB_KEY || !title) return null
  const cacheKey = `${type}:${title}`
  if (trailerCache.has(cacheKey)) return trailerCache.get(cacheKey)!
  const enrichment = await getTmdbEnrichment(title, type)
  const trailer = enrichment?.videos?.find(v => v.type === 'Trailer' || v.type === 'Teaser')
  const key = trailer?.key ?? null
  trailerCache.set(cacheKey, key)
  return key
}

// ── Trending ──────────────────────────────────────────────────────────────────
export async function getTrending(): Promise<TmdbTrendingItem[]> {
  const [movies, shows] = await Promise.all([getXtreamVOD(10), getXtreamSeries(10)])
  return [...movies.map(mapXtreamToMovie), ...shows.map(mapXtreamToShow)] as any
}

// ── Search ────────────────────────────────────────────────────────────────────
export async function searchMulti(query: string, page = 1): Promise<TmdbTrendingItem[]> {
  const [vod, series] = await Promise.all([
    cachedFetch(`${XTREAM_API}&action=get_vod_streams`),
    cachedFetch(`${XTREAM_API}&action=get_series`),
  ])
  const q = query.toLowerCase()
  const movies = vod.filter((i: any) => i.name?.toLowerCase().includes(q)).map(mapXtreamToMovie)
  const shows = series.filter((i: any) => i.name?.toLowerCase().includes(q)).map(mapXtreamToShow)
  const all = [...movies, ...shows]
  const start = (page - 1) * 20
  return all.slice(start, start + 20) as any
}

// ── Movies ────────────────────────────────────────────────────────────────────
export async function getPopularMovies(page = 1): Promise<TmdbMovie[]> {
  const items = await getXtreamVOD(20, page)
  return items.map(mapXtreamToMovie)
}

export async function getTopRatedMovies(page = 1): Promise<TmdbMovie[]> {
  return getPopularMovies(page)
}

export async function getNowPlayingMovies(page = 1): Promise<TmdbMovie[]> {
  return getPopularMovies(page)
}

export async function getMoviesByGenre(_genreId: number, page = 1): Promise<TmdbMovie[]> {
  return getPopularMovies(page)
}

export async function getMovieVideos(_id: number): Promise<TmdbVideo[]> {
  return []
}

export async function getMovieDetail(id: number | string): Promise<any> {
  // Previously: `${VITE_PLEX_URL}/Users/${WASSI_USER_ID}/Items/${id}?api_key=${VITE_API_KEY}`
  try {
    const res = await fetchWithTimeout(`${XTREAM_API}&action=get_vod_info&vod_id=${id}`)
    if (!res.ok) throw new Error('not ok')
    const data = await res.json()
    const info = data?.info || {}
    const movie = data?.movie_data || {}
    return {
      id,
      title: info.name || movie.name || 'Unknown',
      overview: info.plot || '',
      poster_path: info.movie_image || null,
      backdrop_path: info.backdrop_path?.[0] || info.movie_image || null,
      release_date: info.releasedate || info.releaseDate || '',
      vote_average: parseFloat(info.rating) || 0,
      vote_count: 0,
      popularity: 0,
      original_language: 'en',
      container_extension: movie.container_extension || 'mp4',
      videos: { results: [] },
      credits: { cast: [] },
    }
  } catch {
    return { id, title: 'Unknown', container_extension: 'mp4', videos: { results: [] }, credits: { cast: [] } }
  }
}

export async function getMovieGenres(): Promise<TmdbGenre[]> {
  return []
}

// ── TV Shows ──────────────────────────────────────────────────────────────────
export async function getPopularShows(page = 1): Promise<TmdbShow[]> {
  const items = await getXtreamSeries(20, page)
  return items.map(mapXtreamToShow)
}

export async function getTopRatedShows(page = 1): Promise<TmdbShow[]> {
  return getPopularShows(page)
}

export async function getShowsByGenre(_genreId: number, page = 1): Promise<TmdbShow[]> {
  return getPopularShows(page)
}

export async function getShowVideos(_id: number): Promise<TmdbVideo[]> {
  return []
}

export async function getShowDetail(id: number | string): Promise<any> {
  // Previously: `${VITE_PLEX_URL}/Users/${WASSI_USER_ID}/Items/${id}?api_key=${VITE_API_KEY}`
  try {
    const res = await fetchWithTimeout(`${XTREAM_API}&action=get_series_info&series_id=${id}`)
    if (!res.ok) throw new Error('not ok')
    const data = await res.json()
    const info = data?.info || {}
    return {
      id,
      name: info.name || 'Unknown',
      overview: info.plot || '',
      poster_path: info.cover || null,
      backdrop_path: info.backdrop_path?.[0] || info.cover || null,
      first_air_date: info.releaseDate || '',
      vote_average: parseFloat(info.rating) || 0,
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

// ── Genre ID maps ──────────────────────────────────────────────────────────────
export const FILM_GENRE_IDS: (number | null)[] = [null, 28, 878, 18, 53, 35, 27, 99]
export const SERIES_GENRE_IDS: (number | null)[] = [null, 18, 10765, 9648, 35, 16, 99]

import type {
  TmdbMovie, TmdbShow, TmdbVideo, TmdbGenre,
  TmdbListResult, TmdbTrendingItem, TmdbCastMember,
} from '../types/tmdb'

const BASE = 'https://api.themoviedb.org/3'

function key() { return (import.meta.env.VITE_TMDB_API_KEY as string) ?? '' }

export function tmdbImg(path: string | null | undefined, size = 'w500'): string | null {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null
}

async function get<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE}/${endpoint}`)
  url.searchParams.set('api_key', key())
  url.searchParams.set('language', 'en-US')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`TMDB ${res.status}`)
  return res.json()
}

// ── Trending ────────────────────────────────────────────────────────────────
export async function getTrending(): Promise<TmdbTrendingItem[]> {
  const data = await get<TmdbListResult<TmdbTrendingItem>>('trending/all/week')
  return data.results
}

// ── Movies ──────────────────────────────────────────────────────────────────
export async function getPopularMovies(page = 1): Promise<TmdbMovie[]> {
  const data = await get<TmdbListResult<TmdbMovie>>('movie/popular', { page: String(page) })
  return data.results
}

export async function getTopRatedMovies(page = 1): Promise<TmdbMovie[]> {
  const data = await get<TmdbListResult<TmdbMovie>>('movie/top_rated', { page: String(page) })
  return data.results
}

export async function getNowPlayingMovies(page = 1): Promise<TmdbMovie[]> {
  const data = await get<TmdbListResult<TmdbMovie>>('movie/now_playing', { page: String(page) })
  return data.results
}

export async function getMoviesByGenre(genreId: number, page = 1): Promise<TmdbMovie[]> {
  const data = await get<TmdbListResult<TmdbMovie>>('discover/movie', {
    with_genres: String(genreId),
    sort_by: 'popularity.desc',
    page: String(page),
  })
  return data.results
}

export async function getMovieDetail(id: number): Promise<TmdbMovie & { videos: { results: TmdbVideo[] }; credits: { cast: TmdbCastMember[] } }> {
  return get(`movie/${id}`, { append_to_response: 'videos,credits' })
}

export async function getMovieGenres(): Promise<TmdbGenre[]> {
  const data = await get<{ genres: TmdbGenre[] }>('genre/movie/list')
  return data.genres
}

// ── TV Shows ────────────────────────────────────────────────────────────────
export async function getPopularShows(page = 1): Promise<TmdbShow[]> {
  const data = await get<TmdbListResult<TmdbShow>>('tv/popular', { page: String(page) })
  return data.results
}

export async function getTopRatedShows(page = 1): Promise<TmdbShow[]> {
  const data = await get<TmdbListResult<TmdbShow>>('tv/top_rated', { page: String(page) })
  return data.results
}

export async function getShowsByGenre(genreId: number, page = 1): Promise<TmdbShow[]> {
  const data = await get<TmdbListResult<TmdbShow>>('discover/tv', {
    with_genres: String(genreId),
    sort_by: 'popularity.desc',
    page: String(page),
  })
  return data.results
}

export async function getShowDetail(id: number): Promise<TmdbShow & { videos: { results: TmdbVideo[] }; credits: { cast: TmdbCastMember[] } }> {
  return get(`tv/${id}`, { append_to_response: 'videos,credits' })
}

export async function getTVGenres(): Promise<TmdbGenre[]> {
  const data = await get<{ genres: TmdbGenre[] }>('genre/tv/list')
  return data.genres
}

// ── Videos helper ───────────────────────────────────────────────────────────
export function pickBestTrailer(videos: TmdbVideo[]): TmdbVideo | null {
  const yt = videos.filter(v => v.site === 'YouTube')
  return (
    yt.find(v => v.type === 'Trailer' && v.official) ??
    yt.find(v => v.type === 'Trailer') ??
    yt.find(v => v.type === 'Teaser') ??
    yt[0] ??
    null
  )
}

// ── Genre ID maps ────────────────────────────────────────────────────────────
// Films categories (index → TMDB genre id, 0 = all)
export const FILM_GENRE_IDS: (number | null)[] = [null, 28, 878, 18, 53, 35, 27, 99]

// Series categories (index → TMDB genre id, 0 = all)
export const SERIES_GENRE_IDS: (number | null)[] = [null, 18, 10765, 9648, 35, 16, 99]

export type TmdbMovie = {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  genre_ids?: number[]
  genres?: { id: number; name: string }[]
  runtime?: number
  tagline?: string
  status?: string
  popularity: number
  original_language: string
  media_type?: 'movie'
}

export type TmdbShow = {
  id: number
  name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date: string
  vote_average: number
  vote_count: number
  genre_ids?: number[]
  genres?: { id: number; name: string }[]
  number_of_seasons?: number
  number_of_episodes?: number
  tagline?: string
  status?: string
  popularity: number
  original_language: string
  media_type?: 'tv'
}

export type TmdbVideo = {
  id: string
  key: string
  name: string
  type: string
  site: string
  official: boolean
  published_at: string
}

export type TmdbGenre = { id: number; name: string }

export type TmdbCastMember = {
  id: number
  name: string
  character: string
  profile_path: string | null
}

export type TmdbListResult<T> = {
  page: number
  results: T[]
  total_pages: number
  total_results: number
}

export type TmdbMediaType = 'movie' | 'tv'

export type TmdbTrendingItem =
  | (TmdbMovie & { media_type: 'movie' })
  | (TmdbShow & { media_type: 'tv' })

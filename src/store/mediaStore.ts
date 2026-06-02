import { create } from 'zustand'
import type { TmdbMovie, TmdbShow, TmdbTrendingItem } from '../types/tmdb'

interface MediaState {
  trending: TmdbTrendingItem[]
  popularMovies: TmdbMovie[]
  popularShows: TmdbShow[]
  topRated: TmdbMovie[]
  loaded: boolean
  setMedia: (data: {
    trending: TmdbTrendingItem[]
    popularMovies: TmdbMovie[]
    popularShows: TmdbShow[]
    topRated: TmdbMovie[]
  }) => void
}

export const useMediaStore = create<MediaState>((set) => ({
  trending: [],
  popularMovies: [],
  popularShows: [],
  topRated: [],
  loaded: false,
  setMedia: (data) => set({ ...data, loaded: true }),
}))

import type { TmdbVideo } from '../types/tmdb'
import { getMovieDetail, getShowDetail, pickBestTrailer } from './tmdbApi'

export type { TmdbVideo }

// Simple in-memory cache
const videoCache = new Map<string, TmdbVideo[]>()

// Fetch all YouTube videos by TMDB ID (most reliable — no title search needed)
export async function getVideosByTmdbId(
  tmdbId: number,
  mediaType: 'movie' | 'tv'
): Promise<TmdbVideo[]> {
  const cacheKey = `${mediaType}:${tmdbId}`
  if (videoCache.has(cacheKey)) return videoCache.get(cacheKey)!
  try {
    const detail = mediaType === 'movie'
      ? await getMovieDetail(tmdbId)
      : await getShowDetail(tmdbId)
    const videos = (detail.videos?.results ?? []).filter((v: any) => v.site === 'YouTube')
    videoCache.set(cacheKey, videos)
    return videos
  } catch {
    return []
  }
}

// Get best trailer key by TMDB ID
export async function getTrailerKeyByTmdbId(
  tmdbId: number,
  mediaType: 'movie' | 'tv'
): Promise<string | null> {
  const videos = await getVideosByTmdbId(tmdbId, mediaType)
  return pickBestTrailer(videos)?.key ?? null
}

// Build an embeddable YouTube URL
export function buildYouTubeEmbedUrl(videoId: string, autoplay = false): string {
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    controls: '1',
    ...(autoplay ? { autoplay: '1' } : {}),
  })
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params}`
}

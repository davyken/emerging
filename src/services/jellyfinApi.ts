import axios from 'axios'
import type { PlexLibrary, PlexMedia } from '../types/plex'

// Use proxied path in dev to avoid CORS
const BASE = import.meta.env.DEV ? '/jellyfin' : (import.meta.env.VITE_JELLYFIN_URL || 'https://jellyfin.emergingstream.com')
const API_KEY = import.meta.env.VITE_API_KEY
const USER_ID = import.meta.env.VITE_JELLYFIN_USER_ID

const client = axios.create({
  baseURL: BASE,
})

client.interceptors.request.use((config) => {
  if (API_KEY) {
    config.params = { ...config.params, api_key: API_KEY }
  }
  return config
})

function mapItemToPlexMedia(item: any): PlexMedia {
  return {
    ratingKey: item.Id,
    key: item.Id,
    title: item.Name,
    type: item.Type === 'Series' ? 'show' : item.Type === 'Episode' ? 'episode' : 'movie',
    summary: item.Overview || '',
    rating: item.CommunityRating,
    year: item.ProductionYear,
    duration: item.RunTimeTicks ? item.RunTimeTicks / 10000 : undefined, // ticks to ms
    thumb: item.ImageTags?.Primary ? `/Items/${item.Id}/Images/Primary` : undefined,
    art: item.ImageTags?.Backdrop ? `/Items/${item.Id}/Images/Backdrop` : undefined,
    addedAt: item.DateCreated ? new Date(item.DateCreated).getTime() : 0,
    updatedAt: item.DateCreated ? new Date(item.DateCreated).getTime() : 0,
  }
}

// Token is ignored since we use API_KEY from .env
export async function getLibraries(_token?: string): Promise<PlexLibrary[]> {
  const res = await client.get(`/Users/${USER_ID}/Views`)
  return (res.data.Items || []).map((item: any) => ({
    key: item.Id,
    type: item.CollectionType === 'tvshows' ? 'show' : 'movie',
    title: item.Name,
    art: item.ImageTags?.Primary ? `/Items/${item.Id}/Images/Primary` : '',
    thumb: item.ImageTags?.Primary ? `/Items/${item.Id}/Images/Primary` : '',
  }))
}

export async function getLibraryItems(_token: string | undefined, sectionId: string): Promise<PlexMedia[]> {
  const res = await client.get(`/Users/${USER_ID}/Items`, {
    params: { ParentId: sectionId, SortBy: 'SortName', Limit: 50, IncludeItemTypes: 'Movie,Series' }
  })
  return (res.data.Items || []).map(mapItemToPlexMedia)
}

export async function getRecentlyAdded(_token?: string): Promise<PlexMedia[]> {
  const res = await client.get(`/Users/${USER_ID}/Items/Latest`, {
    params: { Limit: 20, IncludeItemTypes: 'Movie,Series' }
  })
  return (res.data || []).map(mapItemToPlexMedia)
}

export async function getMediaDetail(_token: string | undefined, ratingKey: string): Promise<PlexMedia> {
  const res = await client.get(`/Users/${USER_ID}/Items/${ratingKey}`)
  return mapItemToPlexMedia(res.data)
}

export async function getSeasons(_token: string | undefined, ratingKey: string): Promise<PlexMedia[]> {
  const res = await client.get(`/Shows/${ratingKey}/Seasons`, {
    params: { userId: USER_ID }
  })
  return (res.data.Items || []).map(mapItemToPlexMedia)
}

export async function getEpisodes(_token: string | undefined, seasonRatingKey: string, showRatingKey?: string): Promise<PlexMedia[]> {
  // If showRatingKey is undefined, Jellyfin might need it. We might need to adjust this depending on UI.
  const res = await client.get(`/Shows/${showRatingKey || seasonRatingKey}/Episodes`, {
    params: { userId: USER_ID, seasonId: seasonRatingKey }
  })
  return (res.data.Items || []).map(mapItemToPlexMedia)
}

export function getStreamUrl(_token: string | undefined, partKey: string): string {
  // For Jellyfin, partKey will be the Item Id.
  const id = partKey.replace('/library/metadata/', '').replace('/children', '')
  return `${BASE}/Videos/${id}/master.m3u8?api_key=${API_KEY}`
}

export function getThumbUrl(_token: string | undefined, thumb: string): string {
  if (!thumb) return '';
  if (thumb.startsWith('http')) return thumb;
  return `${BASE}${thumb}?api_key=${API_KEY}`
}

export function getDownloadUrl(_token: string | undefined, ratingKey: string, _quality: string): string {
  return `${BASE}/Items/${ratingKey}/Download?api_key=${API_KEY}`
}

import axios from 'axios'
import type { PlexMediaContainer, PlexMedia } from '../types/plex'

const BASE = import.meta.env.VITE_PLEX_URL

function client(token: string) {
  return axios.create({
    baseURL: BASE,
    headers: {
      'X-Plex-Token': token,
      'Accept': 'application/json',
    },
  })
}

export async function authenticatePlex(username: string, password: string): Promise<string> {
  const res = await axios.post<{ user: { authToken: string } }>(
    'https://plex.tv/users/sign_in.json',
    { user: { login: username, password } },
    {
      headers: {
        'X-Plex-Client-Identifier': 'emerging-stream-frontend',
        'X-Plex-Product': 'Emerging Stream',
        'X-Plex-Version': '1.0.0',
      },
    }
  )
  return res.data.user.authToken
}

export async function getLibraries(token: string): Promise<PlexMediaContainer['MediaContainer']['Directory']> {
  const res = await client(token).get<PlexMediaContainer>('/library/sections')
  return res.data.MediaContainer.Directory ?? []
}

export async function getLibraryItems(token: string, sectionId: string): Promise<PlexMedia[]> {
  const res = await client(token).get<PlexMediaContainer>(`/library/sections/${sectionId}/all`)
  return res.data.MediaContainer.Metadata ?? []
}

export async function getRecentlyAdded(token: string): Promise<PlexMedia[]> {
  const res = await client(token).get<PlexMediaContainer>('/library/recentlyAdded')
  return res.data.MediaContainer.Metadata ?? []
}

export async function getMediaDetail(token: string, ratingKey: string): Promise<PlexMedia> {
  const res = await client(token).get<PlexMediaContainer>(`/library/metadata/${ratingKey}`)
  const items = res.data.MediaContainer.Metadata
  if (!items || items.length === 0) throw new Error('Media not found')
  return items[0]
}

export async function getSeasons(token: string, ratingKey: string): Promise<PlexMedia[]> {
  const res = await client(token).get<PlexMediaContainer>(`/library/metadata/${ratingKey}/children`)
  return res.data.MediaContainer.Metadata ?? []
}

export async function getEpisodes(token: string, seasonRatingKey: string): Promise<PlexMedia[]> {
  const res = await client(token).get<PlexMediaContainer>(`/library/metadata/${seasonRatingKey}/children`)
  return res.data.MediaContainer.Metadata ?? []
}

export function getStreamUrl(token: string, partKey: string): string {
  return `${BASE}${partKey}?X-Plex-Token=${token}`
}

export function getThumbUrl(token: string, thumb: string): string {
  return `${BASE}${thumb}?X-Plex-Token=${token}`
}

export function getDownloadUrl(token: string, ratingKey: string, quality: string): string {
  return `${BASE}/library/metadata/${ratingKey}/download?quality=${quality}&X-Plex-Token=${token}`
}

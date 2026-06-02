import type { Channel, EPGData } from '../types/xg2g'

// ── Xtream Codes credentials ──────────────────────────────────────────────────
const XTREAM_HOST = import.meta.env.VITE_XTREAM_HOST
const XTREAM_USER = import.meta.env.VITE_XTREAM_USERNAME
const XTREAM_PASS = import.meta.env.VITE_XTREAM_PASSWORD
const XTREAM_API  = `${XTREAM_HOST}/player_api.php?username=${XTREAM_USER}&password=${XTREAM_PASS}`

// ── Jellyfin / VITE_XG2G_URL approach (commented out) ────────────────────────
// import axios from 'axios'
// const BASE    = import.meta.env.VITE_XG2G_URL
// const API_KEY = import.meta.env.VITE_API_KEY
// const client  = axios.create({ baseURL: BASE, timeout: 8000 })
//
// Old getChannels — Jellyfin LiveTv endpoint:
// export async function getChannels(): Promise<Channel[]> {
//   try {
//     const res = await client.get(`/LiveTv/Channels?api_key=${API_KEY}`)
//     if (!res.data || !res.data.Items) return []
//     return res.data.Items.map((item: any) => ({
//       id: item.Id,
//       name: item.Name,
//       group: item.Tags?.[0] || 'Général',
//       streamUrl: getChannelStreamUrl(item.Id),
//       logo: item.ImageTags?.Primary
//         ? `${BASE}/Items/${item.Id}/Images/Primary?api_key=${API_KEY}`
//         : '',
//     }))
//   } catch { return [] }
// }
//
// Old getEPG — Jellyfin LiveTv Programs endpoint:
// export async function getEPG(): Promise<EPGData> {
//   try {
//     const res = await client.get(`/LiveTv/Programs?api_key=${API_KEY}&HasAired=false&limit=1000`)
//     ...
//   } catch { return {} }
// }
//
// Old getChannelStreamUrl — Jellyfin HLS transcode:
// export function getChannelStreamUrl(channelId: string): string {
//   const playSessionId = crypto.randomUUID()
//   return `${BASE}/Videos/${channelId}/master.m3u8?api_key=${API_KEY}&MediaSourceId=${channelId}&PlaySessionId=${playSessionId}&VideoCodec=h264&AudioCodec=aac&TranscodingProtocol=hls&SegmentContainer=ts`
// }

/** Timeout wrapper — avoids hanging if the Xtream server is unreachable */
async function fetchTimeout(url: string, ms = 12000): Promise<Response> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, { signal: ctrl.signal })
  } finally {
    clearTimeout(t)
  }
}

// ── In-memory cache (30 min TTL) ─────────────────────────────────────────────
const CACHE_TTL = 30 * 60 * 1000
let channelCache: { data: Channel[]; ts: number } | null = null

// ── Live channels via Xtream Codes ────────────────────────────────────────────
export async function getChannels(): Promise<Channel[]> {
  if (channelCache && Date.now() - channelCache.ts < CACHE_TTL) return channelCache.data
  try {
    const res = await fetchTimeout(`${XTREAM_API}&action=get_live_streams`)
    if (!res.ok) return channelCache?.data ?? []
    const data = await res.json()
    if (!Array.isArray(data)) return channelCache?.data ?? []
    const channels = data.map((item: any) => ({
      id: String(item.stream_id),
      name: item.name,
      group: item.category_id || 'Général',
      streamUrl: getChannelStreamUrl(String(item.stream_id)),
      logo: item.stream_icon || '',
    }))
    channelCache = { data: channels, ts: Date.now() }
    return channels
  } catch {
    return channelCache?.data ?? []
  }
}

// ── EPG via Xtream Codes ──────────────────────────────────────────────────────
/**
 * Returns a minimal EPG map for the channels currently loaded.
 * Xtream exposes per-channel short EPG via get_short_epg — fetching it for
 * every channel in one go would be N requests, so we return an empty map here
 * and let the WatchIPTV page call getChannelEPG(id) individually when needed.
 */
export async function getEPG(): Promise<EPGData> {
  return {}
}

/**
 * Fetches short EPG for a single channel.
 * Replaces the old all-channels approach that used Jellyfin's /LiveTv/Programs.
 */
export async function getChannelEPG(streamId: string, limit = 10): Promise<EPGData> {
  try {
    const res = await fetchTimeout(
      `${XTREAM_API}&action=get_short_epg&stream_id=${streamId}&limit=${limit}`,
    )
    if (!res.ok) return {}
    const data = await res.json()
    const listings: any[] = data?.epg_listings ?? []
    return {
      [streamId]: listings.map((p: any) => ({
        channelId: streamId,
        title: p.title ? atob(p.title) : p.name || 'Programme',
        description: p.description ? atob(p.description) : '',
        start: new Date(p.start_timestamp * 1000).toISOString(),
        stop: new Date(p.stop_timestamp * 1000).toISOString(),
      })),
    }
  } catch {
    return {}
  }
}

/**
 * Returns the HLS stream URL for a live channel.
 * Xtream format: http://HOST/live/USERNAME/PASSWORD/STREAM_ID.m3u8
 */
export function getChannelStreamUrl(streamId: string): string {
  return `${XTREAM_HOST}/live/${XTREAM_USER}/${XTREAM_PASS}/${streamId}.m3u8`
}

/**
 * Resolves the stream URL for the player.
 * Kept as async to stay compatible with the existing openChannelStream() calls.
 */
export function openChannelStream(streamId: string): Promise<string> {
  return Promise.resolve(getChannelStreamUrl(streamId))
}

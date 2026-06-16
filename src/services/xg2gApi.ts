import type { Channel, EPGData } from '../types/xg2g'

// Use the local backend proxy for guide URLs to avoid browser CORS issues.
const GUIDE_API = '/api/guide'

// ── M3U parser ────────────────────────────────────────────────────────────────
function parseM3U(text: string): Channel[] {
  const channels: Channel[] = []
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.startsWith('#EXTINF:')) continue

    // Extract attributes from the #EXTINF line
    const attrMatch = line.match(/#EXTINF:[^,]*(.*),(.*)/)
    if (!attrMatch) continue

    const attrStr = attrMatch[1]
    const displayName = attrMatch[2].trim()
    const streamUrl = lines[i + 1] && !lines[i + 1].startsWith('#') ? lines[i + 1].trim() : ''
    if (!streamUrl) continue

    const get = (key: string) => {
      const m = attrStr.match(new RegExp(`${key}="([^"]*)"`, 'i'))
      return m ? m[1] : ''
    }

    const id = get('tvg-id') || get('tvg-name') || displayName
    channels.push({
      id,
      name: get('tvg-name') || displayName,
      group: get('group-title') || 'Général',
      streamUrl,
      logo: get('tvg-logo'),
    })
  }
  return channels
}

// ── XMLTV parser ──────────────────────────────────────────────────────────────
function parseXmltvDate(dt: string): string {
  // Format: YYYYMMDDHHmmss +HHMM  or  YYYYMMDDHHmmss +HH:MM
  const m = dt.trim().match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\s*([+-]\d{2}):?(\d{2})$/)
  if (!m) return new Date().toISOString()
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${m[7]}:${m[8]}`
}

function parseXMLTV(text: string): EPGData {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(text, 'text/xml')
    const result: EPGData = {}

    doc.querySelectorAll('programme').forEach(prog => {
      const channel = prog.getAttribute('channel') || ''
      const start = parseXmltvDate(prog.getAttribute('start') || '')
      const stop = parseXmltvDate(prog.getAttribute('stop') || '')
      const title = prog.querySelector('title')?.textContent || ''
      const desc = prog.querySelector('desc')?.textContent || ''

      if (!result[channel]) result[channel] = []
      result[channel].push({ channelId: channel, title, description: desc, start, stop })
    })
    return result
  } catch {
    return {}
  }
}

// ── In-memory caches (30 min TTL) ─────────────────────────────────────────────
const CACHE_TTL = 30 * 60 * 1000

let channelCache: { data: Channel[]; ts: number } | null = null
let epgCache: { data: EPGData; ts: number } | null = null

async function fetchTimeout(url: string, ms = 15000): Promise<Response> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, { signal: ctrl.signal })
  } finally {
    clearTimeout(t)
  }
}

// ── Channels from Threadfin M3U ───────────────────────────────────────────────
export async function getChannels(): Promise<Channel[]> {
  if (channelCache && Date.now() - channelCache.ts < CACHE_TTL) return channelCache.data

  try {
    const res = await fetchTimeout(`${GUIDE_API}/m3u`)
    if (!res.ok) return channelCache?.data ?? []
    const text = await res.text()
    const channels = parseM3U(text)
    if (channels.length > 0) channelCache = { data: channels, ts: Date.now() }
    return channels.length > 0 ? channels : (channelCache?.data ?? [])
  } catch {
    return channelCache?.data ?? []
  }
}

// ── Full EPG from Threadfin XMLTV ─────────────────────────────────────────────
export async function getEPG(): Promise<EPGData> {
  if (epgCache && Date.now() - epgCache.ts < CACHE_TTL) return epgCache.data

  try {
    const res = await fetchTimeout(`${GUIDE_API}/epg`, 20000)
    if (!res.ok) return epgCache?.data ?? {}
    const text = await res.text()
    const data = parseXMLTV(text)
    if (Object.keys(data).length > 0) epgCache = { data, ts: Date.now() }
    return Object.keys(data).length > 0 ? data : (epgCache?.data ?? {})
  } catch {
    return epgCache?.data ?? {}
  }
}

// ── Per-channel EPG (uses full EPG cache) ─────────────────────────────────────
export async function getChannelEPG(channelId: string): Promise<EPGData> {
  const all = await getEPG()
  return all[channelId] ? { [channelId]: all[channelId] } : {}
}

// ── Stream URL (HLS from MediaMTX via the URL already in the M3U) ─────────────
export function getChannelStreamUrl(channelId: string): string {
  // Stream URLs come directly from the M3U fetched from Threadfin.
  // This function is kept for compatibility; callers should prefer using
  // the streamUrl field on the Channel object returned by getChannels().
  const IPTV = import.meta.env.VITE_IPTV_URL || 'https://iptv.emergingstream.com'
  return `${IPTV}/${channelId}/index.m3u8`
}

export async function openChannelStream(channelId: string): Promise<string> {
  // Try to return the exact URL from the M3U (which already points to MediaMTX)
  const channels = await getChannels()
  const ch = channels.find(c => c.id === channelId)
  if (ch?.streamUrl) return ch.streamUrl
  return getChannelStreamUrl(channelId)
}

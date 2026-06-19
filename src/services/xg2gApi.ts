import type { Channel, EPGData } from '../types/xg2g'

const MEDIA_MTX_API = import.meta.env.VITE_MEDIA_MTX_API_URL || 'https://api.emergingstream.com'
const GUIDE_URL = import.meta.env.VITE_GUIDE_URL || 'https://guide.emergingstream.com'
const GUIDE_XMLTV_URL = import.meta.env.VITE_GUIDE_XMLTV_URL || '/api/guide/epg'
const IPTV_BASE = import.meta.env.VITE_IPTV_URL || 'https://iptv.emergingstream.com'

const HLS_PATHS: Record<string, string> = {
  ch_adntv: '/ch_adntv/index.m3u8',
  ch_zeeone: '/ch_zeeone/index.m3u8',
  ch_tr24: '/ch_tr24/index.m3u8',
}

type MediaMtxPath = {
  name: string
  ready?: boolean
  available?: boolean
  online?: boolean
  tracks2?: Array<{ codec?: string; codecProps?: { width?: number; height?: number } }>
}

type XmltvChannel = {
  id: string
  name: string
  logo?: string
}

const CACHE_TTL = 30 * 60 * 1000

let channelCache: { data: Channel[]; ts: number } | null = null
let epgCache: { data: EPGData; ts: number } | null = null

function publicizeThreadfinUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  return url.replace('http://127.0.0.1:34400', GUIDE_URL.replace(/\/$/, ''))
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

function cleanKey(value: string): string {
  return normalizeText(value)
    .replace(/^ch/, '')
    .replace(/(720p|1080p|480p|360p|2160p|4k|geoblocked|not247|francais|french)/g, '')
}

function humanizePathName(name: string): string {
  return name
    .replace(/^ch_/, '')
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function findXmlChannel(pathName: string, xmlChannels: XmltvChannel[]): XmltvChannel | undefined {
  const key = cleanKey(pathName)
  return xmlChannels.find(channel => {
    const channelKey = cleanKey(channel.name)
    return channelKey === key || channelKey.includes(key) || key.includes(channelKey)
  })
}

function pathOrder(name: string): number {
  const known = Object.keys(HLS_PATHS)
  const index = known.indexOf(name)
  return index >= 0 ? index : 1000 + name.localeCompare(name)
}

function parseXmltvChannels(text: string): XmltvChannel[] {
  const doc = new DOMParser().parseFromString(text, 'text/xml')
  return Array.from(doc.querySelectorAll('channel'))
    .map(channelNode => {
      const id = channelNode.getAttribute('id') || ''
      const name = channelNode.querySelector('display-name')?.textContent?.trim() || ''
      const logo = publicizeThreadfinUrl(channelNode.querySelector('icon')?.getAttribute('src'))
      return { id, name, logo }
    })
    .filter(channel => channel.id && channel.name)
}

function buildXmltvIdMap(paths: MediaMtxPath[], xmlChannels: XmltvChannel[]): Record<string, string> {
  const map: Record<string, string> = {}
  paths.forEach(path => {
    const xmlChannel = findXmlChannel(path.name, xmlChannels)
    if (xmlChannel) map[xmlChannel.id] = path.name
  })
  return map
}

async function fetchTimeout(url: string, ms = 15000): Promise<Response> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, { signal: ctrl.signal })
  } finally {
    clearTimeout(t)
  }
}

async function getMediaMtxPaths(): Promise<MediaMtxPath[]> {
  try {
    const res = await fetchTimeout(`${MEDIA_MTX_API}/v3/paths/list`)
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data?.items) ? data.items : []
  } catch {
    return []
  }
}

async function getXmltvText(): Promise<string> {
  const res = await fetchTimeout(GUIDE_XMLTV_URL, 20000)
  if (!res.ok) throw new Error('xmltv fetch failed')
  return res.text()
}

function parseXmltvDate(dt: string): string {
  const m = dt.trim().match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\s*([+-]\d{2}):?(\d{2})$/)
  if (!m) return new Date().toISOString()
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${m[7]}:${m[8]}`
}

function parseXMLTV(text: string, xmlIdToMediaId: Record<string, string>): EPGData {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(text, 'text/xml')
    const result: EPGData = {}

    doc.querySelectorAll('programme').forEach(prog => {
      const rawChannel = prog.getAttribute('channel') || ''
      const channelId = xmlIdToMediaId[rawChannel] || rawChannel
      const start = parseXmltvDate(prog.getAttribute('start') || '')
      const stop = parseXmltvDate(prog.getAttribute('stop') || '')
      const title = prog.querySelector('title')?.textContent || ''
      const desc = prog.querySelector('desc')?.textContent || ''

      if (!result[channelId]) result[channelId] = []
      result[channelId].push({ channelId, title, description: desc, start, stop })
    })
    return result
  } catch {
    return {}
  }
}

export async function getChannels(): Promise<Channel[]> {
  if (channelCache && Date.now() - channelCache.ts < CACHE_TTL) return channelCache.data

  try {
    const paths = await getMediaMtxPaths()
    let xmlText = ''
    try {
      xmlText = await getXmltvText()
    } catch {
      xmlText = ''
    }
    const xmlChannels = parseXmltvChannels(xmlText)

    const channels = paths
      .filter(path => HLS_PATHS[path.name])
      .sort((a, b) => pathOrder(a.name) - pathOrder(b.name))
      .map(path => {
        const xmlChannel = findXmlChannel(path.name, xmlChannels)
        return {
          id: path.name,
          name: xmlChannel?.name || humanizePathName(path.name),
          logo: xmlChannel?.logo,
          group: 'Live TV',
          streamUrl: `${IPTV_BASE}${HLS_PATHS[path.name] ?? `/${path.name}/index.m3u8`}`,
        }
      })

    if (channels.length > 0) channelCache = { data: channels, ts: Date.now() }
    return channels.length > 0 ? channels : (channelCache?.data ?? [])
  } catch {
    return channelCache?.data ?? []
  }
}

export async function getEPG(): Promise<EPGData> {
  if (epgCache && Date.now() - epgCache.ts < CACHE_TTL) return epgCache.data

  try {
    const [paths, xmlText] = await Promise.all([getMediaMtxPaths(), getXmltvText()])
    const xmlChannels = parseXmltvChannels(xmlText)
    const xmlIdToMediaId = buildXmltvIdMap(paths, xmlChannels)
    const data = parseXMLTV(xmlText, xmlIdToMediaId)
    if (Object.keys(data).length > 0) epgCache = { data, ts: Date.now() }
    return Object.keys(data).length > 0 ? data : (epgCache?.data ?? {})
  } catch {
    return epgCache?.data ?? {}
  }
}

export async function getChannelEPG(channelId: string): Promise<EPGData> {
  const all = await getEPG()
  return all[channelId] ? { [channelId]: all[channelId] } : {}
}

export function getChannelStreamUrl(channelId: string): string {
  return `${IPTV_BASE}${HLS_PATHS[channelId] ?? `/${channelId}/index.m3u8`}`
}

export async function openChannelStream(channelId: string): Promise<string> {
  const channels = await getChannels()
  const ch = channels.find(c => c.id === channelId)
  if (ch?.streamUrl) return ch.streamUrl
  return getChannelStreamUrl(channelId)
}

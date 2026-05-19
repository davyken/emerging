import axios from 'axios'
import type { Channel, EPGData } from '../types/xg2g'

const BASE = import.meta.env.VITE_XG2G_URL

const client = axios.create({ baseURL: BASE })

export async function getChannels(): Promise<Channel[]> {
  const res = await client.get<Channel[]>('/api/channels')
  return res.data
}

export async function getEPG(): Promise<EPGData> {
  const res = await client.get<EPGData>('/api/epg')
  return res.data
}

export function getChannelStreamUrl(channelId: string): string {
  return `${BASE}/stream/channel/${channelId}.m3u8`
}

import axios from 'axios'
import type { Channel, EPGData } from '../types/xg2g'

const BASE = import.meta.env.VITE_XG2G_URL
const API_KEY = import.meta.env.VITE_API_KEY

const client = axios.create({ baseURL: BASE })

export async function getChannels(): Promise<Channel[]> {
  try {
    const res = await client.get(`/LiveTv/Channels?api_key=${API_KEY}`)
    if (!res.data || !res.data.Items) return []
    return res.data.Items.map((item: any) => ({
      id: item.Id,
      name: item.Name,
      group: item.Tags?.[0] || 'Général',
      streamUrl: getChannelStreamUrl(item.Id),
      logo: item.ImageTags?.Primary ? `${BASE}/Items/${item.Id}/Images/Primary?api_key=${API_KEY}` : ''
    }))
  } catch {
    return []
  }
}

export async function getEPG(): Promise<EPGData> {
  try {
    const res = await client.get(`/LiveTv/Programs?api_key=${API_KEY}&HasAired=false&limit=1000`)
    if (!res.data || !res.data.Items) return {}
    
    const epgData: EPGData = {}
    res.data.Items.forEach((prog: any) => {
      const channelId = prog.ChannelId
      if (!epgData[channelId]) epgData[channelId] = []
      epgData[channelId].push({
        channelId,
        title: prog.Name,
        description: prog.Overview || '',
        start: prog.StartDate,
        stop: prog.EndDate
      })
    })
    return epgData
  } catch {
    return {}
  }
}

export function getChannelStreamUrl(channelId: string): string {
  const playSessionId = crypto.randomUUID()
  return `${BASE}/Videos/${channelId}/master.m3u8?api_key=${API_KEY}&MediaSourceId=${channelId}&PlaySessionId=${playSessionId}`
}

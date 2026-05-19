export interface Channel {
  id: string
  name: string
  logo?: string
  group?: string
  streamUrl: string
}

export interface EPGProgram {
  channelId: string
  title: string
  description?: string
  start: string
  stop: string
}

export interface EPGData {
  [channelId: string]: EPGProgram[]
}

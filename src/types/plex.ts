export interface PlexMediaContainer {
  MediaContainer: {
    size: number
    Directory?: PlexLibrary[]
    Metadata?: PlexMedia[]
  }
}

export interface PlexLibrary {
  key: string
  type: 'movie' | 'show' | 'artist'
  title: string
  art: string
  thumb: string
}

export interface PlexMedia {
  ratingKey: string
  key: string
  title: string
  type: 'movie' | 'show' | 'episode'
  summary: string
  rating?: number
  audienceRating?: number
  year?: number
  duration?: number
  thumb?: string
  art?: string
  addedAt: number
  updatedAt: number
  Genre?: { tag: string }[]
  Director?: { tag: string }[]
  Role?: { tag: string; role?: string; thumb?: string }[]
  Media?: PlexMediaFile[]
  viewOffset?: number
  viewCount?: number
  leafCount?: number
  viewedLeafCount?: number
  Children?: { size: number; Metadata: PlexMedia[] }
}

export interface PlexMediaFile {
  id: number
  duration: number
  bitrate: number
  width: number
  height: number
  videoResolution: string
  Part: PlexPart[]
}

export interface PlexPart {
  id: number
  key: string
  duration: number
  file: string
  size: number
}

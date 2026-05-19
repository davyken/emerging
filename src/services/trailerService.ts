// YouTube trailer IDs for mock movies (mapped by ratingKey)
const TRAILER_MAP: Record<string, string> = {
  'demo': 'Way9lt7lLjE',   // Dune Part Two
  'f1':   'zSWdZVtXT7E',   // Interstellar  (Stellar Void)
  'f2':   'gCcx85zbxz4',   // Blade Runner 2049 (Midnight Echoes)
  'f3':   'TcMBFSGVi1c',   // Avengers Endgame (Velocity Prime)
  'f4':   'tFMo3UJ4B4g',   // Arrival (Ancient Relics)
  'f5':   'EoQuVnKhxaM',   // Ex Machina (The Algorithm)
  'f6':   'mqqft2x_Aa4',   // The Batman (Red Horizon)
  'f7':   'Way9lt7lLjE',   // Dune Part Two (The Threshold)
  'f8':   'OiTiKOy59o4',   // Gravity (Dusk Drifter)
  'f9':   'a8Gx8wiNbs8',   // Avatar The Way of Water (Orbital Ones)
  'f10':  'hEJnMQG9ev8',   // Mad Max Fury Road (Shadow Protocol)
  'f11':  'gCcx85zbxz4',   // Blade Runner (Neon Requiem)
  'f12':  '0Q47bCOHgBA',   // A Quiet Place (Echo Chamber)
  'f13':  'TcMBFSGVi1c',   // Endgame (Cascade Effect)
  'f14':  'EoQuVnKhxaM',   // Ex Machina (Fractured Sky)
  'f15':  'zSWdZVtXT7E',   // Interstellar (Last Signal)
  'f16':  'Way9lt7lLjE',   // Dune (Void Runner)
  's1':   'eFDa_Ahb40Y',   // Foundation (Kairo Chronicles)
  's2':   'gCcx85zbxz4',   // Blade Runner (Midnight Protocol)
  's3':   'tFMo3UJ4B4g',   // Arrival (Urban Echoes)
  's4':   'Way9lt7lLjE',   // Dune (Void Station)
  's5':   'mqqft2x_Aa4',   // Batman (Red Lagos)
  's6':   'EoQuVnKhxaM',   // Ex Machina (The Network)
}

const FALLBACK_IDS = Object.values(TRAILER_MAP)

// Get a YouTube trailer ID for any ratingKey.
// For unknown keys (real Plex content), deterministically picks from the fallback pool.
export function getTrailerYouTubeId(ratingKey: string): string {
  if (TRAILER_MAP[ratingKey]) return TRAILER_MAP[ratingKey]
  const hash = ratingKey.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return FALLBACK_IDS[hash % FALLBACK_IDS.length]
}

// Build the embeddable YouTube URL
export function buildYouTubeEmbedUrl(videoId: string, autoplay = false): string {
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    controls: '1',
    ...(autoplay ? { autoplay: '1' } : {}),
  })
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params}`
}

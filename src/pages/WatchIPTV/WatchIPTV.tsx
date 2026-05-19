import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Hls from 'hls.js'
import { getChannels, getEPG, getChannelStreamUrl } from '../../services/xg2gApi'
import type { Channel, EPGProgram } from '../../types/xg2g'

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatSecs(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  const mm = String(m).padStart(2, '0')
  const ss = String(sec).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

const MOCK_CHANNEL: Channel = {
  id: 'hbo', name: 'HBO Premium HD', group: 'Films', logo: '', streamUrl: '#',
}

const NOW = Date.now()
const MOCK_SCHEDULE: EPGProgram[] = [
  { channelId: 'hbo', title: 'House of the Dragon', description: 'In the aftermath of her first dragon-riding experience, Rhaenyra finds herself at a crossroads in the Red...', start: new Date(NOW - 48 * 60000).toISOString(), stop: new Date(NOW + 27 * 60000).toISOString() },
  { channelId: 'hbo', title: 'The Last of Us', description: 'S1 | Episode 5: Long, Long, Long Time', start: new Date(NOW + 27 * 60000).toISOString(), stop: new Date(NOW + 87 * 60000).toISOString() },
  { channelId: 'hbo', title: 'Succession', description: 'S4 | Episode 1: The Munsters', start: new Date(NOW + 87 * 60000).toISOString(), stop: new Date(NOW + 132 * 60000).toISOString() },
  { channelId: 'hbo', title: 'The Batman (2022)', description: 'Movie | Action / Crime', start: new Date(NOW + 132 * 60000).toISOString(), stop: new Date(NOW + 252 * 60000).toISOString() },
]

const QUALITY_OPTIONS = ['Auto', '1080p', '720p', '480p', '360p']

export function WatchIPTV() {
  const { channelId } = useParams<{ channelId: string }>()
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [channel, setChannel] = useState<Channel>(MOCK_CHANNEL)
  const [schedule, setSchedule] = useState<EPGProgram[]>(MOCK_SCHEDULE)
  const [playing, setPlaying] = useState(true)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [quality, setQuality] = useState('1080p')
  const [showControls, setShowControls] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [chs, epg] = await Promise.all([getChannels(), getEPG()])
        const found = chs.find((c) => c.id === channelId)
        if (found) setChannel(found)
        if (channelId && epg[channelId]) setSchedule(epg[channelId])
      } catch {}
    }
    load()
  }, [channelId])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const src = getChannelStreamUrl(channelId ?? 'demo')

    if (Hls.isSupported()) {
      const hls = new Hls()
      hlsRef.current = hls
      hls.loadSource(src)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => null))
    } else {
      video.src = src
      video.play().catch(() => null)
    }
    return () => { hlsRef.current?.destroy(); hlsRef.current = null }
  }, [channelId])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    return () => {
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
    }
  }, [])

  function resetHideTimer() {
    setShowControls(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setShowControls(false), 3000)
  }

  function togglePlay() {
    const video = videoRef.current
    if (!video) return
    playing ? video.pause() : video.play()
  }

  const nowPlaying = schedule.find((p) => {
    const n = Date.now()
    return new Date(p.start).getTime() <= n && new Date(p.stop).getTime() >= n
  }) ?? schedule[0]

  const upcoming = schedule.filter((p) => new Date(p.start).getTime() > Date.now())
  const liveProgress = nowPlaying
    ? Math.max(0, Math.min(100,
        (Date.now() - new Date(nowPlaying.start).getTime()) /
        (new Date(nowPlaying.stop).getTime() - new Date(nowPlaying.start).getTime()) * 100
      ))
    : 0

  const liveTotal = nowPlaying
    ? (new Date(nowPlaying.stop).getTime() - new Date(nowPlaying.start).getTime()) / 1000
    : 4500
  const liveElapsed = nowPlaying
    ? (Date.now() - new Date(nowPlaying.start).getTime()) / 1000
    : 2892

  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden select-none"
      style={{ background: '#000', cursor: showControls ? 'default' : 'none' }}
      onMouseMove={resetHideTimer}
      onClick={togglePlay}
    >
      {/* Video */}
      <video ref={videoRef} className="w-full h-full object-contain" playsInline />

      {/* Demo background */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 100% 60% at 40% 50%, #003a3a 0%, #001a1a 40%, #000a0a 100%)', zIndex: 0 }} />

      {/* Back button */}
      <div
        className="absolute top-4 left-6 z-20 transition-opacity duration-300"
        style={{ opacity: showControls ? 1 : 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <Link to="/tv" className="flex items-center gap-2 text-sm font-medium text-white hover:text-gray-300 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5 M12 5l-7 7 7 7" /></svg>
          Back to TV Guide
        </Link>
      </div>

      {/* Right schedule panel */}
      <div
        className="absolute top-4 right-4 bottom-20 z-20 rounded-xl overflow-hidden transition-opacity duration-300"
        style={{ width: '240px', background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)', opacity: showControls ? 1 : 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Now playing header */}
        <div className="p-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(255,30,30,0.2)', color: '#ff5555', border: '1px solid rgba(255,30,30,0.3)' }}>
              ● LIVE
            </span>
            <span className="text-xs font-semibold text-white">{channel.name}</span>
          </div>
          <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: '#555' }}>Now Playing</p>
          <p className="text-xs font-bold text-white mb-0.5">{nowPlaying?.title ?? 'House of the Dragon'}</p>
          <p className="text-[10px]" style={{ color: '#666' }}>
            {nowPlaying ? `${formatTime(nowPlaying.start)} - ${formatTime(nowPlaying.stop)}` : '21:00 - 23:15'}
          </p>
          {/* Live progress */}
          <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div className="h-full rounded-full" style={{ width: `${liveProgress}%`, background: 'var(--color-gold)' }} />
          </div>
        </div>

        {/* Schedule */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100% - 120px)' }}>
          {upcoming.map((prog, i) => {
            const dur = Math.round((new Date(prog.stop).getTime() - new Date(prog.start).getTime()) / 60000)
            return (
              <div key={i} className="px-3 py-3 cursor-pointer hover:bg-white/5 transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs font-medium text-white" style={{ color: '#888' }}>{formatTime(prog.start)}</span>
                  <span className="text-[10px]" style={{ color: '#555' }}>{dur} min</span>
                </div>
                <p className="text-xs font-semibold text-white">{prog.title}</p>
                {prog.description && <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: '#555' }}>{prog.description}</p>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom left: channel info */}
      <div
        className="absolute bottom-20 left-6 z-20 transition-opacity duration-300"
        style={{ opacity: showControls ? 1 : 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-end gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: '#700', color: 'white' }}>
            {channel.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold text-white">{nowPlaying?.title ?? 'House of the Dragon'}</p>
            <p className="text-xs" style={{ color: '#888' }}>Episode 5 • We Light the Way</p>
            {nowPlaying?.description && (
              <p className="text-[10px] max-w-xs line-clamp-2 mt-0.5" style={{ color: '#666' }}>{nowPlaying.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 pb-4 transition-opacity duration-300"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)', opacity: showControls ? 1 : 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress */}
        <div className="px-6 mb-3">
          <div className="relative h-1 rounded-full cursor-pointer group" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${liveProgress}%`, background: 'var(--color-gold)' }} />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center px-6 gap-4">
          <button onClick={togglePlay} className="text-white hover:text-gray-300 transition-colors">
            {playing
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
            }
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => { const v = videoRef.current; if(v){ v.muted=!v.muted; setMuted(v.muted) }}} className="text-gray-400 hover:text-white transition-colors">
              {muted ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>}
            </button>
            <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
              onChange={(e) => { const v = Number(e.target.value); setVolume(v); if(videoRef.current){ videoRef.current.volume = v; videoRef.current.muted = v===0 }}}
              className="w-16 h-1 cursor-pointer" style={{ accentColor: 'white' }}
            />
          </div>

          <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {formatSecs(liveElapsed)} / {formatSecs(liveTotal)}
          </span>

          <div className="flex-1" />

          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            className="text-xs px-2 py-1 rounded outline-none"
            style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            {QUALITY_OPTIONS.map(q => <option key={q} value={q}>{q}</option>)}
          </select>

          <button className="text-xs font-medium px-3 py-1 rounded transition-colors" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.15)' }}>
            More Channels
          </button>

          <button className="text-gray-400 hover:text-white transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" /></svg>
          </button>

          <button onClick={() => containerRef.current?.requestFullscreen?.()} className="text-gray-400 hover:text-white transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></svg>
          </button>
        </div>
      </div>
    </div>
  )
}

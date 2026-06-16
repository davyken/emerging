import { useEffect, useRef, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Hls from 'hls.js'
import { getMovieDetail, getShowDetail } from '../../services/tmdbApi'

const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

function formatTime(s: number): string {
  if (!s || isNaN(s)) return '00:00'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const mm = String(m).padStart(2, '0')
  const ss = String(Math.floor(s % 60)).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

function qualityLabel(height: number): string {
  if (height >= 1080) return '1080p'
  if (height >= 720) return '720p'
  if (height >= 480) return '480p'
  if (height >= 420) return '420p'
  if (height >= 360) return '360p'
  if (height >= 240) return '240p'
  if (height > 0) return `${height}p`
  return 'Auto'
}

type SettingsView = 'root' | 'speed' | 'quality'

export function Watch() {
  const { type, tmdbId } = useParams<{ type: string; tmdbId: string }>()
  const navigate = useNavigate()
  const mediaType = type === 'tv' ? 'tv' : 'movie'

  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

// Data
   const [title, setTitle] = useState('')
   const [loading, setLoading] = useState(true)
   const [jellyffinId, setJellyfinId] = useState<string | null>(null)

  // Playback state
  const [playing, setPlaying] = useState(true)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [settingsView, setSettingsView] = useState<SettingsView>('root')
  const [showControls, setShowControls] = useState(true)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)

  // Quality state
  const [qualityLevels, setQualityLevels] = useState<{ height: number; index: number }[]>([])
  const [currentQuality, setCurrentQuality] = useState<number>(-1) // -1 = Auto
  const [liveQuality, setLiveQuality] = useState<number>(-1) // actual auto-resolved level

// ── 1. Fetch detail ──────────────────────────────────────────────────────────
   useEffect(() => {
     if (!tmdbId) return
     setLoading(true)
     setTitle('')
     setJellyfinId(null)
     const fetch = mediaType === 'movie' ? getMovieDetail(tmdbId) : getShowDetail(tmdbId)
     fetch.then(d => {
       setTitle('title' in d ? d.title : d.name)
       setJellyfinId(d.id)
     }).catch(() => {}).finally(() => setLoading(false))
   }, [tmdbId, mediaType])

// ── 2. Stream sources (jellyfin.emergingstream.com) ──────────────────────────
   const streamSrc = useMemo(() => {
     if (!jellyffinId) return null
     const base = import.meta.env.VITE_JELLYFIN_URL || 'https://jellyfin.emergingstream.com'
     const key  = import.meta.env.VITE_API_KEY || ''
     const id   = jellyffinId
      // Use the HLS master playlist so hls.js can expose all variant levels.
      return {
        hls:    `${base}/Videos/${id}/master.m3u8?api_key=${key}`,
        direct: `${base}/Videos/${id}/stream.mp4?api_key=${key}&static=true`,
      }
   }, [jellyffinId])

  // ── 3. HLS setup (with direct-URL fallback) ──────────────────────────────────
  useEffect(() => {
    const video = videoRef.current
    if (!video || !streamSrc) return

    // Clean up previous instance
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }
    setQualityLevels([])
    setCurrentQuality(-1)
    setLiveQuality(-1)

    const onTime = () => setCurrentTime(video.currentTime)
    const onDuration = () => setDuration(video.duration)
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    video.addEventListener('timeupdate', onTime)
    video.addEventListener('durationchange', onDuration)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)

    if (Hls.isSupported()) {
      const hls = new Hls({ startLevel: -1, capLevelToPlayerSize: true })
      hlsRef.current = hls
      hls.loadSource(streamSrc.hls)
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        const levels = data.levels
          .map((l, i) => ({ height: l.height, index: i }))
          .sort((a, b) => b.height - a.height)
        setQualityLevels(levels)
        if (levels[0]) {
          hls.currentLevel = levels[0].index
          setCurrentQuality(levels[0].index)
        }
        video.play().catch(() => null)
      })

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        setLiveQuality(data.level)
      })

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          // HLS not available from server — fall back to direct file
          hls.destroy()
          hlsRef.current = null
          setQualityLevels([])
          video.src = streamSrc.direct
          video.play().catch(() => null)
        }
      })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS (Safari) — no programmatic quality selection
      video.src = streamSrc.hls
      video.play().catch(() => null)
    } else {
      video.src = streamSrc.direct
      video.play().catch(() => null)
    }

    return () => {
      video.removeEventListener('timeupdate', onTime)
      video.removeEventListener('durationchange', onDuration)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }
    }
  }, [streamSrc])

  // ── 4. Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const video = videoRef.current
      if (!video) return
      switch (e.code) {
        case 'Space': e.preventDefault(); playing ? video.pause() : video.play(); break
        case 'ArrowRight': video.currentTime = Math.min(video.currentTime + 10, duration); break
        case 'ArrowLeft': video.currentTime = Math.max(video.currentTime - 10, 0); break
        case 'KeyM': video.muted = !video.muted; setMuted(v => !v); break
        case 'Escape': setShowSettings(false); break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [playing, duration])

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function resetHideTimer() {
    setShowControls(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => { setShowControls(false); setShowSettings(false) }, 4000)
  }

  function togglePlay() {
    const video = videoRef.current
    if (!video) return
    playing ? video.pause() : video.play()
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const video = videoRef.current
    if (!video || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    video.currentTime = ((e.clientX - rect.left) / rect.width) * duration
  }

  function changeSpeed(s: number) {
    setPlaybackSpeed(s)
    if (videoRef.current) videoRef.current.playbackRate = s
    setShowSettings(false); setSettingsView('root')
  }

  function changeQuality(level: number) {
    const hls = hlsRef.current
    if (!hls) return
    hls.currentLevel = level
    setCurrentQuality(level)
    setShowSettings(false); setSettingsView('root')
  }

  function cycleQuality() {
    if (qualityLevels.length === 0) return
    const fixedLevels = qualityLevels.map(l => l.index)
    const currentIndex = fixedLevels.indexOf(currentQuality)
    const nextLevel = currentIndex >= 0
      ? fixedLevels[(currentIndex + 1) % fixedLevels.length]
      : fixedLevels[0]
    changeQuality(nextLevel)
  }

  // Label shown next to "Quality" in the root settings menu
  const qualityBadge = currentQuality === -1
    ? liveQuality >= 0 && qualityLevels[0]
      ? `Auto (${qualityLabel(qualityLevels.find(l => l.index === liveQuality)?.height ?? 0)})`
      : 'Auto'
    : qualityLabel(qualityLevels.find(l => l.index === currentQuality)?.height ?? 0)

  const qualityButtonText = qualityBadge.replace(/^Auto \(([^)]+)\)$/, '$1').replace(/^Auto$/, 'Auto')

  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden select-none"
      style={{ background: '#000', cursor: showControls ? 'default' : 'none' }}
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
      onClick={togglePlay}
    >
      <video ref={videoRef} className="w-full h-full object-contain" playsInline />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: '#000' }}>
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-gold)', borderTopColor: 'transparent' }} />
        </div>
      )}

      {/* Top bar */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center px-3 sm:px-6 h-12 sm:h-14 transition-opacity duration-300 z-20"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.85), transparent)', opacity: showControls ? 1 : 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={() => navigate(-1)} className="flex items-center justify-center w-8 h-8 rounded-lg mr-3 flex-shrink-0 hover:bg-white/10 transition-colors" style={{ color: 'rgba(255,255,255,0.8)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
        </button>
        <span className="text-xs sm:text-sm font-semibold text-white truncate max-w-[150px] sm:max-w-sm mr-2">{title}</span>
        <div className="flex-1" />
      </div>

      {/* Center pause indicator */}
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="flex gap-3">
            <div className="w-4 rounded-sm" style={{ height: '40px', background: 'rgba(255,255,255,0.9)' }} />
            <div className="w-4 rounded-sm" style={{ height: '40px', background: 'rgba(255,255,255,0.9)' }} />
          </div>
        </div>
      )}

      {/* ── Settings panel ─────────────────────────────────────────────────── */}
      {showSettings && (
        <div
          className="absolute right-3 sm:right-6 bottom-16 sm:bottom-[5.5rem] rounded-xl z-30 overflow-hidden"
          style={{ width: '240px', background: 'rgba(15,15,15,0.97)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.7)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Root menu */}
          {settingsView === 'root' && (
            <>
              <div className="px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-xs font-semibold text-white">Settings</p>
              </div>

              {/* Quality row — always visible */}
              <button onClick={() => setSettingsView('quality')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
                  </svg>
                  <span className="text-xs text-white">Quality</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: 'var(--color-gold)' }}>{qualityBadge}</span>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                </div>
              </button>

              {/* Speed row */}
              <button onClick={() => setSettingsView('speed')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  <span className="text-xs text-white">Speed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: '#888' }}>{playbackSpeed === 1 ? 'Normal' : `${playbackSpeed}x`}</span>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                </div>
              </button>
            </>
          )}

{/* Quality sub-panel */}
           {settingsView === 'quality' && (
             <>
               <button onClick={() => setSettingsView('root')} className="flex items-center gap-2 px-4 py-2.5 w-full hover:bg-white/5 transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                 <p className="text-xs font-semibold text-white">Quality</p>
               </button>

               {/* Auto (always available) */}
               <button onClick={() => changeQuality(-1)} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors">
                 <div className="flex flex-col items-start">
                   <span className="text-xs text-white">Auto</span>
                   {liveQuality >= 0 && (
                     <span className="text-[10px]" style={{ color: '#666' }}>
                       {qualityLabel(qualityLevels.find(l => l.index === liveQuality)?.height ?? 0)}
                     </span>
                   )}
                 </div>
                 {currentQuality === -1 && (
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                 )}
               </button>

               {/* Fixed quality levels (only when HLS provides them) */}
               {qualityLevels.length > 0 ? qualityLevels.map((lvl) => (
                 <button key={lvl.index} onClick={() => changeQuality(lvl.index)} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors">
                   <span className="text-xs text-white">{qualityLabel(lvl.height)}</span>
                   {currentQuality === lvl.index && (
                     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                   )}
                 </button>
               )) : (
                 <div className="px-4 py-3">
                   <span className="text-[10px]" style={{ color: '#666' }}>Quality selection available for HLS streams</span>
                 </div>
               )}
             </>
           )}

          {/* Speed sub-panel */}
          {settingsView === 'speed' && (
            <>
              <button onClick={() => setSettingsView('root')} className="flex items-center gap-2 px-4 py-2.5 w-full hover:bg-white/5 transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                <p className="text-xs font-semibold text-white">Speed</p>
              </button>
              {PLAYBACK_SPEEDS.map((s) => (
                <button key={s} onClick={() => changeSpeed(s)} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors">
                  <span className="text-xs text-white">{s === 1 ? 'Normal' : `${s}x`}</span>
                  {playbackSpeed === s && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>}
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {/* ── Bottom controls ───────────────────────────────────────────────────── */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 transition-opacity duration-300"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92), transparent)', opacity: showControls ? 1 : 0, paddingBottom: '0.75rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div className="px-3 sm:px-6 mb-2 sm:mb-3">
          <div className="relative h-1 hover:h-1.5 rounded-full cursor-pointer group transition-all" style={{ background: 'rgba(255,255,255,0.25)' }} onClick={seek}>
            <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%', background: 'var(--color-gold)' }} />
            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: duration ? `calc(${(currentTime / duration) * 100}% - 6px)` : '0', background: 'var(--color-gold)' }} />
          </div>
        </div>

        <div className="flex items-center px-3 sm:px-6 gap-2 sm:gap-4">
          {/* Play/Pause */}
          <button onClick={togglePlay} className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-white hover:bg-white/10 transition-colors flex-shrink-0">
            {playing
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
            }
          </button>

          {/* Volume */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={() => { const v = videoRef.current; if (v) { v.muted = !v.muted; setMuted(v.muted) }}} className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0">
              {muted || volume === 0
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
              }
            </button>
            <input type="range" min={0} max={1} step={0.02} value={muted ? 0 : volume}
              onChange={(e) => { const v = Number(e.target.value); setVolume(v); if (videoRef.current) { videoRef.current.volume = v; videoRef.current.muted = v === 0 }}}
              className="hidden sm:block h-1 cursor-pointer" style={{ accentColor: 'var(--color-gold)', width: '72px' }}
            />
          </div>

          {/* Time */}
          <span className="text-xs font-mono flex-shrink-0" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {formatTime(currentTime)} / {formatTime(duration || 0)}
          </span>

          <div className="flex-1" />

          {/* Download button */}
          {streamSrc && (
            <a
              href={streamSrc.direct}
              download={title || 'video'}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
              title="Download"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </a>
          )}

          {qualityLevels.length > 0 && (
            <button onClick={(e) => { e.stopPropagation(); cycleQuality() }}
              className="flex items-center justify-center min-w-[54px] h-8 sm:h-9 rounded-lg flex-shrink-0 hover:bg-white/10 transition-colors"
              style={{ color: 'var(--color-gold)' }}
              title="Change quality"
            >
              <span className="text-[10px] font-semibold">{qualityButtonText}</span>
            </button>
          )}

          {/* Settings button */}
          <button onClick={(e) => { e.stopPropagation(); setSettingsView('root'); setShowSettings(v => !v) }}
            className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex-shrink-0 hover:bg-white/10 transition-colors"
            style={{ color: showSettings ? 'var(--color-gold)' : 'rgba(255,255,255,0.65)', background: showSettings ? 'rgba(255,255,255,0.05)' : undefined }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
            </svg>
          </button>

          {/* Fullscreen */}
          <button onClick={() => containerRef.current?.requestFullscreen?.()} className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></svg>
          </button>
        </div>
      </div>
    </div>
  )
}

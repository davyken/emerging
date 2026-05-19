import { useEffect, useRef, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Hls from 'hls.js'
import { getMovieDetail, getShowDetail, pickBestTrailer, tmdbImg } from '../../services/tmdbApi'
import { buildYouTubeEmbedUrl } from '../../services/trailerService'
import type { TmdbVideo } from '../../types/tmdb'

const HLS_DEMO_STREAM = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

function formatTime(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const mm = String(m).padStart(2, '0')
  const ss = String(Math.floor(s % 60)).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

type QualityLevel = { label: string; level: number; height: number }
type SettingsView = 'root' | 'quality' | 'speed'

export function Watch() {
  const { type, tmdbId } = useParams<{ type: string; tmdbId: string }>()
  const navigate = useNavigate()
  const mediaType = type === 'tv' ? 'tv' : 'movie'

  const videoRef    = useRef<HTMLVideoElement>(null)
  const hlsRef      = useRef<Hls | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hideTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const badgeTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)

  // TMDB data
  const [title, setTitle]         = useState('')
  const [backdrop, setBackdrop]   = useState<string | null>(null)
  const [videos, setVideos]       = useState<TmdbVideo[]>([])
  const [loading, setLoading]     = useState(true)

  // Mode toggle: trailer (YouTube) vs quality demo (HLS)
  const [hlsQualityDemo, setHlsQualityDemo] = useState(false)

  // HLS playback state
  const [playing, setPlaying]         = useState(true)
  const [muted, setMuted]             = useState(false)
  const [volume, setVolume]           = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration]       = useState(0)
  const [qualities, setQualities]     = useState<QualityLevel[]>([])
  const [currentLevel, setCurrentLevel] = useState(-1)
  const [qualityBadge, setQualityBadge] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [settingsView, setSettingsView] = useState<SettingsView>('root')
  const [showControls, setShowControls] = useState(true)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)

  // ── 1. Fetch TMDB detail + videos ─────────────────────────────────────────
  useEffect(() => {
    if (!tmdbId) return
    setLoading(true)
    setVideos([])
    setTitle('')
    const id = Number(tmdbId)
    const fetch = mediaType === 'movie' ? getMovieDetail(id) : getShowDetail(id)
    fetch.then(d => {
      setTitle('title' in d ? d.title : d.name)
      setBackdrop(tmdbImg(d.backdrop_path, 'w1280'))
      const yt = (d.videos?.results ?? []).filter(v => v.site === 'YouTube')
      setVideos(yt)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [tmdbId, mediaType])

  // ── 2. Pick best trailer ──────────────────────────────────────────────────
  const bestTrailer = pickBestTrailer(videos)
  const isYouTubeMode = !hlsQualityDemo && (videos.length > 0 || loading)
  const youtubeEmbedUrl = bestTrailer && isYouTubeMode
    ? buildYouTubeEmbedUrl(bestTrailer.key, true)
    : null

  // ── 3. HLS demo stream ────────────────────────────────────────────────────
  const streamSrc = useMemo(() => hlsQualityDemo ? HLS_DEMO_STREAM : null, [hlsQualityDemo])

  // ── 4. Load HLS ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!streamSrc) return
    const video = videoRef.current
    if (!video) return
    hlsRef.current?.destroy()
    hlsRef.current = null
    setQualities([])
    setCurrentLevel(-1)

    if (Hls.isSupported()) {
      const hls = new Hls({ startLevel: -1, enableWorker: true })
      hlsRef.current = hls
      hls.loadSource(streamSrc)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setQualities(data.levels.map((l, i) => ({
          label: l.height ? `${l.height}p` : `${Math.round((l.bitrate || 0) / 1000)}kbps`,
          level: i, height: l.height ?? 0,
        })))
        video.play().catch(() => null)
      })
      hls.on(Hls.Events.LEVEL_SWITCHED, (_, d) => {
        setCurrentLevel(d.level)
        const lvl = hls.levels[d.level]
        if (lvl?.height) {
          setQualityBadge(`${lvl.height}p`)
          if (badgeTimer.current) clearTimeout(badgeTimer.current)
          badgeTimer.current = setTimeout(() => setQualityBadge(''), 2500)
        }
      })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamSrc
      video.play().catch(() => null)
    }
    return () => { hlsRef.current?.destroy(); hlsRef.current = null }
  }, [streamSrc])

  // ── 5. Video events ───────────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onTime     = () => setCurrentTime(video.currentTime)
    const onDuration = () => setDuration(video.duration)
    const onPlay     = () => setPlaying(true)
    const onPause    = () => setPlaying(false)
    video.addEventListener('timeupdate', onTime)
    video.addEventListener('durationchange', onDuration)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    return () => {
      video.removeEventListener('timeupdate', onTime)
      video.removeEventListener('durationchange', onDuration)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
    }
  }, [])

  // ── 6. Keyboard shortcuts (HLS mode only) ─────────────────────────────────
  useEffect(() => {
    if (isYouTubeMode) return
    function onKey(e: KeyboardEvent) {
      const video = videoRef.current
      if (!video) return
      switch (e.code) {
        case 'Space': e.preventDefault(); playing ? video.pause() : video.play(); break
        case 'ArrowRight': video.currentTime = Math.min(video.currentTime + 10, duration); break
        case 'ArrowLeft':  video.currentTime = Math.max(video.currentTime - 10, 0); break
        case 'KeyM': video.muted = !video.muted; setMuted(v => !v); break
        case 'Escape': setShowSettings(false); break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [playing, duration, isYouTubeMode])

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

  function changeQuality(level: number) {
    if (hlsRef.current) { hlsRef.current.currentLevel = level; setCurrentLevel(level) }
    setShowSettings(false); setSettingsView('root')
  }

  function changeSpeed(s: number) {
    setPlaybackSpeed(s)
    if (videoRef.current) videoRef.current.playbackRate = s
    setShowSettings(false); setSettingsView('root')
  }

  const activeQualityLabel = currentLevel === -1 ? 'Auto' : (qualities[currentLevel]?.label ?? 'Auto')

  if (loading) {
    return (
      <div className="flex items-center justify-center w-screen h-screen" style={{ background: '#000' }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-gold)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════
  //  YOUTUBE TRAILER MODE
  // ══════════════════════════════════════════════════════════════════
  if (isYouTubeMode) {
    if (!bestTrailer) {
      return (
        <div
          className="flex flex-col items-center justify-center w-screen h-screen gap-4"
          style={{ background: '#000', color: '#555' }}
        >
          {backdrop && <img src={backdrop} alt={title} className="absolute inset-0 w-full h-full object-cover opacity-20" />}
          <div className="relative z-10 flex flex-col items-center gap-4">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-sm text-white font-semibold">{title}</p>
            <p className="text-xs">No trailer available for this title.</p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
              >
                ← Back
              </button>
              <button
                onClick={() => setHlsQualityDemo(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ background: 'var(--color-gold)', color: '#000' }}
              >
                Watch Demo Stream
              </button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div
        ref={containerRef}
        className="relative w-screen h-screen overflow-hidden"
        style={{ background: '#000' }}
        onMouseMove={resetHideTimer}
        onTouchStart={resetHideTimer}
      >
        <iframe
          key={bestTrailer.key}
          src={youtubeEmbedUrl!}
          className="absolute inset-0 w-full h-full"
          style={{ border: 'none' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />

        {/* Top overlay */}
        <div
          className="absolute top-0 left-0 right-0 flex items-center px-3 sm:px-6 h-12 sm:h-14 z-20 transition-opacity duration-500 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)', opacity: showControls ? 1 : 0 }}
        >
          <div className="pointer-events-auto flex items-center w-full gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 hover:bg-white/15 transition-colors"
              style={{ color: 'rgba(255,255,255,0.9)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-semibold text-white truncate max-w-[150px] sm:max-w-xs">{title}</span>
              <span className="text-[10px] px-2 py-0.5 rounded flex-shrink-0" style={{ background: 'rgba(255,60,60,0.25)', color: '#ff7777', border: '1px solid rgba(255,60,60,0.3)' }}>
                TRAILER
              </span>
            </div>

            <div className="flex-1" />
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-3 sm:px-6 pb-3 sm:pb-4 z-20 transition-opacity duration-500 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)', opacity: showControls ? 1 : 0 }}
        >
          <div className="pointer-events-auto">
            <button
              onClick={() => setHlsQualityDemo(true)}
              className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: 'rgba(255,255,255,0.1)', color: '#ccc', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
              Test Quality Switching
            </button>
          </div>
          <div className="pointer-events-auto">
            <button
              onClick={() => containerRef.current?.requestFullscreen?.()}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/10 transition-colors"
              style={{ color: 'rgba(255,255,255,0.7)' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></svg>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════
  //  HLS PLAYER MODE (quality demo)
  // ══════════════════════════════════════════════════════════════════
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

      {/* Demo banner */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-1.5 rounded-lg pointer-events-none" style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--color-teal)' }} />
        <span className="text-[10px] text-white">Quality Demo — Big Buck Bunny (Mux HLS)</span>
      </div>

      {/* Quality badge */}
      {qualityBadge && (
        <div className="absolute top-16 right-4 sm:right-6 z-30 px-3 py-1.5 rounded-lg text-xs font-bold pointer-events-none" style={{ background: 'rgba(0,0,0,0.85)', color: 'var(--color-gold)', border: '1px solid rgba(201,168,76,0.4)', backdropFilter: 'blur(8px)' }}>
          {qualityBadge}
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

        <button
          onClick={(e) => { e.stopPropagation(); setHlsQualityDemo(false) }}
          className="ml-4 text-xs px-3 py-1 rounded-lg flex-shrink-0 transition-colors hover:bg-white/10"
          style={{ color: '#aaa', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          ← Trailer
        </button>
      </div>

      {/* Center pause */}
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="flex gap-3">
            <div className="w-4 rounded-sm" style={{ height: '40px', background: 'rgba(255,255,255,0.9)' }} />
            <div className="w-4 rounded-sm" style={{ height: '40px', background: 'rgba(255,255,255,0.9)' }} />
          </div>
        </div>
      )}

      {/* Settings panel */}
      {showSettings && (
        <div
          className="absolute right-3 sm:right-6 bottom-16 sm:bottom-[5.5rem] rounded-xl z-30 overflow-hidden max-h-[70vh] overflow-y-auto"
          style={{ width: '230px', background: 'rgba(15,15,15,0.97)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.7)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {settingsView === 'root' && (
            <>
              <div className="px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-xs font-semibold text-white">Settings</p>
              </div>
              <button onClick={() => setSettingsView('quality')} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-3">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
                  <span className="text-xs text-white">Quality</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: 'var(--color-gold)' }}>{activeQualityLabel}</span>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                </div>
              </button>
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
          {settingsView === 'quality' && (
            <>
              <button onClick={() => setSettingsView('root')} className="flex items-center gap-2 px-4 py-2.5 w-full hover:bg-white/5 transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                <p className="text-xs font-semibold text-white">Quality</p>
              </button>
              <button onClick={() => changeQuality(-1)} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors">
                <span className="text-xs text-white">Auto</span>
                {currentLevel === -1 && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>}
              </button>
              {[...qualities].reverse().map((q) => (
                <button key={q.level} onClick={() => changeQuality(q.level)} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white">{q.label}</span>
                    {q.height >= 1080 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(45,212,191,0.2)', color: 'var(--color-teal)' }}>HD</span>}
                  </div>
                  {currentLevel === q.level && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>}
                </button>
              ))}
              {qualities.length === 0 && <p className="px-4 py-3 text-xs" style={{ color: '#666' }}>Loading…</p>}
            </>
          )}
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

      {/* Bottom controls */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 transition-opacity duration-300"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92), transparent)', opacity: showControls ? 1 : 0, paddingBottom: '0.75rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-3 sm:px-6 mb-2 sm:mb-3">
          <div className="relative h-1 hover:h-1.5 rounded-full cursor-pointer group transition-all" style={{ background: 'rgba(255,255,255,0.25)' }} onClick={seek}>
            <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%', background: 'var(--color-gold)' }} />
            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: duration ? `calc(${(currentTime / duration) * 100}% - 6px)` : '0', background: 'var(--color-gold)' }} />
          </div>
        </div>
        <div className="flex items-center px-3 sm:px-6 gap-2 sm:gap-4">
          <button onClick={togglePlay} className="text-white hover:text-gray-300 transition-colors flex-shrink-0">
            {playing
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
            }
          </button>
          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={() => { const v = videoRef.current; if (v) { v.muted = !v.muted; setMuted(v.muted) }}} className="text-gray-400 hover:text-white transition-colors flex-shrink-0">
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
          <span className="text-xs font-mono flex-shrink-0" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {formatTime(currentTime)} / {formatTime(duration || 0)}
          </span>
          <div className="flex-1" />
          {qualities.length > 0 && (
            <span className="hidden sm:block text-[10px] font-semibold px-2 py-0.5 rounded cursor-pointer flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.08)', color: '#aaa', border: '1px solid rgba(255,255,255,0.1)' }}
              onClick={(e) => { e.stopPropagation(); setSettingsView('quality'); setShowSettings(true) }}
            >
              {activeQualityLabel}
            </span>
          )}
          <button onClick={(e) => { e.stopPropagation(); setSettingsView('root'); setShowSettings(v => !v) }}
            className="flex-shrink-0 transition-colors" style={{ color: showSettings ? 'var(--color-gold)' : 'rgba(255,255,255,0.65)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
            </svg>
          </button>
          <button onClick={() => containerRef.current?.requestFullscreen?.()} className="text-gray-400 hover:text-white transition-colors flex-shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></svg>
          </button>
        </div>
      </div>
    </div>
  )
}

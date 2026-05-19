import { useEffect, useRef, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Hls from 'hls.js'
import { getMediaDetail, getStreamUrl } from '../../services/plexApi'
import { useAuthStore } from '../../store/authStore'
import type { PlexMedia } from '../../types/plex'

// Public multi-bitrate HLS test stream (Big Buck Bunny, Mux)
const DEMO_STREAM = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'

const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

function formatTime(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  const mm = String(m).padStart(2, '0')
  const ss = String(sec).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

type QualityLevel = { label: string; level: number; height: number; bitrate: number }
type SettingsView = 'root' | 'quality' | 'speed'

export function Watch() {
  const { ratingKey } = useParams<{ ratingKey: string }>()
  const token = useAuthStore((s) => s.token) ?? ''
  const navigate = useNavigate()

  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const badgeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [media, setMedia] = useState<PlexMedia | null>(null)
  const [streamReady, setStreamReady] = useState(false)
  const [loading, setLoading] = useState(true)

  const [playing, setPlaying] = useState(true)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const [qualities, setQualities] = useState<QualityLevel[]>([])
  const [currentLevel, setCurrentLevel] = useState(-1)
  const [qualityBadge, setQualityBadge] = useState('')

  const [showSettings, setShowSettings] = useState(false)
  const [settingsView, setSettingsView] = useState<SettingsView>('root')
  const [showControls, setShowControls] = useState(true)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)

  // Fetch media metadata
  useEffect(() => {
    if (!ratingKey || ratingKey === 'demo') {
      setLoading(false)
      setStreamReady(true)
      return
    }
    getMediaDetail(token, ratingKey)
      .then(setMedia)
      .catch(() => {})
      .finally(() => { setLoading(false); setStreamReady(true) })
  }, [ratingKey, token])

  // Compute stream source once we know whether Plex has a part
  const streamSrc = useMemo(() => {
    if (!streamReady) return null
    const partKey = media?.Media?.[0]?.Part?.[0]?.key
    return partKey ? getStreamUrl(token, partKey) : DEMO_STREAM
  }, [media, token, streamReady])

  // Load HLS stream
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
        const levels: QualityLevel[] = data.levels.map((l, i) => ({
          label: l.height ? `${l.height}p` : `${Math.round((l.bitrate || 0) / 1000)}kbps`,
          level: i,
          height: l.height ?? 0,
          bitrate: l.bitrate ?? 0,
        }))
        setQualities(levels)
        video.play().catch(() => null)
      })

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, d) => {
        setCurrentLevel(d.level)
        const lvl = hls.levels[d.level]
        if (lvl?.height) {
          const badge = `${lvl.height}p`
          setQualityBadge(badge)
          if (badgeTimer.current) clearTimeout(badgeTimer.current)
          badgeTimer.current = setTimeout(() => setQualityBadge(''), 2500)
        }
      })

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal && streamSrc !== DEMO_STREAM) {
          hls.destroy()
          hlsRef.current = null
          // Plex failed → fall back to demo
          const demoHls = new Hls({ startLevel: -1 })
          hlsRef.current = demoHls
          demoHls.loadSource(DEMO_STREAM)
          demoHls.attachMedia(video)
          demoHls.on(Hls.Events.MANIFEST_PARSED, (_, data2) => {
            setQualities(data2.levels.map((l, i) => ({
              label: l.height ? `${l.height}p` : `${Math.round((l.bitrate || 0) / 1000)}kbps`,
              level: i,
              height: l.height ?? 0,
              bitrate: l.bitrate ?? 0,
            })))
            video.play().catch(() => null)
          })
        }
      })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamSrc
      video.play().catch(() => null)
    }

    return () => { hlsRef.current?.destroy(); hlsRef.current = null }
  }, [streamSrc])

  // Video events
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onTime = () => setCurrentTime(video.currentTime)
    const onDuration = () => setDuration(video.duration)
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
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

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const video = videoRef.current
      if (!video) return
      switch (e.code) {
        case 'Space': e.preventDefault(); playing ? video.pause() : video.play(); break
        case 'ArrowRight': video.currentTime = Math.min(video.currentTime + 10, duration); break
        case 'ArrowLeft': video.currentTime = Math.max(video.currentTime - 10, 0); break
        case 'KeyM': video.muted = !video.muted; setMuted(v => !v); break
        case 'ArrowUp': video.volume = Math.min(video.volume + 0.1, 1); setVolume(video.volume); break
        case 'ArrowDown': video.volume = Math.max(video.volume - 0.1, 0); setVolume(video.volume); break
        case 'Escape': setShowSettings(false); break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [playing, duration])

  function resetHideTimer() {
    setShowControls(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => { setShowControls(false); setShowSettings(false) }, 3500)
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
    if (hlsRef.current) {
      hlsRef.current.currentLevel = level
      setCurrentLevel(level)
    }
    setShowSettings(false)
    setSettingsView('root')
  }

  function changeSpeed(s: number) {
    setPlaybackSpeed(s)
    if (videoRef.current) videoRef.current.playbackRate = s
    setShowSettings(false)
    setSettingsView('root')
  }

  const activeQualityLabel = currentLevel === -1 ? 'Auto' : (qualities[currentLevel]?.label ?? 'Auto')
  const title = media?.title ?? 'Les Ombres de la Frontière'

  if (loading) {
    return (
      <div className="flex items-center justify-center w-screen h-screen" style={{ background: '#000' }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-gold)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

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

      {/* Quality change badge */}
      {qualityBadge && (
        <div
          className="absolute top-16 right-4 sm:right-6 z-30 px-3 py-1.5 rounded-lg text-xs font-bold pointer-events-none animate-pulse"
          style={{ background: 'rgba(0,0,0,0.85)', color: 'var(--color-gold)', border: '1px solid rgba(201,168,76,0.4)', backdropFilter: 'blur(8px)' }}
        >
          {qualityBadge}
        </div>
      )}

      {/* Top bar */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center px-3 sm:px-6 h-12 sm:h-14 transition-opacity duration-300 z-20"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.85), transparent)', opacity: showControls ? 1 : 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-8 h-8 rounded-lg mr-3 flex-shrink-0 hover:bg-white/10 transition-colors"
          style={{ color: 'rgba(255,255,255,0.8)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
        </button>

        <img src="/logo.png" alt="EmergingStream" className="flex-shrink-0 mr-4 sm:mr-8" style={{ height: '20px', width: 'auto' }} />

        <div className="hidden md:flex items-center gap-4 mr-4">
          {['Accueil', 'Films', 'Séries TV', 'En direct', 'Ma Liste'].map((item, i) => (
            <a key={item} href="#" className="text-xs font-medium transition-colors" style={{ color: i === 1 ? 'var(--color-gold)' : 'rgba(255,255,255,0.5)' }}>{item}</a>
          ))}
        </div>

        <div className="flex-1" />
        <span className="text-xs sm:text-sm font-semibold text-white truncate max-w-[160px] sm:max-w-sm">{title}</span>
        <span className="text-xs ml-3 flex-shrink-0 hidden sm:block" style={{ color: '#666' }}>S1 · E4 · 48 min</span>
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

      {/* Settings panel — YouTube style */}
      {showSettings && (
        <div
          className="absolute right-3 sm:right-6 bottom-16 sm:bottom-[5.5rem] rounded-xl z-30 overflow-hidden"
          style={{ width: '230px', background: 'rgba(15,15,15,0.97)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.7)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Root menu */}
          {settingsView === 'root' && (
            <>
              <div className="px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-xs font-semibold text-white">Paramètres</p>
              </div>
              <button
                onClick={() => setSettingsView('quality')}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="flex items-center gap-3">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
                  <span className="text-xs text-white">Qualité</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: 'var(--color-gold)' }}>{activeQualityLabel}</span>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                </div>
              </button>
              <button
                onClick={() => setSettingsView('speed')}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="flex items-center gap-3">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  <span className="text-xs text-white">Vitesse</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: '#888' }}>{playbackSpeed === 1 ? 'Normal' : `${playbackSpeed}x`}</span>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                </div>
              </button>
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><rect x="2" y="7" width="20" height="15" rx="2" /><path d="M17 2l-5 5-5-5" /></svg>
                  <span className="text-xs text-white">Sous-titres</span>
                </div>
                <span className="text-xs" style={{ color: '#888' }}>Désactivé</span>
              </div>
            </>
          )}

          {/* Quality submenu */}
          {settingsView === 'quality' && (
            <>
              <button
                onClick={() => setSettingsView('root')}
                className="flex items-center gap-2 px-4 py-2.5 w-full hover:bg-white/5 transition-colors"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                <p className="text-xs font-semibold text-white">Qualité</p>
              </button>
              {/* Auto */}
              <button
                onClick={() => changeQuality(-1)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors"
              >
                <span className="text-xs text-white">Auto</span>
                {currentLevel === -1 && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>}
              </button>
              {/* Quality levels, highest first */}
              {[...qualities].reverse().map((q) => (
                <button
                  key={q.level}
                  onClick={() => changeQuality(q.level)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white">{q.label}</span>
                    {q.height >= 1080 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(45,212,191,0.2)', color: 'var(--color-teal)' }}>HD</span>
                    )}
                    {q.height >= 720 && q.height < 1080 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(201,168,76,0.15)', color: 'var(--color-gold)' }}>HD</span>
                    )}
                  </div>
                  {currentLevel === q.level && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>}
                </button>
              ))}
              {qualities.length === 0 && (
                <p className="px-4 py-3 text-xs" style={{ color: '#666' }}>Chargement des qualités…</p>
              )}
            </>
          )}

          {/* Speed submenu */}
          {settingsView === 'speed' && (
            <>
              <button
                onClick={() => setSettingsView('root')}
                className="flex items-center gap-2 px-4 py-2.5 w-full hover:bg-white/5 transition-colors"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                <p className="text-xs font-semibold text-white">Vitesse de lecture</p>
              </button>
              {PLAYBACK_SPEEDS.map((s) => (
                <button
                  key={s}
                  onClick={() => changeSpeed(s)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors"
                >
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
        {/* Progress bar */}
        <div className="px-3 sm:px-6 mb-2 sm:mb-3">
          <div
            className="relative h-1 hover:h-1.5 rounded-full cursor-pointer group transition-all"
            style={{ background: 'rgba(255,255,255,0.25)' }}
            onClick={seek}
          >
            <div
              className="absolute left-0 top-0 h-full rounded-full"
              style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%', background: 'var(--color-gold)' }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: duration ? `calc(${(currentTime / duration) * 100}% - 6px)` : '0', background: 'var(--color-gold)' }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center px-3 sm:px-6 gap-2 sm:gap-4">
          {/* Play/Pause */}
          <button onClick={togglePlay} className="text-white hover:text-gray-300 transition-colors flex-shrink-0">
            {playing
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
            }
          </button>

          {/* Skip back 10s */}
          <button
            className="hidden sm:flex items-center text-gray-400 hover:text-white transition-colors text-[10px] gap-0.5"
            onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0) }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4.99" /></svg>
            <span style={{ fontSize: '9px', marginLeft: '-2px', marginTop: '1px' }}>10</span>
          </button>

          {/* Volume */}
          <div className="flex items-center gap-1 sm:gap-2 group/vol">
            <button
              onClick={() => { const v = videoRef.current; if(v){ v.muted = !v.muted; setMuted(v.muted) }}}
              className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
            >
              {muted || volume === 0
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
              }
            </button>
            <input
              type="range" min={0} max={1} step={0.02} value={muted ? 0 : volume}
              onChange={(e) => { const v = Number(e.target.value); setVolume(v); if(videoRef.current){ videoRef.current.volume = v; videoRef.current.muted = v === 0 }}}
              className="hidden sm:block w-18 h-1 cursor-pointer"
              style={{ accentColor: 'var(--color-gold)', width: '72px' }}
            />
          </div>

          {/* Time */}
          <span className="text-xs font-mono flex-shrink-0" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {formatTime(currentTime)} / {formatTime(duration || 3725)}
          </span>

          <div className="flex-1" />

          {/* Active quality badge */}
          {qualities.length > 0 && (
            <span
              className="hidden sm:block text-[10px] font-semibold px-2 py-0.5 rounded cursor-pointer flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.08)', color: '#aaa', border: '1px solid rgba(255,255,255,0.1)' }}
              onClick={(e) => { e.stopPropagation(); setSettingsView('quality'); setShowSettings(true) }}
            >
              {activeQualityLabel}
            </span>
          )}

          {/* Subtitles */}
          <button className="hidden sm:block text-gray-400 hover:text-white transition-colors flex-shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="15" rx="2" /><path d="M17 2l-5 5-5-5" /></svg>
          </button>

          {/* Settings gear */}
          <button
            onClick={(e) => { e.stopPropagation(); setSettingsView('root'); setShowSettings(v => !v) }}
            className="flex-shrink-0 transition-colors"
            style={{ color: showSettings ? 'var(--color-gold)' : 'rgba(255,255,255,0.65)' }}
          >
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className={showSettings ? 'animate-spin' : ''}
              style={{ animationDuration: '3s' }}
            >
              <circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
            </svg>
          </button>

          {/* PiP */}
          <button className="hidden sm:block text-gray-400 hover:text-white transition-colors flex-shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
          </button>

          {/* Fullscreen */}
          <button
            onClick={() => containerRef.current?.requestFullscreen?.()}
            className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></svg>
          </button>
        </div>
      </div>
    </div>
  )
}

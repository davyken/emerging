import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Hls from 'hls.js'
import { getMediaDetail, getStreamUrl } from '../../services/plexApi'
import { useAuthStore } from '../../store/authStore'
import type { PlexMedia } from '../../types/plex'

type QualityOption = { label: string; level: number }
const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2]

function formatTime(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  const mm = String(m).padStart(2, '0')
  const ss = String(sec).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

export function Watch() {
  const { ratingKey } = useParams<{ ratingKey: string }>()
  const token = useAuthStore((s) => s.token) ?? ''
  const navigate = useNavigate()

  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [media, setMedia] = useState<PlexMedia | null>(null)
  const [playing, setPlaying] = useState(true)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [qualities, setQualities] = useState<QualityOption[]>([])
  const [currentLevel, setCurrentLevel] = useState(-1)
  const [showSettings, setShowSettings] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [subtitle] = useState('Anglais (CC)')

  useEffect(() => {
    if (!ratingKey) return
    getMediaDetail(token, ratingKey)
      .then(setMedia)
      .catch(() => {})
  }, [ratingKey, token])

  useEffect(() => {
    if (!media) return
    const video = videoRef.current
    if (!video) return
    const partKey = media.Media?.[0]?.Part?.[0]?.key
    if (!partKey) return
    const src = getStreamUrl(token, partKey)
    if (Hls.isSupported()) {
      const hls = new Hls({ startLevel: -1 })
      hlsRef.current = hls
      hls.loadSource(src)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setQualities(data.levels.map((l, i) => ({ label: `${l.height}p`, level: i })))
        video.play().catch(() => null)
      })
      hls.on(Hls.Events.LEVEL_SWITCHED, (_, d) => setCurrentLevel(d.level))
    } else {
      video.src = src
      video.play().catch(() => null)
    }
    return () => { hlsRef.current?.destroy(); hlsRef.current = null }
  }, [media, token])

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
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [playing, duration])

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

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const video = videoRef.current
    if (!video || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    video.currentTime = pct * duration
  }

  function setQuality(level: number) {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = level
      setCurrentLevel(level)
    }
  }

  const title = media?.title ?? 'Les Ombres de la Frontière : Partie II'

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

      {/* Demo background if no stream */}
      {!media && (
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #050a10 0%, #0a1a20 30%, #051510 60%, #050a0a 100%)' }} />
      )}

      {/* Top bar */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center px-3 sm:px-6 h-12 sm:h-14 transition-opacity duration-300 z-20"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.85), transparent)', opacity: showControls ? 1 : 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-8 h-8 rounded-lg mr-3 flex-shrink-0 hover:bg-white/10 transition-colors"
          style={{ color: 'rgba(255,255,255,0.7)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
        </button>

        <img src="/logo.png" alt="EmergingStream" className="flex-shrink-0 mr-4 sm:mr-8" style={{ height: '20px', width: 'auto' }} />

        {/* Nav links — desktop only */}
        <div className="hidden md:flex items-center gap-4">
          {['Accueil', 'Films', 'Séries TV', 'En direct', 'Ma Liste'].map((item, i) => (
            <a key={item} href="#" className="text-xs font-medium transition-colors" style={{ color: i === 1 ? 'var(--color-gold)' : 'rgba(255,255,255,0.5)' }}>{item}</a>
          ))}
        </div>

        <div className="flex-1" />

        {/* Title */}
        <span className="text-xs sm:text-sm font-medium text-white truncate max-w-[180px] sm:max-w-xs">{title}</span>
        <span className="text-xs ml-3 flex-shrink-0 hidden sm:block" style={{ color: '#666' }}>S1 : E4 • 48 min restantes</span>
      </div>

      {/* Center play/pause indicator */}
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
          className="absolute right-3 sm:right-6 bottom-16 sm:bottom-20 rounded-xl z-30 p-4 w-56 sm:w-64"
          style={{ background: 'rgba(15,15,15,0.95)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-white">Paramètres</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" /></svg>
          </div>

          {/* Quality */}
          <div className="mb-3 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
              </div>
              <p className="text-xs font-medium text-white flex-1">Qualité</p>
              <select
                value={currentLevel}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="text-xs px-2 py-1 rounded outline-none"
                style={{ background: '#2a2a2a', color: 'var(--color-gold)', border: 'none' }}
              >
                <option value={-1}>Auto</option>
                {qualities.map((q) => <option key={q.level} value={q.level}>{q.label}</option>)}
                {qualities.length === 0 && <option value={0}>1080p</option>}
              </select>
            </div>
          </div>

          {/* Playback speed */}
          <div className="mb-3 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              </div>
              <p className="text-xs font-medium text-white flex-1">Vitesse</p>
              <select
                value={playbackSpeed}
                onChange={(e) => {
                  const spd = Number(e.target.value)
                  setPlaybackSpeed(spd)
                  if (videoRef.current) videoRef.current.playbackRate = spd
                }}
                className="text-xs px-2 py-1 rounded outline-none"
                style={{ background: '#2a2a2a', color: 'white', border: 'none' }}
              >
                {PLAYBACK_SPEEDS.map(s => <option key={s} value={s}>{s === 1 ? 'Normal' : `${s}x`}</option>)}
              </select>
            </div>
          </div>

          {/* Subtitles */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="2" y="7" width="20" height="15" rx="2" /><path d="M17 2l-5 5-5-5" /></svg>
            </div>
            <p className="text-xs font-medium text-white flex-1">Sous-titres</p>
            <span className="text-xs" style={{ color: '#888' }}>{subtitle}</span>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 transition-opacity duration-300"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', opacity: showControls ? 1 : 0, paddingBottom: '0.75rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div className="px-3 sm:px-6 mb-2 sm:mb-3">
          <div className="relative h-1 rounded-full cursor-pointer group" style={{ background: 'rgba(255,255,255,0.2)' }} onClick={seek}>
            <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: duration ? `${(currentTime / duration) * 100}%` : '33%', background: 'var(--color-gold)' }} />
            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: duration ? `calc(${(currentTime / duration) * 100}% - 6px)` : 'calc(33% - 6px)', background: 'var(--color-gold)' }} />
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center px-3 sm:px-6 gap-2 sm:gap-4">
          {/* Play/Pause */}
          <button onClick={togglePlay} className="text-white hover:text-gray-300 transition-colors flex-shrink-0">
            {playing
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
            }
          </button>

          {/* Rewind — desktop only */}
          <button
            className="hidden sm:block text-gray-400 hover:text-white transition-colors"
            onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0) }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4.99" /></svg>
          </button>

          {/* Volume */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => { const v = videoRef.current; if(v) { v.muted = !v.muted; setMuted(v.muted) }}}
              className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
            >
              {muted || volume === 0
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07 M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
              }
            </button>
            <input
              type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
              onChange={(e) => { const v = Number(e.target.value); setVolume(v); if(videoRef.current) { videoRef.current.volume = v; videoRef.current.muted = v === 0 }}}
              className="hidden sm:block w-16 sm:w-20 h-1 cursor-pointer"
              style={{ accentColor: 'white' }}
            />
          </div>

          {/* Time */}
          <span className="text-xs font-mono flex-shrink-0" style={{ color: 'rgba(255,255,255,0.7)' }}>
            <span className="hidden xs:inline">{formatTime(currentTime)} / </span>
            {formatTime(duration || 3725)}
          </span>

          <div className="flex-1" />

          {/* Subtitles — desktop only */}
          <button className="hidden sm:block text-gray-400 hover:text-white transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="15" rx="2" /><path d="M17 2l-5 5-5-5" /></svg>
          </button>

          {/* Settings */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowSettings(v => !v) }}
            className="transition-colors flex-shrink-0"
            style={{ color: showSettings ? 'var(--color-gold)' : 'rgba(255,255,255,0.6)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" /></svg>
          </button>

          {/* PiP — desktop only */}
          <button className="hidden sm:block text-gray-400 hover:text-white transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
          </button>

          {/* Fullscreen */}
          <button
            onClick={() => containerRef.current?.requestFullscreen?.()}
            className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></svg>
          </button>
        </div>
      </div>
    </div>
  )
}

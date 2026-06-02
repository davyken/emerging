import { useState, FormEvent, useRef } from 'react'
import { useAuthStore } from '../../store/authStore'
import { authApi } from '../../services/authApi'
import { useLanguage } from '../../i18n/LanguageContext'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium" style={{ color: '#888' }}>{label}</label>
      {children}
    </div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: 'white',
        ...props.style,
      }}
    />
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-5 flex flex-col gap-4" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)' }}>
      <h2 className="text-sm font-bold text-white">{title}</h2>
      {children}
    </div>
  )
}

export function Profile() {
  const { t } = useLanguage()
  const user = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)

  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [bio, setBio] = useState(user?.bio ?? '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>(user?.avatar ?? '')

  const initials = (user?.name ?? 'U').slice(0, 2).toUpperCase()

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleProfileSave(e: FormEvent) {
    e.preventDefault()
    setProfileMsg(null)
    setProfileSaving(true)
    try {
      const { data } = await authApi.updateProfile({
        name,
        email,
        bio,
        avatar: avatarPreview,
      })
      updateUser(data)
      setProfileMsg({ type: 'ok', text: 'Profile updated successfully.' })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to update profile.'
      setProfileMsg({ type: 'err', text: msg })
    } finally {
      setProfileSaving(false)
    }
  }

  async function handlePasswordSave(e: FormEvent) {
    e.preventDefault()
    setPwMsg(null)
    if (newPw !== confirmPw) { setPwMsg({ type: 'err', text: 'New passwords do not match.' }); return }
    if (newPw.length < 6) { setPwMsg({ type: 'err', text: 'Password must be at least 6 characters.' }); return }
    setPwSaving(true)
    try {
      await authApi.changePassword(currentPw, newPw)
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      setPwMsg({ type: 'ok', text: 'Password changed successfully.' })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to change password.'
      setPwMsg({ type: 'err', text: msg })
    } finally {
      setPwSaving(false)
    }
  }

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—'

  return (
    <div
      className="min-h-full overflow-y-auto px-4 pb-12"
      style={{ background: '#0a0a0a', color: 'white' }}
    >
      {/* Header */}
      <div className="max-w-2xl mx-auto pt-8 pb-6">
        <h1 className="text-xl font-black tracking-wide" style={{ color: 'var(--color-gold)' }}>
          {t.profile.accountSettings}
        </h1>
        <p className="text-xs mt-1" style={{ color: '#555' }}>Member since {memberSince}</p>
      </div>

      <div className="max-w-2xl mx-auto flex flex-col gap-5">
        {/* Avatar + identity */}
        <Section title="Profile Picture">
          <div className="flex items-center gap-5">
            <div
              className="relative w-20 h-20 rounded-2xl flex-shrink-0 flex items-center justify-center text-2xl font-black overflow-hidden cursor-pointer group"
              style={{ background: 'var(--color-gold)', color: '#000' }}
              onClick={() => fileRef.current?.click()}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
            </div>
            <div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
                style={{ background: 'rgba(201,168,76,0.15)', color: 'var(--color-gold)', border: '1px solid rgba(201,168,76,0.3)' }}
              >
                Change Photo
              </button>
              <p className="text-[11px] mt-2" style={{ color: '#555' }}>JPG, PNG. Max 2 MB.</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
        </Section>

        {/* Account info */}
        <Section title="Account Information">
          <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name">
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required />
              </Field>
              <Field label="Email Address">
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" required />
              </Field>
            </div>
            <Field label="Bio">
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Tell us a little about yourself…"
                maxLength={200}
                rows={3}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
              />
              <p className="text-[11px] text-right" style={{ color: '#444' }}>{bio.length}/200</p>
            </Field>

            {profileMsg && (
              <p className={`text-xs text-center ${profileMsg.type === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
                {profileMsg.text}
              </p>
            )}

            <button
              type="submit"
              disabled={profileSaving}
              className="self-start text-sm font-bold px-5 py-2 rounded-lg transition-opacity disabled:opacity-60"
              style={{ background: 'var(--color-gold)', color: '#000' }}
            >
              {profileSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </Section>

        {/* Subscription */}
        <Section title={t.profile.subscription}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--color-gold)' }}>{user?.plan?.toUpperCase() ?? 'FREE'} Plan</p>
              <p className="text-xs mt-0.5" style={{ color: '#555' }}>Member since {memberSince}</p>
            </div>
            <button
              className="text-xs font-bold px-4 py-2 rounded-lg transition-colors"
              style={{ background: 'rgba(201,168,76,0.15)', color: 'var(--color-gold)', border: '1px solid rgba(201,168,76,0.3)' }}
            >
              Upgrade Plan
            </button>
          </div>
        </Section>

        {/* Change Password */}
        <Section title="Change Password">
          <form onSubmit={handlePasswordSave} className="flex flex-col gap-4">
            <Field label="Current Password">
              <Input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" required />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="New Password">
                <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="••••••••" required />
              </Field>
              <Field label="Confirm New Password">
                <Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="••••••••" required />
              </Field>
            </div>

            {pwMsg && (
              <p className={`text-xs text-center ${pwMsg.type === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
                {pwMsg.text}
              </p>
            )}

            <button
              type="submit"
              disabled={pwSaving}
              className="self-start text-sm font-bold px-5 py-2 rounded-lg transition-opacity disabled:opacity-60"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              {pwSaving ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </Section>
      </div>
    </div>
  )
}

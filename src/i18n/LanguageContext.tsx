import { createContext, useContext, useState, type ReactNode } from 'react'
import { translations, type Lang } from './translations'

interface LanguageContextValue {
  lang: Lang
  t: typeof translations['en']
  toggle: () => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function getInitialLang(): Lang {
  try {
    const stored = localStorage.getItem('lang')
    if (stored === 'en' || stored === 'fr') return stored
  } catch {}
  return 'fr'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(getInitialLang)

  function toggle() {
    setLang((prev) => {
      const next: Lang = prev === 'en' ? 'fr' : 'en'
      try { localStorage.setItem('lang', next) } catch {}
      return next
    })
  }

  return (
    <LanguageContext.Provider value={{ lang, t: translations[lang] as typeof translations['en'], toggle }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider')
  return ctx
}

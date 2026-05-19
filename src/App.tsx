import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Public pages
import { Landing } from './pages/Landing/Landing'
import { Login } from './pages/Login/Login'
import { RegisterNormal } from './pages/RegisterNormal/RegisterNormal'
import { Register as InviteRegister } from './pages/Register/Register'

// App pages (require auth, have sidebar)
import { AppLayout } from './components/AppLayout/AppLayout'
import { Accueil } from './pages/Accueil/Accueil'
import { Films } from './pages/Films/Films'
import { Series } from './pages/Series/Series'
import { TVGuide } from './pages/TVGuide/TVGuide'
import { MaListe } from './pages/MaListe/MaListe'
import { MovieDetail } from './pages/MovieDetail/MovieDetail'
import { Dashboard } from './pages/Dashboard/Dashboard'

// Full-screen players (no sidebar)
import { Watch } from './pages/Watch/Watch'
import { WatchIPTV } from './pages/WatchIPTV/WatchIPTV'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Auth pages ── */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterNormal />} />
        <Route path="/invite" element={<InviteRegister />} />
        <Route path="/about" element={<Landing />} />

        {/* ── Full-screen players (no sidebar) ── */}
        <Route path="/watch/:ratingKey" element={<Watch />} />
        <Route path="/watch-tv/:channelId" element={<WatchIPTV />} />

        {/* ── App with sidebar + top nav ── */}
        <Route element={<AppLayout />}>
          <Route path="/accueil" element={<Accueil />} />
          <Route path="/browse" element={<Accueil />} />
          <Route path="/films" element={<Films />} />
          <Route path="/series" element={<Series />} />
          <Route path="/direct" element={<TVGuide />} />
          <Route path="/ma-liste" element={<MaListe />} />
          <Route path="/library" element={<Dashboard />} />
          <Route path="/downloads" element={<MaListe />} />
          <Route path="/history" element={<Dashboard />} />
          <Route path="/support" element={<Accueil />} />
          <Route path="/media/:ratingKey" element={<MovieDetail />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

import { useState } from 'react'
import { Ticker, Navbar, MobileNav, ContextBar, AuthModal, Footer } from './components/shared.jsx'
import Onboarding   from './components/Onboarding.jsx'
import ScoresPage   from './pages/Scores.jsx'
import StatsPage    from './pages/Stats.jsx'
import SchedulePage from './pages/Schedule.jsx'
import MyFeedPage   from './pages/MyFeed.jsx'
import { useAuth }  from './hooks/useAuth.jsx'
import { useTeams } from './hooks/useTeams.jsx'

export default function App() {
  const [page,     setPage]     = useState('scores')
  const [gender,   setGender]   = useState('M')
  const [division, setDivision] = useState('1')
  const [authMode, setAuthMode] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(false)

  const { user, isNewUser, setIsNewUser } = useAuth()
  const { followedList } = useTeams()
  const isW = gender === 'W'

  const openAuth = (mode) => setAuthMode(mode)
  const closeAuth = () => setAuthMode(null)

  // Show onboarding when user is new or explicitly editing teams
  const shouldOnboard = (user && isNewUser) || showOnboarding

  const handleOnboardingDone = () => {
    setIsNewUser(false)
    setShowOnboarding(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Ticker   gender={gender} division={division} isW={isW} />
      <Navbar
        page={page} setPage={setPage}
        gender={gender} division={division} isW={isW}
        onAuthClick={openAuth}
        followCount={followedList.length}
      />
      <ContextBar gender={gender} setGender={setGender} division={division} setDivision={setDivision} isW={isW} />

      <main style={{ flex: 1 }}>
        {page === 'feed'     && <MyFeedPage   isW={isW} onEditTeams={() => setShowOnboarding(true)} onAuthClick={openAuth} />}
        {page === 'scores'   && <ScoresPage   gender={gender} division={division} isW={isW} onAuthClick={openAuth} />}
        {page === 'stats'    && <StatsPage    gender={gender} division={division} isW={isW} />}
        {page === 'schedule' && <SchedulePage gender={gender} division={division} isW={isW} />}
      </main>

      <Footer />

      <MobileNav page={page} setPage={setPage} isW={isW} followCount={followedList.length} />

      {authMode       && <AuthModal    mode={authMode} onClose={closeAuth} isW={isW} />}
      {shouldOnboard  && <Onboarding  onDone={handleOnboardingDone} />}
    </div>
  )
}

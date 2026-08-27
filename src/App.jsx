import { useState } from 'react'
import { Ticker, Navbar, ContextBar, AuthModal, Footer, MobileTabBar } from './components/shared.jsx'
import Onboarding   from './components/Onboarding.jsx'
import ScoresPage   from './pages/Scores.jsx'
import StatsPage    from './pages/Stats.jsx'
import SchedulePage from './pages/Schedule.jsx'
import MyFeedPage   from './pages/MyFeed.jsx'
import TeamsPage    from './pages/Teams.jsx'
import TeamDetailPage from './pages/TeamDetail.jsx'
import PollsPage    from './pages/Polls.jsx'
import { useAuth }  from './hooks/useAuth.jsx'
import { useTeams } from './hooks/useTeams.jsx'

export default function App() {
  const [page,     setPage]     = useState('scores')
  const [gender,   setGender]   = useState('M')
  const [division, setDivision] = useState('1')
  const [authMode, setAuthMode] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [selectedTeamId, setSelectedTeamId] = useState(null)

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

  const navigateToTeamDetail = (programId) => {
    if (!programId) return
    setSelectedTeamId(programId)
    setPage('teams')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Ticker   gender={gender} division={division} isW={isW} />
      <Navbar
        page={page} setPage={(p) => { setPage(p); setSelectedTeamId(null) }}
        gender={gender} division={division} isW={isW}
        onAuthClick={openAuth}
        followCount={followedList.length}
      />
      <ContextBar page={page} gender={gender} setGender={setGender} division={division} setDivision={setDivision} isW={isW} />

      <main style={{ flex: 1 }}>
        {page === 'feed'     && <MyFeedPage   isW={isW} onEditTeams={() => setShowOnboarding(true)} onAuthClick={openAuth} />}
        {page === 'scores'   && <ScoresPage   gender={gender} division={division} isW={isW} onAuthClick={openAuth} />}
        {page === 'stats'    && <StatsPage    gender={gender} division={division} isW={isW} onSelectTeam={navigateToTeamDetail} />}
        {page === 'schedule' && <SchedulePage gender={gender} division={division} isW={isW} />}
        {page === 'teams' && !selectedTeamId && <TeamsPage gender={gender} division={division} isW={isW} onAuthClick={openAuth} onSelectTeam={(id) => setSelectedTeamId(id)} />}
        {page === 'teams' && selectedTeamId && <TeamDetailPage teamId={selectedTeamId} isW={isW} onBack={() => setSelectedTeamId(null)} onAuthClick={openAuth} />}
        {page === 'polls'    && <PollsPage    gender={gender} division={division} isW={isW} />}
      </main>

      <Footer />

      <MobileTabBar
        page={page} setPage={(p) => { setPage(p); setSelectedTeamId(null) }}
        isW={isW} followCount={followedList.length}
      />

      {authMode       && <AuthModal    mode={authMode} onClose={closeAuth} isW={isW} />}
      {shouldOnboard  && <Onboarding  onDone={handleOnboardingDone} />}
    </div>
  )
}

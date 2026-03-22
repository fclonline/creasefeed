import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { doc, updateDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from './useAuth.jsx'
import { getProgramById } from '../data/programs.js'

// Alert preference levels
export const ALERT_LEVELS = {
  NONE:       'none',       // no alerts
  FINAL:      'final',      // game final only
  HALFTIME:   'halftime',   // halftime + final
  GOALS:      'goals',      // every goal (Pro only)
  LIVE:       'live',       // every goal + game start (Pro only)
}

export const ALERT_LABELS = {
  none:      'Off',
  final:     'Final score',
  halftime:  'Halftime + Final',
  goals:     'Every goal',
  live:      'Live (every goal + start)',
}

const TeamsContext = createContext(null)

export function TeamsProvider({ children }) {
  const { user, pro } = useAuth()
  // followedTeams: { [teamId]: { alertLevel: ALERT_LEVELS } }
  const [followedTeams, setFollowedTeams] = useState({})
  const [onboardingDone, setOnboardingDone] = useState(true)
  const [loading, setLoading] = useState(true)

  // Sync from Firestore when user logs in
  useEffect(() => {
    if (!user) {
      setFollowedTeams({})
      setOnboardingDone(true)
      setLoading(false)
      return
    }

    const ref = doc(db, 'users', user.uid)
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setFollowedTeams(data.followedTeams || {})
        setOnboardingDone(data.onboardingDone !== false)
      }
      setLoading(false)
    })
    return unsub
  }, [user])

  // Follow a team (free: up to 2, pro: unlimited)
  const followTeam = useCallback(async (teamId, alertLevel = ALERT_LEVELS.FINAL) => {
    if (!user) return { error: 'signin' }
    const count = Object.keys(followedTeams).length
    if (!pro && count >= 2 && !followedTeams[teamId]) return { error: 'pro' }

    const updated = {
      ...followedTeams,
      [teamId]: { alertLevel, followedAt: Date.now() }
    }
    setFollowedTeams(updated)
    await updateDoc(doc(db, 'users', user.uid), { followedTeams: updated })
    return { ok: true }
  }, [user, pro, followedTeams])

  // Unfollow a team
  const unfollowTeam = useCallback(async (teamId) => {
    if (!user) return
    const updated = { ...followedTeams }
    delete updated[teamId]
    setFollowedTeams(updated)
    await updateDoc(doc(db, 'users', user.uid), { followedTeams: updated })
  }, [user, followedTeams])

  // Update alert preference for a team
  const setAlertLevel = useCallback(async (teamId, alertLevel) => {
    if (!user) return
    const updated = {
      ...followedTeams,
      [teamId]: { ...followedTeams[teamId], alertLevel }
    }
    setFollowedTeams(updated)
    await updateDoc(doc(db, 'users', user.uid), { followedTeams: updated })
  }, [user, followedTeams])

  // Complete onboarding
  const completeOnboarding = useCallback(async (selectedIds) => {
    if (!user) return
    const teams = {}
    selectedIds.forEach(id => {
      teams[id] = { alertLevel: ALERT_LEVELS.FINAL, followedAt: Date.now() }
    })
    setFollowedTeams(teams)
    setOnboardingDone(true)
    await updateDoc(doc(db, 'users', user.uid), {
      followedTeams: teams,
      onboardingDone: true,
    })
  }, [user])

  const isFollowing = (teamId) => !!followedTeams[teamId]
  const followedList = Object.keys(followedTeams).map(id => ({
    ...getProgramById(id),
    ...followedTeams[id],
  })).filter(Boolean)

  return (
    <TeamsContext.Provider value={{
      followedTeams,
      followedList,
      loading,
      onboardingDone,
      isFollowing,
      followTeam,
      unfollowTeam,
      setAlertLevel,
      completeOnboarding,
    }}>
      {children}
    </TeamsContext.Provider>
  )
}

export const useTeams = () => useContext(TeamsContext)

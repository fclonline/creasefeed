import { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react'
import { doc, updateDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from './useAuth.jsx'
import { getProgramById } from '../data/programs.js'
import { FREE_FOLLOW_LIMIT } from '../config/pro.js'

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

// Signed-out picks are held in memory for the visit only. A free account is
// what saves them: on sign-in they merge into users/{uid}.followedTeams, and a
// refresh or closed tab before then drops them.
// Earlier builds kept them in localStorage under this key; it is read once to
// carry those picks into the visit, then removed.
export const PENDING_KEY = 'cf_pending_follows'

function readLegacyPending() {
  try {
    const raw = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]')
    return Array.isArray(raw) ? [...new Set(raw.filter(id => typeof id === 'string' && getProgramById(id)))].slice(0, FREE_FOLLOW_LIMIT) : []
  } catch { return [] }
}

export function TeamsProvider({ children }) {
  const { user, pro, setIsNewUser } = useAuth()
  // followedTeams: { [teamId]: { alertLevel: ALERT_LEVELS } }
  const [followedTeams, setFollowedTeams] = useState({})
  const [onboardingDone, setOnboardingDone] = useState(true)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(readLegacyPending)
  const pendingRef = useRef(pending)
  const setPendingIds = (ids) => { pendingRef.current = ids; setPending(ids) }
  // Legacy picks are now in memory; drop the stored copy so it never returns.
  useEffect(() => { try { localStorage.removeItem(PENDING_KEY) } catch {} }, [])
  // Set when a sign-in merge had to leave pending teams out (free cap).
  const [mergeOverflow, setMergeOverflow] = useState(0)
  const mergedFor = useRef(null)

  // Sync from Firestore when user logs in
  useEffect(() => {
    if (!user) {
      setFollowedTeams({})
      setOnboardingDone(true)
      setLoading(false)
      mergedFor.current = null
      return
    }

    const ref = doc(db, 'users', user.uid)
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return // useAuth is still creating the doc
      const data = snap.data()
      const existing = data.followedTeams || {}

      // Merge signed-out picks once per sign-in: keep every saved follow, add
      // pending ones up to the free cap, never delete anything.
      const queued = pendingRef.current
      if (queued.length && mergedFor.current !== user.uid) {
        mergedFor.current = user.uid
        const isPro = data.pro === true
        const merged = { ...existing }
        let left = 0
        for (const id of queued) {
          if (merged[id]) continue
          if (!isPro && Object.keys(merged).length >= FREE_FOLLOW_LIMIT) { left++; continue }
          merged[id] = { alertLevel: ALERT_LEVELS.FINAL, followedAt: Date.now() }
        }
        setPendingIds([])
        setMergeOverflow(left)
        setFollowedTeams(merged)
        if (Object.keys(merged).length !== Object.keys(existing).length) {
          updateDoc(ref, { followedTeams: merged, onboardingDone: true })
            .catch(err => console.warn('[CreaseFeed] follow merge failed:', err.message))
          setIsNewUser?.(false)
        }
        setOnboardingDone(true)
        setLoading(false)
        return
      }

      setFollowedTeams(existing)
      setOnboardingDone(data.onboardingDone !== false)
      setLoading(false)
    })
    return unsub
  }, [user])

  // Follow a team (free: up to 2, pro: unlimited). Signed out → in-memory
  // picks; the result tells the caller to ask for a free account
  // (needsAccount), or error 'signup' when the picks are already at the cap.
  const followTeam = useCallback(async (teamId, alertLevel = ALERT_LEVELS.FINAL) => {
    if (!user) {
      const cur = pendingRef.current
      if (cur.includes(teamId)) return { ok: true, needsAccount: true, count: cur.length }
      if (cur.length >= FREE_FOLLOW_LIMIT) return { error: 'signup' }
      const next = [...cur, teamId]
      setPendingIds(next)
      return { ok: true, needsAccount: true, count: next.length }
    }
    const count = Object.keys(followedTeams).length
    if (!pro && count >= FREE_FOLLOW_LIMIT && !followedTeams[teamId]) return { error: 'pro' }

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
    if (!user) {
      setPendingIds(pendingRef.current.filter(id => id !== teamId))
      return
    }
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

  // Signed out, the "followed" set is the pending list.
  const activeIds = user ? Object.keys(followedTeams) : pending
  const isFollowing = (teamId) => activeIds.includes(teamId)
  const toggleFollow = (teamId) => isFollowing(teamId) ? unfollowTeam(teamId).then(() => ({ ok: true })) : followTeam(teamId)
  const followedList = activeIds.map(id => {
    const prog = getProgramById(id)
    return prog ? { ...prog, ...(user ? followedTeams[id] : {}) } : null
  }).filter(Boolean)

  return (
    <TeamsContext.Provider value={{
      followedTeams,
      followedList,
      pendingFollows: pending,
      loading,
      onboardingDone,
      isFollowing,
      followTeam,
      unfollowTeam,
      toggleFollow,
      setAlertLevel,
      completeOnboarding,
      mergeOverflow,
      clearMergeOverflow: () => setMergeOverflow(0),
    }}>
      {children}
    </TeamsContext.Provider>
  )
}

export const useTeams = () => useContext(TeamsContext)

// ============================================================================
// src/hooks/useScores.jsx
// PRIMARY: Firestore (populated by NCAA API Cloud Functions)
// FALLBACK: Empty state — never show ESPN or mock data
// ============================================================================
import { useState, useEffect, useRef } from 'react'
import { subscribeToScoreboard, fetchStandings, fetchStatLeaders, fetchAllPolls } from '../api/firestore.js'
import { STANDINGS_M, STANDINGS_W, STATS_M, STATS_W } from '../data/mockData.js'
// ── useScores — real-time Firestore only ─────────────────────────────────────
// date is YYYYMMDD (e.g. "20260524"); division is "1"/"2"/"3". Both are passed
// through to the Firestore query so the scoreboard is scoped to the selected
// day and division. Omit them (e.g. the ticker) to get all recent games.
export function useScores(gender, date, division) {
  const [games,   setGames]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [source,  setSource]  = useState('loading')
  const unsubRef = useRef(null)
  useEffect(() => {
    setLoading(true)
    setError(null)
    setSource('loading')
    // Clean up previous subscription
    if (unsubRef.current) {
      unsubRef.current()
      unsubRef.current = null
    }
    unsubRef.current = subscribeToScoreboard(gender, (firestoreGames) => {
      setGames(firestoreGames)
      setSource(firestoreGames.length > 0 ? 'ncaa' : 'empty')
      setLoading(false)
    }, (err) => {
      console.warn('[CreaseFeed] Firestore error:', err.message)
      setGames([])
      setSource('error')
      setLoading(false)
      setError('Unable to load scores — please refresh')
    }, date, division)
    return () => {
      if (unsubRef.current) {
        unsubRef.current()
        unsubRef.current = null
      }
    }
  }, [gender, date, division])
  return { games, loading, error, source }
}
// ── useStandings ──────────────────────────────────────────────────────────────
export function useStandings(gender) {
  const [standings, setStandings] = useState([])
  const [loading,   setLoading]   = useState(true)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchStandings(gender)
        if (!cancelled) {
          setStandings(data && data.length > 0
            ? data
            : (gender === 'W' ? STANDINGS_W : STANDINGS_M))
        }
      } catch {
        if (!cancelled) {
          setStandings(gender === 'W' ? STANDINGS_W : STANDINGS_M)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [gender])
  return { standings, loading }
}
// ── useStatLeaders ────────────────────────────────────────────────────────────
// Mock-data fallback is gated to DEV only. In prod, an empty Firestore result
// or a thrown query (e.g. a missing composite index during a build window)
// resolves to an empty state — never populated fake rows that look like real
// leaderboards.
export function useStatLeaders(gender, tab, division = '1') {
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [source,  setSource]  = useState('loading')
  useEffect(() => {
    let cancelled = false
    const useMock = (reason) => {
      if (import.meta.env.DEV) {
        const mock = gender === 'W' ? STATS_W : STATS_M
        setRows(mock[tab] || mock.goals)
        setSource('mock')
      } else {
        setRows([])
        setSource(reason)
      }
    }
    // A null tab means the caller is rendering a withheld board; don't query.
    if (!tab) { setRows([]); setSource('withheld'); setLoading(false); return }
    ;(async () => {
      setLoading(true)
      try {
        const data = await fetchStatLeaders(gender, tab, division)
        if (!cancelled) {
          if (data && data.length > 0) {
            setRows(data)
            setSource('ncaa')
          } else {
            useMock('empty')
          }
        }
      } catch {
        if (!cancelled) useMock('error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [gender, tab, division])
  return { rows, loading, source }
}
// ── useGameDetail ────────────────────────────────────────────────────────────
export function useGameDetail(gameId, gender, enabled = false) {
  const [detail,  setDetail]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  useEffect(() => {
    if (!enabled || !gameId) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const { fetchGameDetail } = await import('../api/firestore.js')
        const data = await fetchGameDetail(gameId, gender)
        if (!cancelled) setDetail(data)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [gameId, gender, enabled])
  return { detail, loading, error }
}
// ── usePolls ─────────────────────────────────────────────────────────────────
// Returns the full { coachesPolls, rpi } shape from fetchAllPolls so the
// NCAA RPI tab (which reads from the `rpi` Firestore collection via fetchRPI)
// is wired through correctly. The optional `division` argument refetches RPI
// when the user toggles D1/D2/D3 — backend currently publishes D1 only, so
// D2/D3 will resolve to null and render an empty state.
export function usePolls(gender, division = '1') {
  const [polls,   setPolls]   = useState({ coachesPolls: [], rpi: null })
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const data = await fetchAllPolls(gender, division)
        if (!cancelled) setPolls(data || { coachesPolls: [], rpi: null })
      } catch {
        if (!cancelled) setPolls({ coachesPolls: [], rpi: null })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [gender, division])
  return { polls, loading }
}

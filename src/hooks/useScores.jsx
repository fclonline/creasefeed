// ============================================================================
// src/hooks/useScores.jsx
//
// Central data hook for all live game/standings/stats data.
//
// ⚠️  TO SWAP DATA SOURCES:
//   Change the ONE import line below to point to a different adapter.
//   Everything else in the app stays the same.
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react'

// ─── 👇 SWAP THIS LINE TO CHANGE DATA SOURCE ─────────────────────────────────
import * as DataSource from '../api/espn.js'
// import * as DataSource from '../api/sportradar.js'  // ← future
// import * as DataSource from '../api/sportsdata.js'  // ← future
// ─────────────────────────────────────────────────────────────────────────────

import { makeGames, STANDINGS_M, STANDINGS_W, STATS_M, STATS_W } from '../data/mockData.js'

const POLL_INTERVAL_LIVE   = 30_000   // 30s — when games are live
const POLL_INTERVAL_IDLE   = 120_000  // 2min — no live games
const CACHE_TTL            = 25_000   // don't re-fetch if data is fresh

// simple in-memory cache { key: { data, fetchedAt } }
const cache = {}

function isFresh(key) {
  return cache[key] && (Date.now() - cache[key].fetchedAt < CACHE_TTL)
}

// ── hook ─────────────────────────────────────────────────────────────────────
export function useScores(gender, date) {
  const [games,    setGames]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [source,   setSource]   = useState('mock')  // 'espn' | 'mock'
  const timerRef = useRef(null)

  const cacheKey = `scoreboard:${gender}:${date || 'today'}`

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    setError(null)

    // Return cached data if still fresh
    if (isFresh(cacheKey)) {
      setGames(cache[cacheKey].data)
      setLoading(false)
      return
    }

    try {
      const data = await DataSource.fetchScoreboard(gender, date)
      if (data && data.length > 0) {
        cache[cacheKey] = { data, fetchedAt: Date.now() }
        setGames(data)
        setSource('espn')
        console.info(`[CreaseFeed] ✓ ESPN scoreboard — ${data.length} games (${gender})`)
      } else {
        // ESPN returned empty — off-season or no games today, use mock
        throw new Error('No games returned from ESPN')
      }
    } catch (err) {
      console.warn(`[CreaseFeed] ESPN unavailable, falling back to mock data:`, err.message)
      const fallback = makeGames(gender)
      setGames(fallback)
      setSource('mock')
      setError('Live data unavailable — showing demo data')
    } finally {
      setLoading(false)
    }
  }, [gender, date, cacheKey])

  // Initial fetch + set up polling
  useEffect(() => {
    load()

    const poll = () => {
      const hasLive = games.some(g => g.status === 'live')
      const interval = hasLive ? POLL_INTERVAL_LIVE : POLL_INTERVAL_IDLE
      timerRef.current = setTimeout(async () => {
        await load(true)  // quiet reload — no loading spinner
        poll()            // reschedule after each fetch
      }, interval)
    }

    poll()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [gender, date])   // re-run if gender or date changes

  return { games, loading, error, source, refetch: () => load() }
}

// ── standings ─────────────────────────────────────────────────────────────────
export function useStandings(gender) {
  const [standings, setStandings] = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await DataSource.fetchStandings(gender)
        if (!cancelled) {
          if (data && data.length > 0) {
            setStandings(data)
            console.info(`[CreaseFeed] ✓ ESPN standings (${gender})`)
          } else {
            throw new Error('empty')
          }
        }
      } catch {
        if (!cancelled) {
          setStandings(gender === 'W' ? STANDINGS_W : STANDINGS_M)
          console.warn(`[CreaseFeed] standings fallback → mock (${gender})`)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [gender])

  return { standings, loading }
}

// ── stat leaders ──────────────────────────────────────────────────────────────
export function useStatLeaders(gender, tab) {
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [source,  setSource]  = useState('mock')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const data = await DataSource.fetchStatLeaders(gender)
        if (!cancelled) {
          if (data && data.length > 0) {
            setRows(data)
            setSource('espn')
          } else {
            throw new Error('empty')
          }
        }
      } catch {
        if (!cancelled) {
          const mock = gender === 'W' ? STATS_W : STATS_M
          setRows(mock[tab] || mock.goals)
          setSource('mock')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [gender, tab])

  return { rows, loading, source }
}

// ── game detail (Pro feature) ─────────────────────────────────────────────────
export function useGameDetail(espnGameId, gender, enabled = false) {
  const [detail,  setDetail]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!enabled || !espnGameId) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const data = await DataSource.fetchGameDetail(espnGameId, gender)
        if (!cancelled) setDetail(data)
      } catch (err) {
        if (!cancelled) setError(err.message)
        console.warn('[CreaseFeed] game detail fetch failed:', err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [espnGameId, gender, enabled])

  return { detail, loading, error }
}

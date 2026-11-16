// ============================================================================
// src/hooks/useSeasonState.jsx
// One subscription per gender + division for the games around today, shared by
// the ticker, the context bar, Scores and the off-season home.
//
// Off-season = no games for the selection in the next 7 days AND none in the
// past 14 days. The ticker window is the past 3 days plus the next 3 days.
// ============================================================================
import { createContext, useContext, useEffect, useState } from 'react'
import { subscribeToGameWindow, fetchLastFinal, fetchGameById, dayRange, initSeason } from '../api/firestore.js'
import { CHAMPIONSHIP_GAME_IDS } from '../config/season.js'

const SeasonStateContext = createContext(null)

export function SeasonStateProvider({ gender, division, children }) {
  const [state, setState] = useState({ loading: true, windowGames: [], offseason: false, tickerGames: [] })

  useEffect(() => {
    let unsub = null
    let cancelled = false
    setState(s => ({ ...s, loading: true }))
    initSeason().then(() => {
      if (cancelled) return
      const today = new Date()
      const dates = dayRange(today, -14, 7)
      const tickerDates = new Set(dayRange(today, -3, 3))
      unsub = subscribeToGameWindow(gender, division, dates, (games) => {
        if (cancelled) return
        setState({
          loading: false,
          windowGames: games,
          offseason: games.length === 0,
          tickerGames: games.filter(g => tickerDates.has(g.gameDate)),
        })
      }, () => {
        // On a read error, fall back to the off-season presentation rather
        // than showing games from another division or an error string.
        if (!cancelled) setState({ loading: false, windowGames: [], offseason: true, tickerGames: [] })
      })
    })
    return () => { cancelled = true; if (unsub) unsub() }
  }, [gender, division])

  return (
    <SeasonStateContext.Provider value={{ ...state, gender, division }}>
      {children}
    </SeasonStateContext.Provider>
  )
}

export const useSeasonState = () => useContext(SeasonStateContext)

// Most recent final for the selection, or the configured championship game
// when its id is set and it belongs to this gender + division.
export function useLastFinal(gender, division) {
  const [result, setResult] = useState({ loading: true, game: null, isChampionship: false })
  useEffect(() => {
    let cancelled = false
    setResult({ loading: true, game: null, isChampionship: false })
    ;(async () => {
      const champId = CHAMPIONSHIP_GAME_IDS[gender]
      if (champId) {
        const champ = await fetchGameById(champId)
        if (champ && champ.div === String(division) && champ.gender === gender && champ.status === 'final') {
          if (!cancelled) setResult({ loading: false, game: champ, isChampionship: true })
          return
        }
      }
      const game = await fetchLastFinal(gender, division)
      if (!cancelled) setResult({ loading: false, game, isChampionship: false })
    })()
    return () => { cancelled = true }
  }, [gender, division])
  return result
}

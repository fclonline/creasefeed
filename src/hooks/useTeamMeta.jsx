// ============================================================================
// src/hooks/useTeamMeta.jsx — rank (latest stored poll for the gender +
// division) and W-L record (/records/{gender}) for a team on a game doc.
// Both are optional: callers render nothing when a lookup misses.
// ============================================================================
import { useEffect, useMemo, useState } from 'react'
import { fetchTeamRecords } from '../api/firestore.js'
import { useStandings } from './useScores.jsx'
import { canonTeam, seoKey } from '../data/programs.js'

const recordCache = new Map()
function recordsFor(gender) {
  if (!recordCache.has(gender)) recordCache.set(gender, fetchTeamRecords(gender))
  return recordCache.get(gender)
}

export function useTeamMeta(gender, division) {
  const { standings } = useStandings(gender, division)
  const [records, setRecords] = useState({})
  useEffect(() => {
    let cancelled = false
    recordsFor(gender).then(r => { if (!cancelled) setRecords(r || {}) })
    return () => { cancelled = true }
  }, [gender])

  return useMemo(() => {
    const ranks = {}
    for (const s of standings) ranks[canonTeam(s.team)] = s.rank
    const rankFor = (team) => (team?.name && ranks[canonTeam(team.name)]) || null
    const recordFor = (team) => {
      if (!team) return ''
      const r = (team.teamSeo && (records['seo:' + String(team.teamSeo).toLowerCase()] || records['sk:' + seoKey(team.teamSeo)]))
        || (team.name && records['c:' + canonTeam(team.name)])
      if (r && Number.isFinite(r.w) && Number.isFinite(r.l)) return `${r.w}-${r.l}`
      return /^\d{1,2}-\d{1,2}$/.test(team.rec || '') ? team.rec : ''
    }
    return { rankFor, recordFor, standings }
  }, [standings, records])
}

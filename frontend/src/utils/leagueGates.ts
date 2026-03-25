import type { LeagueRole, LeagueState } from '@/types/models'

// Centralized UI gate rules for league-state and role checks.
// Keep this aligned with backend authorization/state-transition policy.
export function isDraftState(state: LeagueState) {
  return state === 'DRAFT_SCHEDULED' || state === 'DRAFT_IN_PROGRESS'
}

export function isSeasonState(state: LeagueState) {
  return (
    state === 'SEASON_ACTIVE' ||
    state === 'PLAYOFFS' ||
    state === 'COMPLETE'
  )
}

export function canAccessDraft(state: LeagueState) {
  return isDraftState(state)
}

export function canAccessMatchups(state: LeagueState) {
  return state === 'SEASON_ACTIVE' || state === 'PLAYOFFS' || state === 'COMPLETE'
}

export function canAccessStandings(state: LeagueState) {
  return canAccessMatchups(state)
}

export function canAccessPlayers(state: LeagueState) {
  // MVP: allow browsing during draft + season (read-only actions outside of draft/season as needed).
  return isDraftState(state) || state === 'SEASON_ACTIVE' || state === 'PLAYOFFS'
}

export function isCommissioner(role: LeagueRole | null | undefined) {
  return role === 'COMMISSIONER'
}

export function canCommissionerControlDraft(leagueState: LeagueState, role: LeagueRole | null) {
  return isCommissioner(role) && (leagueState === 'DRAFT_SCHEDULED' || leagueState === 'DRAFT_IN_PROGRESS')
}

export function canEditLineup(isLineupLocked: boolean) {
  return !isLineupLocked
}


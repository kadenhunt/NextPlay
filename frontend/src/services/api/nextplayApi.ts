// Handoff: this file is the frontend API seam. Pages import from here only.
// `httpNextPlayApi.ts` now contains a transitional HTTP adapter for supported backend routes.
// Only the supported functions below can switch to HTTP; everything else stays on mocks for now.

import * as httpApi from '@/services/api/httpNextPlayApi'
import * as mockApi from '@/services/mocks/mockNextPlayApi'

const useMockApi = import.meta.env.VITE_USE_MOCK_API !== 'false'

export const USES_MOCK_BACKEND = useMockApi

export * from '@/services/mocks/mockNextPlayApi'

export const getPlayers = useMockApi ? mockApi.getPlayers : httpApi.getPlayers
export const getPlayerById = useMockApi ? mockApi.getPlayerById : httpApi.getPlayerById
export const getMatchups = useMockApi ? mockApi.getMatchups : httpApi.getMatchups
export const getStandings = useMockApi ? mockApi.getStandings : httpApi.getStandings

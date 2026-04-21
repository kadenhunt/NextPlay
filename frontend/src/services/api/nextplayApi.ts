// Handoff: this file is the frontend API seam. Pages import from here only.
// `httpNextPlayApi.ts` now contains a transitional HTTP adapter for supported backend routes.
// We are intentionally keeping the seam on mocks until more endpoints are ready.

/** Flip to false once this module points at a real API; UI uses it to label the prototype honestly. */
export const USES_MOCK_BACKEND = true as const

export * from '@/services/mocks/mockNextPlayApi'

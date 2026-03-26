// Handoff: this file is the frontend API seam — pages import from here only.
// When the real backend exists: set USES_MOCK_BACKEND to false and export your HTTP client instead of mocks.

/** Flip to false once this module points at a real API; UI uses it to label the prototype honestly. */
export const USES_MOCK_BACKEND = true as const

export * from '@/services/mocks/mockNextPlayApi'


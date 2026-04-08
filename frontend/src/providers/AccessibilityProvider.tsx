import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'

type MotionPref = 'system' | 'reduce' | 'no-preference'
type ContrastPref = 'default' | 'high'
type TextScalePref = '100' | '110'

type AccessibilityPrefs = {
  motion: MotionPref
  contrast: ContrastPref
  textScale: TextScalePref
}

type AccessibilityContextValue = {
  prefs: AccessibilityPrefs
  setMotion: (motion: MotionPref) => void
  setContrast: (contrast: ContrastPref) => void
  setTextScale: (scale: TextScalePref) => void
}

const STORAGE_KEY = 'nextplay.a11y.prefs'

const defaultPrefs: AccessibilityPrefs = {
  motion: 'system',
  contrast: 'default',
  textScale: '100',
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null)

function readPrefs(): AccessibilityPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultPrefs
    const parsed = JSON.parse(raw) as Partial<AccessibilityPrefs>
    return {
      motion: parsed.motion ?? defaultPrefs.motion,
      contrast: parsed.contrast ?? defaultPrefs.contrast,
      textScale: parsed.textScale ?? defaultPrefs.textScale,
    }
  } catch {
    return defaultPrefs
  }
}

export default function AccessibilityProvider({ children }: PropsWithChildren) {
  const [prefs, setPrefs] = useState<AccessibilityPrefs>(() => readPrefs())

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
    } catch {
      /* noop */
    }
  }, [prefs])

  useEffect(() => {
    const el = document.documentElement
    el.dataset.motion = prefs.motion
    el.dataset.contrast = prefs.contrast
    el.dataset.textScale = prefs.textScale
  }, [prefs])

  const value = useMemo<AccessibilityContextValue>(
    () => ({
      prefs,
      setMotion: (motion) => setPrefs((prev) => ({ ...prev, motion })),
      setContrast: (contrast) => setPrefs((prev) => ({ ...prev, contrast })),
      setTextScale: (textScale) => setPrefs((prev) => ({ ...prev, textScale })),
    }),
    [prefs],
  )

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>
}

export function useAccessibilityPrefs() {
  const ctx = useContext(AccessibilityContext)
  if (!ctx) throw new Error('useAccessibilityPrefs must be used within AccessibilityProvider')
  return ctx
}

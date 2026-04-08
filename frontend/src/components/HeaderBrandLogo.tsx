import { Link } from 'react-router-dom'
import combomarkSvg from '@/assets/brand/combomark-no-background.svg?raw'
import { useTheme } from '@/providers/ThemeProvider'

function stripXmlProlog(s: string) {
  return s.replace(/<\?xml[\s\S]*?\?>\s*/i, '').trim()
}

function adaptSvgForLightBackground(s: string) {
  return s.replace(/#f3f1f2/gi, '#18181b').replace(/#fafafa/gi, '#18181b')
}

export default function HeaderBrandLogo() {
  const { theme } = useTheme()
  const raw = stripXmlProlog(combomarkSvg)
  const svgMarkup = theme === 'light' ? adaptSvgForLightBackground(raw) : raw

  return (
    <Link
      to="/dashboard"
      aria-label="Go to NextPlay dashboard"
      className="inline-flex max-w-[min(100%,200px)] items-end rounded-md px-0.5 py-0 transition hover:bg-zinc-200/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 dark:hover:bg-zinc-800/50"
    >
      <span
        aria-hidden="true"
        className="[&_svg]:block [&_svg]:h-8 [&_svg]:w-auto [&_svg]:max-w-full sm:[&_svg]:h-9"
        dangerouslySetInnerHTML={{ __html: svgMarkup }}
      />
    </Link>
  )
}

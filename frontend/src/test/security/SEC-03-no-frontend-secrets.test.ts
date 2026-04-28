import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const frontendSrcDir = path.resolve(process.cwd(), 'src')
const forbiddenSecrets = [
  'FOOTBALL_BASKETBALL_API_KEY',
  'BASEBALL_API_KEY',
  'BASEBALL_API_HOST',
]

function collectFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'test') {
        return []
      }
      return collectFiles(fullPath)
    }
    if (!/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      return []
    }
    return [fullPath]
  })
}

describe('SEC-03 Password/sensitive data protected', () => {
  it('does not reference backend provider secret env vars in frontend source', () => {
    const files = collectFiles(frontendSrcDir)
    const violations: string[] = []

    for (const file of files) {
      const source = fs.readFileSync(file, 'utf8')
      for (const secret of forbiddenSecrets) {
        if (source.includes(secret)) {
          violations.push(`${path.relative(process.cwd(), file)} -> ${secret}`)
        }
      }
    }

    expect(violations).toEqual([])
  })
})

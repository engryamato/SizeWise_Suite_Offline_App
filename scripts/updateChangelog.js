import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import pkg from '../package.json' assert { type: 'json' }

const changelogPath = join(process.cwd(), 'CHANGELOG.md')
const changelog = readFileSync(changelogPath, 'utf8')
const versionHeader = `## [${pkg.version}] - ${new Date().toISOString().split('T')[0]}`

if (!changelog.includes(versionHeader)) {
  const entry = `\n${versionHeader}\n### 📦 Phase 0.0\n- Describe changes here.\n\n### Rollback\n- Revert to previous version using git.\n`
  writeFileSync(changelogPath, changelog.trimEnd() + entry)
  console.log('CHANGELOG updated')
} else {
  console.log('CHANGELOG already contains current version')
}

// One-time move of legacy storage objects to org-scoped paths.
//
//   documents / photos:   {user_id}/{project_id}/...       → {org_id}/{project_id}/{kind}/{file}
//   message attachments:  messages/{user_id}/{msg_id}/...  → {org_id}/general/messages/{msg_id}/{file}
//
// Run AFTER supabase/migration-security-storage-rls.sql (legacy files stay
// readable by org-mates until moved, so there's no rush).
//
//   node --env-file=.env.local scripts/migrate-storage-paths.mjs           # dry run
//   node --env-file=.env.local scripts/migrate-storage-paths.mjs --apply   # do it
//
// Uses the service-role key. Safe to re-run: rows already under their org are skipped.

import { createClient } from '@supabase/supabase-js'

const BUCKET = 'documents'
const APPLY = process.argv.includes('--apply')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
const supabase = createClient(url, key, { auth: { persistSession: false } })

const profileOrgCache = new Map()
async function orgForUser(userId) {
  if (!userId) return null
  if (!profileOrgCache.has(userId)) {
    const { data } = await supabase.from('profiles').select('org_id').eq('id', userId).maybeSingle()
    profileOrgCache.set(userId, data?.org_id || null)
  }
  return profileOrgCache.get(userId)
}

const basename = (p) => p.split('/').pop()

async function fetchAll(table, columns) {
  const rows = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select(columns).range(from, from + 999)
    if (error) throw new Error(`${table}: ${error.message}`)
    rows.push(...data)
    if (data.length < 1000) return rows
  }
}

const stats = { moved: 0, skipped: 0, failed: 0 }

async function relocate(table, row, orgId, newPath) {
  const oldPath = row.storage_path
  if (!oldPath || !orgId) { stats.skipped++; return }
  if (oldPath.split('/')[0] === orgId) { stats.skipped++; return }

  console.log(`${APPLY ? 'MOVE' : 'would move'} [${table}] ${oldPath}\n    → ${newPath}`)
  if (!APPLY) { stats.moved++; return }

  const { error: moveErr } = await supabase.storage.from(BUCKET).move(oldPath, newPath)
  if (moveErr) {
    console.error(`  ✗ move failed: ${moveErr.message}`)
    stats.failed++
    return
  }
  const { error: dbErr } = await supabase.from(table).update({ storage_path: newPath }).eq('id', row.id)
  if (dbErr) {
    // Put the file back so the row keeps pointing at a real object
    await supabase.storage.from(BUCKET).move(newPath, oldPath)
    console.error(`  ✗ db update failed (file restored): ${dbErr.message}`)
    stats.failed++
    return
  }
  stats.moved++
}

async function main() {
  console.log(APPLY ? 'Applying storage path migration…\n' : 'Dry run (pass --apply to make changes)\n')

  for (const [table, kind] of [['documents', 'documents'], ['photos', 'photos']]) {
    const rows = await fetchAll(table, 'id, storage_path, org_id, project_id, user_id')
    for (const row of rows) {
      const orgId = row.org_id || await orgForUser(row.user_id)
      const newPath = `${orgId}/${row.project_id || 'general'}/${kind}/${basename(row.storage_path || '')}`
      await relocate(table, row, orgId, newPath)
    }
  }

  const attachments = await fetchAll('message_attachments', 'id, storage_path, message_id, messages(org_id, user_id)')
  for (const row of attachments) {
    const orgId = row.messages?.org_id || await orgForUser(row.messages?.user_id)
    const newPath = `${orgId}/general/messages/${row.message_id}/${basename(row.storage_path || '')}`
    await relocate('message_attachments', row, orgId, newPath)
  }

  console.log(`\n${APPLY ? 'Moved' : 'Would move'}: ${stats.moved}  Skipped: ${stats.skipped}  Failed: ${stats.failed}`)
  if (stats.failed) process.exit(1)
}

main().catch((err) => { console.error(err); process.exit(1) })

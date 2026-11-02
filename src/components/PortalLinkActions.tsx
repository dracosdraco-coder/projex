'use client'

import { useState } from 'react'
import { getPortalLink } from '@/lib/portal-link'
import { useRoles } from '@/hooks/useRoles'

// Copy / Open / Reset buttons for a project's token-based client portal link.
export default function PortalLinkActions({ projectId }: { projectId: string }) {
  const { role } = useRoles()
  const canReset = ['owner', 'admin', 'manager'].includes(role)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const flash = (msg: string) => { setStatus(msg); setTimeout(() => setStatus(null), 2000) }

  const run = async (action: 'copy' | 'open' | 'reset') => {
    // Open the tab synchronously so popup blockers allow it, then point it at the link
    const tab = action === 'open' ? window.open('', '_blank') : null
    setBusy(true)
    try {
      if (action === 'reset' && !confirm('Reset this link? Anyone using the current link will lose access.')) return
      const url = await getPortalLink(projectId, action === 'reset')
      if (action === 'open') {
        if (tab) tab.location.href = url
      } else {
        await navigator.clipboard?.writeText(url)
        flash(action === 'reset' ? 'New link copied' : 'Copied')
      }
    } catch (err: any) {
      tab?.close()
      flash(err?.message || 'Failed')
    } finally {
      setBusy(false)
    }
  }

  const btn = 'px-2.5 py-1.5 text-[10px] font-medium rounded-lg disabled:opacity-50'

  return (
    <div className="flex items-center gap-2 shrink-0">
      {status && <span className="text-[10px] text-gray-500">{status}</span>}
      <button disabled={busy} onClick={() => run('copy')}
        className={`${btn} bg-gray-100 dark:bg-[#222] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#333]`}>
        Copy link
      </button>
      <button disabled={busy} onClick={() => run('open')}
        className={`${btn} bg-blue-600 text-white hover:bg-blue-700`}>
        Open ↗
      </button>
      {canReset && (
        <button disabled={busy} onClick={() => run('reset')} title="Revoke the current link and create a new one"
          className={`${btn} text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20`}>
          Reset
        </button>
      )}
    </div>
  )
}

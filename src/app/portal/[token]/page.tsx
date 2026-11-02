import { createClient } from '@supabase/supabase-js'
import ClientPortalView from './ClientPortalView'

// Only documents a client should see; drafts, rejected and void stay internal
const CLIENT_DOC_STATUSES = ['sent', 'viewed', 'approved', 'paid']

export default async function PortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supaUrl || !supaKey) {
    return <PortalError message="Portal is temporarily unavailable." />
  }

  if (!/^[a-f0-9]{48}$/.test(token)) {
    return <PortalError message="Project not found or link has expired." />
  }

  const supabase = createClient(supaUrl, supaKey)

  // Everything selected here is serialized to the browser — keep it to client-facing fields
  const { data: project, error } = await supabase
    .from('projects')
    .select('id, org_id, name, status, address, description, start_date, end_date, due_date, contract_amount')
    .eq('portal_token', token)
    .single()

  if (error || !project) {
    return <PortalError message="Project not found or link has expired." />
  }

  const [{ data: phases }, { data: documents }, { data: org }] = await Promise.all([
    supabase.from('phases')
      .select('id, name, description, status, start_date, end_date, created_at')
      .eq('project_id', project.id)
      .order('created_at'),
    supabase.from('generated_documents')
      .select('id, document_number, type, status, total, date_issued, date_due, date_paid, created_at, line_items')
      .eq('project_id', project.id)
      .in('status', CLIENT_DOC_STATUSES)
      .order('created_at', { ascending: false }),
    project.org_id
      ? supabase.from('organizations').select('name').eq('id', project.org_id).single()
      : Promise.resolve({ data: null }),
  ])

  // Line items can carry cost/margin fields — pass through only what the client sees
  const clientDocuments = (documents || []).map(({ line_items, ...doc }: any) => ({
    ...doc,
    line_items: (line_items || []).map((li: any) => ({
      description: li.description || li.name || 'Item',
      amount: li.price || li.total || ((li.quantity || 0) * (li.unitPrice || 0)),
    })),
  }))

  const { org_id: _orgId, ...clientProject } = project

  return (
    <ClientPortalView
      project={clientProject}
      phases={phases || []}
      documents={clientDocuments}
      orgName={(org as any)?.name || 'Projex'}
    />
  )
}

function PortalError({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight mb-2">PROJEX</h1>
        <p className="text-sm text-gray-500">{message}</p>
      </div>
    </div>
  )
}

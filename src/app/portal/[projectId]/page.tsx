import { createClient } from '@supabase/supabase-js'
import ClientPortalView from './ClientPortalView'

export default async function PortalPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supaUrl || !supaKey) {
    return <PortalError message="Portal is temporarily unavailable." />
  }

  const supabase = createClient(supaUrl, supaKey)

  // Fetch project
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (error || !project) {
    return <PortalError message="Project not found or link has expired." />
  }

  // Fetch related data
  const [
    { data: phases },
    { data: documents },
    { data: expenses },
  ] = await Promise.all([
    supabase.from('phases').select('*').eq('project_id', projectId).order('created_at'),
    supabase.from('generated_documents').select('id, document_number, type, status, total, subtotal, tax_total, date_issued, date_due, date_paid, date_sent, client_name, client_email, line_items, terms, notes, created_at').eq('project_id', projectId).order('created_at', { ascending: false }),
    supabase.from('expenses').select('id, description, amount, category, date').eq('project_id', projectId).order('date', { ascending: false }),
  ])

  // Get org info for branding
  let orgName = 'Projex'
  if (project.org_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('name, phone, email, website')
      .eq('id', project.org_id)
      .single()
    if (org?.name) orgName = org.name
  }

  return (
    <ClientPortalView
      project={project}
      phases={phases || []}
      documents={documents || []}
      expenses={expenses || []}
      orgName={orgName}
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

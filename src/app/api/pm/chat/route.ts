import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Tool definitions ────────────────────────────────────────────────────────

const PM_TOOLS: Anthropic.Tool[] = [
  {
    name: 'list_projects',
    description: 'List all projects. Returns name, status, budget, contract amount, progress, client, due date. Use this first when asked about jobs, projects, or workload.',
    input_schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['active', 'completed', 'on-hold', 'cancelled'],
          description: 'Optional: filter by status',
        },
      },
    },
  },
  {
    name: 'get_project_details',
    description: 'Get full details for one project: tasks, team members, expenses, and all generated documents (estimates, invoices, change orders).',
    input_schema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'The project ID' },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'list_documents',
    description: 'List generated financial documents (estimates, invoices, change orders, purchase orders). Filter by type or status.',
    input_schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['estimate', 'invoice', 'change-order', 'purchase-order', 'work-order', 'proposal', 'contract'],
          description: 'Document type filter',
        },
        status: {
          type: 'string',
          enum: ['draft', 'sent', 'viewed', 'approved', 'rejected', 'paid', 'void', 'overdue'],
          description: 'Status filter — use "overdue" to find past-due unpaid invoices',
        },
        project_id: { type: 'string', description: 'Filter to one project' },
      },
    },
  },
  {
    name: 'get_financial_summary',
    description: 'Overall financial snapshot: total contract value, amount paid, amount outstanding, overdue totals, and project counts by status. Use this for "how are we doing" type questions.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_tasks',
    description: 'List tasks across projects, with status, priority, assignee, and due dates.',
    input_schema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Optional: filter to one project' },
        status: {
          type: 'string',
          enum: ['todo', 'in-progress', 'review', 'completed'],
          description: 'Optional: filter by task status',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'urgent'],
          description: 'Optional: filter by priority',
        },
      },
    },
  },
]

// ── Tool execution ──────────────────────────────────────────────────────────

async function runTool(name: string, input: any, supabase: any): Promise<any> {
  const today = new Date().toISOString().split('T')[0]

  switch (name) {
    case 'list_projects': {
      let q = supabase
        .from('projects')
        .select('id, name, status, progress, budget, contract_amount, actual_cost, client_name, client_email, due_date, start_date, end_date, description, address, created_at')
        .order('created_at', { ascending: false })
      if (input?.status) q = q.eq('status', input.status)
      const { data, error } = await q
      if (error) return { error: error.message }
      return { projects: data, count: data?.length ?? 0 }
    }

    case 'get_project_details': {
      const [proj, tasks, expenses, docs, team] = await Promise.all([
        supabase.from('projects').select('*').eq('id', input.project_id).single(),
        supabase.from('tasks').select('id, title, status, priority, assigned_to, due_date, estimated_hours, actual_hours, estimated_cost, actual_cost').eq('project_id', input.project_id),
        supabase.from('expenses').select('id, category, amount, date, vendor, description').eq('project_id', input.project_id),
        supabase.from('generated_documents').select('id, type, status, document_number, total, subtotal, date_issued, date_due, client_name').eq('project_id', input.project_id).order('date_issued', { ascending: false }),
        supabase.from('project_team').select('team_member_id, role').eq('project_id', input.project_id),
      ])
      const expenseTotal = expenses.data?.reduce((s: number, e: any) => s + (e.amount || 0), 0) ?? 0
      return {
        project: proj.data,
        tasks: tasks.data ?? [],
        expenses: { items: expenses.data ?? [], total: expenseTotal },
        documents: docs.data ?? [],
        team: team.data ?? [],
      }
    }

    case 'list_documents': {
      let q = supabase
        .from('generated_documents')
        .select('id, type, status, document_number, total, subtotal, date_issued, date_due, date_paid, client_name, project_id, created_at')
        .order('date_issued', { ascending: false })
        .limit(50)
      if (input?.type) q = q.eq('type', input.type)
      if (input?.project_id) q = q.eq('project_id', input.project_id)
      if (input?.status === 'overdue') {
        q = q.lt('date_due', today).not('status', 'in', '("paid","void","draft")')
      } else if (input?.status) {
        q = q.eq('status', input.status)
      }
      const { data, error } = await q
      if (error) return { error: error.message }
      return { documents: data, count: data?.length ?? 0 }
    }

    case 'get_financial_summary': {
      const [projects, docs] = await Promise.all([
        supabase.from('projects').select('id, name, status, budget, contract_amount, actual_cost'),
        supabase.from('generated_documents').select('type, status, total, date_due, date_paid'),
      ])
      const p = projects.data ?? []
      const d = docs.data ?? []
      const invoices = d.filter((x: any) => x.type === 'invoice')
      const paid = invoices.filter((x: any) => x.status === 'paid').reduce((s: number, x: any) => s + (x.total || 0), 0)
      const outstanding = invoices.filter((x: any) => ['sent', 'viewed', 'approved'].includes(x.status)).reduce((s: number, x: any) => s + (x.total || 0), 0)
      const overdueItems = invoices.filter((x: any) => x.date_due && x.date_due < today && !['paid', 'void'].includes(x.status))
      const overdueTotal = overdueItems.reduce((s: number, x: any) => s + (x.total || 0), 0)
      const estimatesPending = d.filter((x: any) => x.type === 'estimate' && ['sent', 'viewed'].includes(x.status)).reduce((s: number, x: any) => s + (x.total || 0), 0)
      return {
        projects: {
          total: p.length,
          active: p.filter((x: any) => x.status === 'active').length,
          completed: p.filter((x: any) => x.status === 'completed').length,
          onHold: p.filter((x: any) => x.status === 'on-hold').length,
          totalContractValue: p.reduce((s: number, x: any) => s + (x.contract_amount || 0), 0),
        },
        invoices: { paid, outstanding, overdueTotal, overdueCount: overdueItems.length },
        estimatesPendingApproval: estimatesPending,
        today,
      }
    }

    case 'list_tasks': {
      let q = supabase
        .from('tasks')
        .select('id, title, status, priority, assigned_to, due_date, project_id, estimated_hours, actual_hours, estimated_cost, actual_cost, created_at')
        .order('due_date', { ascending: true })
        .limit(100)
      if (input?.project_id) q = q.eq('project_id', input.project_id)
      if (input?.status) q = q.eq('status', input.status)
      if (input?.priority) q = q.eq('priority', input.priority)
      const { data, error } = await q
      if (error) return { error: error.message }
      return { tasks: data, count: data?.length ?? 0 }
    }

    default:
      return { error: `Unknown tool: ${name}` }
  }
}

// ── System prompt ───────────────────────────────────────────────────────────

function buildSystemPrompt(projectSummaries: any[]): string {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const snapshot = projectSummaries.length > 0
    ? projectSummaries.map(p =>
        `• ${p.name} (${p.status}) — Client: ${p.client_name || 'TBD'} | Contract: $${(p.contract_amount || 0).toLocaleString()} | Progress: ${p.progress || 0}%${p.due_date ? ` | Due: ${p.due_date}` : ''}`
      ).join('\n')
    : 'No projects yet.'

  return `You are a sharp, experienced AI Project Manager for a contracting and construction company. You have real-time access to all project data, finances, invoices, tasks, and team information.

Today: ${today}

Current project snapshot:
${snapshot}

Your role:
- Answer questions about projects, finances, clients, and deadlines with precision
- Proactively surface risks: overdue invoices, budget overruns, approaching deadlines, stalled tasks
- Give business-level insights, not just data dumps — tell the user what matters
- Format lists and tables clearly; be concise but complete
- When you need more detail, use your tools before answering — don't guess

Phase 1 capabilities: Query and answer questions about all project data.
Phase 2 (coming soon): Create estimates, invoices, projects, and purchase orders directly from this chat.

Speak like a senior PM, not a chatbot. Be direct.`
}

// ── Route handler ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { messages } = await req.json()

  // Load lightweight project snapshot for system prompt
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, status, progress, contract_amount, client_name, due_date')
    .order('updated_at', { ascending: false })
    .limit(20)

  const systemPrompt = buildSystemPrompt(projects ?? [])

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))

      try {
        // Agentic loop — handles multi-step tool use
        let currentMessages: Anthropic.MessageParam[] = messages.map((m: any) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content as string,
        }))

        for (let turn = 0; turn < 5; turn++) {
          const aiStream = anthropic.messages.stream({
            model: 'claude-sonnet-4-6',
            max_tokens: 2048,
            system: systemPrompt,
            messages: currentMessages,
            tools: PM_TOOLS,
          })

          // Collect content blocks while streaming text to client
          const contentBlocks: any[] = []
          let currentBlock: any = null
          let currentJson = ''

          for await (const event of aiStream) {
            if (event.type === 'content_block_start') {
              if (event.content_block.type === 'text') {
                currentBlock = { type: 'text', text: '' }
                contentBlocks.push(currentBlock)
              } else if (event.content_block.type === 'tool_use') {
                currentBlock = { type: 'tool_use', id: event.content_block.id, name: event.content_block.name, input: {} }
                currentJson = ''
                contentBlocks.push(currentBlock)
                send({ type: 'tool_start', name: event.content_block.name })
              }
            } else if (event.type === 'content_block_delta') {
              if (event.delta.type === 'text_delta' && currentBlock?.type === 'text') {
                currentBlock.text += event.delta.text
                send({ type: 'text', text: event.delta.text })
              } else if (event.delta.type === 'input_json_delta' && currentBlock?.type === 'tool_use') {
                currentJson += event.delta.partial_json
              }
            } else if (event.type === 'content_block_stop') {
              if (currentBlock?.type === 'tool_use') {
                try { currentBlock.input = JSON.parse(currentJson) } catch { currentBlock.input = {} }
              }
              currentBlock = null
              currentJson = ''
            }
          }

          const finalMsg = await aiStream.finalMessage()

          if (finalMsg.stop_reason !== 'tool_use') break

          // Execute all tool calls
          const toolResults: Anthropic.ToolResultBlockParam[] = []
          for (const block of contentBlocks.filter(b => b.type === 'tool_use')) {
            const result = await runTool(block.name, block.input, supabase)
            toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) })
          }

          // Append assistant + tool results and loop
          currentMessages = [
            ...currentMessages,
            { role: 'assistant', content: contentBlocks },
            { role: 'user', content: toolResults },
          ]
        }

        send({ type: 'done' })
      } catch (err: any) {
        console.error('PM chat error:', err)
        send({ type: 'error', message: 'Something went wrong. Please try again.' })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  })
}

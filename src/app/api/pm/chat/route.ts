import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Tool definitions ────────────────────────────────────────────────────────

const PM_TOOLS: Anthropic.Tool[] = [
  // ── Read tools ──────────────────────────────────────────────────────────
  {
    name: 'list_projects',
    description: 'List all projects with status, budget, contract amount, progress, client, and due date.',
    input_schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['active', 'completed', 'on-hold', 'cancelled'] },
      },
    },
  },
  {
    name: 'get_project_details',
    description: 'Get full details for one project: tasks, expenses, team, and all documents.',
    input_schema: {
      type: 'object',
      properties: {
        project_id: { type: 'string' },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'list_documents',
    description: 'List financial documents. Use status "overdue" for past-due unpaid invoices.',
    input_schema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['estimate', 'invoice', 'change-order', 'purchase-order', 'work-order', 'proposal', 'contract'] },
        status: { type: 'string', enum: ['draft', 'sent', 'viewed', 'approved', 'rejected', 'paid', 'void', 'overdue'] },
        project_id: { type: 'string' },
      },
    },
  },
  {
    name: 'get_financial_summary',
    description: 'Overall financial snapshot: paid, outstanding, overdue totals, project counts.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'list_tasks',
    description: 'List tasks with status, priority, assignee, and due dates.',
    input_schema: {
      type: 'object',
      properties: {
        project_id: { type: 'string' },
        status: { type: 'string', enum: ['todo', 'in-progress', 'review', 'completed'] },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
      },
    },
  },

  // ── Write tools (propose → client confirms → client writes) ─────────────
  {
    name: 'propose_create_document',
    description: 'Propose creating an estimate, invoice, change order, or purchase order. Always call list_projects first to get the correct project_id. The user will confirm before it is saved.',
    input_schema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['estimate', 'invoice', 'change-order', 'purchase-order', 'work-order'] },
        project_id: { type: 'string', description: 'Project to attach this document to' },
        client_name: { type: 'string' },
        client_email: { type: 'string' },
        client_address: { type: 'string' },
        line_items: {
          type: 'array',
          description: 'Line items for the document',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              quantity: { type: 'number' },
              unit: { type: 'string' },
              price: { type: 'number', description: 'Unit price (client-facing)' },
            },
            required: ['description', 'quantity', 'price'],
          },
        },
        scope_of_work: { type: 'string' },
        terms: { type: 'string' },
        notes: { type: 'string' },
        tax_rate: { type: 'number', description: 'Tax percentage, e.g. 8 for 8%' },
        date_due: { type: 'string', description: 'ISO date string YYYY-MM-DD' },
      },
      required: ['type', 'line_items'],
    },
  },
  {
    name: 'propose_create_project',
    description: 'Propose creating a new project. The user will confirm before it is saved.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Project name' },
        client: { type: 'string', description: 'Client name' },
        client_email: { type: 'string' },
        client_phone: { type: 'string' },
        address: { type: 'string', description: 'Job site address' },
        description: { type: 'string' },
        contract_amount: { type: 'number' },
        start_date: { type: 'string', description: 'YYYY-MM-DD' },
        due_date: { type: 'string', description: 'YYYY-MM-DD' },
        status: { type: 'string', enum: ['active', 'on-hold'] },
      },
      required: ['name'],
    },
  },
  {
    name: 'propose_create_task',
    description: 'Propose adding a task to a project. The user will confirm before it is saved.',
    input_schema: {
      type: 'object',
      properties: {
        project_id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
        due_date: { type: 'string', description: 'YYYY-MM-DD' },
        estimated_hours: { type: 'number' },
        estimated_cost: { type: 'number' },
      },
      required: ['project_id', 'title'],
    },
  },
  {
    name: 'propose_update_document',
    description: 'Propose updating a document status (paid, sent, approved, void). Use list_documents first to get the document ID.',
    input_schema: {
      type: 'object',
      properties: {
        document_id: { type: 'string' },
        document_number: { type: 'string', description: 'For display in the confirmation card' },
        status: { type: 'string', enum: ['sent', 'viewed', 'approved', 'paid', 'void'] },
        date_paid: { type: 'string', description: 'YYYY-MM-DD — required when marking as paid' },
        client_name: { type: 'string', description: 'For display' },
      },
      required: ['document_id', 'status'],
    },
  },
  {
    name: 'propose_log_expense',
    description: 'Propose logging an expense to a project. Use list_projects first to get the project_id.',
    input_schema: {
      type: 'object',
      properties: {
        project_id: { type: 'string' },
        project_name: { type: 'string', description: 'For display' },
        description: { type: 'string' },
        amount: { type: 'number' },
        category: { type: 'string', enum: ['materials', 'labor', 'equipment', 'subcontractor', 'other'] },
        vendor: { type: 'string' },
        date: { type: 'string', description: 'YYYY-MM-DD' },
      },
      required: ['project_id', 'description', 'amount'],
    },
  },
  {
    name: 'propose_update_project',
    description: 'Propose updating a project status or progress percentage.',
    input_schema: {
      type: 'object',
      properties: {
        project_id: { type: 'string' },
        project_name: { type: 'string', description: 'For display' },
        status: { type: 'string', enum: ['active', 'completed', 'on-hold', 'cancelled'] },
        progress: { type: 'number', description: '0–100 completion percentage' },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'propose_update_task',
    description: 'Propose updating a task status or priority. Use list_tasks first to get the task_id.',
    input_schema: {
      type: 'object',
      properties: {
        task_id: { type: 'string' },
        task_title: { type: 'string', description: 'For display' },
        status: { type: 'string', enum: ['todo', 'in-progress', 'review', 'completed'] },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
      },
      required: ['task_id', 'status'],
    },
  },
  {
    name: 'propose_create_freeform',
    description: 'Generate a freeform business document: delay notice, lien waiver, subcontractor agreement, demand letter, or any correspondence. Write the full content yourself.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Document title, e.g. "Notice of Project Delay"' },
        content: { type: 'string', description: 'Full document body — use \\n\\n for paragraphs, write professionally' },
        project_id: { type: 'string' },
        client_name: { type: 'string' },
      },
      required: ['title', 'content'],
    },
  },
]

// ── Tool execution ──────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

async function runTool(
  name: string,
  input: any,
  supabase: any,
  send: (event: object) => void,
): Promise<any> {
  const today = new Date().toISOString().split('T')[0]

  switch (name) {
    case 'list_projects': {
      let q = supabase
        .from('projects')
        .select('id, name, status, progress, budget, contract_amount, actual_cost, client_name, client_email, due_date, start_date, description, address, created_at')
        .order('created_at', { ascending: false })
      if (input?.status) q = q.eq('status', input.status)
      const { data, error } = await q
      if (error) return { error: error.message }
      return { projects: data, count: data?.length ?? 0 }
    }

    case 'get_project_details': {
      const [proj, tasks, expenses, docs] = await Promise.all([
        supabase.from('projects').select('*').eq('id', input.project_id).single(),
        supabase.from('tasks').select('id, title, status, priority, due_date, estimated_hours, actual_hours, estimated_cost, actual_cost').eq('project_id', input.project_id),
        supabase.from('expenses').select('id, category, amount, date, vendor, description').eq('project_id', input.project_id),
        supabase.from('generated_documents').select('id, type, status, document_number, total, date_issued, date_due, client_name').eq('project_id', input.project_id).order('date_issued', { ascending: false }),
      ])
      const expenseTotal = expenses.data?.reduce((s: number, e: any) => s + (e.amount || 0), 0) ?? 0
      return { project: proj.data, tasks: tasks.data ?? [], expenses: { items: expenses.data ?? [], total: expenseTotal }, documents: docs.data ?? [] }
    }

    case 'list_documents': {
      let q = supabase
        .from('generated_documents')
        .select('id, type, status, document_number, total, subtotal, date_issued, date_due, date_paid, client_name, project_id')
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
        supabase.from('generated_documents').select('type, status, total, date_due'),
      ])
      const p = projects.data ?? [], d = docs.data ?? []
      const invoices = d.filter((x: any) => x.type === 'invoice')
      const paid = invoices.filter((x: any) => x.status === 'paid').reduce((s: number, x: any) => s + (x.total || 0), 0)
      const outstanding = invoices.filter((x: any) => ['sent', 'viewed', 'approved'].includes(x.status)).reduce((s: number, x: any) => s + (x.total || 0), 0)
      const overdueItems = invoices.filter((x: any) => x.date_due && x.date_due < today && !['paid', 'void'].includes(x.status))
      return {
        projects: { total: p.length, active: p.filter((x: any) => x.status === 'active').length, completed: p.filter((x: any) => x.status === 'completed').length, onHold: p.filter((x: any) => x.status === 'on-hold').length, totalContractValue: p.reduce((s: number, x: any) => s + (x.contract_amount || 0), 0) },
        invoices: { paid, outstanding, overdueTotal: overdueItems.reduce((s: number, x: any) => s + (x.total || 0), 0), overdueCount: overdueItems.length },
        estimatesPendingApproval: d.filter((x: any) => x.type === 'estimate' && ['sent', 'viewed'].includes(x.status)).reduce((s: number, x: any) => s + (x.total || 0), 0),
        today,
      }
    }

    case 'list_tasks': {
      let q = supabase.from('tasks').select('id, title, status, priority, due_date, project_id, estimated_hours, actual_hours').order('due_date', { ascending: true }).limit(100)
      if (input?.project_id) q = q.eq('project_id', input.project_id)
      if (input?.status) q = q.eq('status', input.status)
      if (input?.priority) q = q.eq('priority', input.priority)
      const { data, error } = await q
      if (error) return { error: error.message }
      return { tasks: data, count: data?.length ?? 0 }
    }

    // ── Propose tools ──────────────────────────────────────────────────────

    case 'propose_create_document': {
      const items = (input.line_items || []).map((li: any, i: number) => ({
        id: String(Date.now() + i),
        description: li.description || '',
        quantity: Number(li.quantity) || 1,
        unit: li.unit || 'ea',
        cost: 0, markup: 0,
        price: Number(li.price) || 0,
      }))
      const subtotal = items.reduce((s: number, li: any) => s + li.quantity * li.price, 0)
      const taxRate = Number(input.tax_rate) || 0
      const taxTotal = subtotal * (taxRate / 100)
      const total = subtotal + taxTotal
      const typeLabel = (input.type as string).replace('-', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
      const summary = `New ${typeLabel} — ${input.client_name || 'client'} · ${items.length} item${items.length !== 1 ? 's' : ''} · ${fmt(total)}`

      send({
        type: 'action',
        actionType: 'create_document',
        id: `act_${Date.now()}`,
        summary,
        data: {
          type: input.type,
          projectId: input.project_id || null,
          clientName: input.client_name || '',
          clientEmail: input.client_email || '',
          clientAddress: input.client_address || '',
          lineItems: items,
          scopeOfWork: input.scope_of_work || '',
          terms: input.terms || '',
          notes: input.notes || '',
          taxRate,
          subtotal,
          taxTotal,
          total,
          dateIssued: today,
          dateDue: input.date_due || '',
          status: 'draft',
        },
      })
      return { status: 'pending_confirmation', summary }
    }

    case 'propose_create_project': {
      const summary = `New project: ${input.name}${input.client ? ` for ${input.client}` : ''}${input.contract_amount ? ` · ${fmt(input.contract_amount)}` : ''}`
      send({
        type: 'action',
        actionType: 'create_project',
        id: `act_${Date.now()}`,
        summary,
        data: {
          name: input.name,
          client: input.client || '',
          clientEmail: input.client_email || '',
          clientPhone: input.client_phone || '',
          address: input.address || '',
          description: input.description || '',
          contractAmount: input.contract_amount || 0,
          startDate: input.start_date || '',
          dueDate: input.due_date || '',
          status: input.status || 'active',
        },
      })
      return { status: 'pending_confirmation', summary }
    }

    case 'propose_create_task': {
      const summary = `New task: "${input.title}"${input.priority ? ` · ${input.priority} priority` : ''}${input.due_date ? ` · due ${input.due_date}` : ''}`
      send({
        type: 'action',
        actionType: 'create_task',
        id: `act_${Date.now()}`,
        summary,
        data: {
          projectId: input.project_id,
          title: input.title,
          description: input.description || '',
          priority: input.priority || 'medium',
          dueDate: input.due_date || '',
          estimatedHours: input.estimated_hours || 0,
          estimatedCost: input.estimated_cost || 0,
          status: 'todo',
        },
      })
      return { status: 'pending_confirmation', summary }
    }

    case 'propose_update_document': {
      const statusLabel = input.status.charAt(0).toUpperCase() + input.status.slice(1)
      const summary = `Mark ${input.document_number || 'document'} as ${statusLabel}${input.client_name ? ` — ${input.client_name}` : ''}`
      send({
        type: 'action', actionType: 'update_document',
        id: `act_${Date.now()}`, summary,
        data: {
          documentId: input.document_id,
          documentNumber: input.document_number || '',
          clientName: input.client_name || '',
          status: input.status,
          datePaid: input.status === 'paid' ? (input.date_paid || today) : undefined,
        },
      })
      return { status: 'pending_confirmation', summary }
    }

    case 'propose_log_expense': {
      const summary = `Log ${fmt(input.amount)} expense — ${input.description}${input.vendor ? ` · ${input.vendor}` : ''}${input.project_name ? ` → ${input.project_name}` : ''}`
      send({
        type: 'action', actionType: 'log_expense',
        id: `act_${Date.now()}`, summary,
        data: {
          projectId: input.project_id,
          projectName: input.project_name || '',
          description: input.description,
          amount: input.amount,
          category: input.category || 'other',
          vendor: input.vendor || '',
          date: input.date || today,
        },
      })
      return { status: 'pending_confirmation', summary }
    }

    case 'propose_update_project': {
      const changes: string[] = []
      if (input.status) changes.push(`status → ${input.status}`)
      if (input.progress !== undefined) changes.push(`progress → ${input.progress}%`)
      const summary = `Update ${input.project_name || 'project'}: ${changes.join(', ')}`
      send({
        type: 'action', actionType: 'update_project',
        id: `act_${Date.now()}`, summary,
        data: {
          projectId: input.project_id,
          projectName: input.project_name || '',
          status: input.status,
          progress: input.progress,
        },
      })
      return { status: 'pending_confirmation', summary }
    }

    case 'propose_update_task': {
      const summary = `Update task "${input.task_title || input.task_id}": ${input.status}${input.priority ? ` · ${input.priority}` : ''}`
      send({
        type: 'action', actionType: 'update_task',
        id: `act_${Date.now()}`, summary,
        data: {
          taskId: input.task_id,
          taskTitle: input.task_title || '',
          status: input.status,
          priority: input.priority,
        },
      })
      return { status: 'pending_confirmation', summary }
    }

    case 'propose_create_freeform': {
      const summary = `New document: "${input.title}"${input.client_name ? ` for ${input.client_name}` : ''}`
      send({
        type: 'action', actionType: 'create_freeform',
        id: `act_${Date.now()}`, summary,
        data: {
          title: input.title,
          content: input.content,
          projectId: input.project_id || null,
          clientName: input.client_name || '',
          type: 'proposal',
          notes: JSON.stringify({ freeform: true, title: input.title, content: input.content }),
          status: 'draft',
          dateIssued: today,
          lineItems: [],
          subtotal: 0, taxTotal: 0, total: 0,
        },
      })
      return { status: 'pending_confirmation', summary }
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
        `• ${p.name} [id:${p.id}] (${p.status}) — Client: ${p.client_name || 'TBD'} | Contract: $${(p.contract_amount || 0).toLocaleString()} | Progress: ${p.progress || 0}%${p.due_date ? ` | Due: ${p.due_date}` : ''}`
      ).join('\n')
    : 'No projects yet.'

  return `You are a sharp AI Project Manager for a contracting and construction company. You have real-time access to all project data, finances, invoices, tasks, and can create new records.

Today: ${today}

Current projects (use these IDs when creating documents or tasks):
${snapshot}

Capabilities:
- Query and answer questions about projects, finances, invoices, tasks
- Create estimates, invoices, change orders, purchase orders → propose_create_document
- Create new projects → propose_create_project
- Add tasks → propose_create_task
- Mark invoices/estimates paid, sent, approved, void → propose_update_document (get ID from list_documents first)
- Log expenses to projects → propose_log_expense
- Update project status or progress → propose_update_project
- Update task status → propose_update_task
- Write freeform documents (delay notices, lien waivers, agreements, letters) → propose_create_freeform

Rules:
- When creating a document for a project, always call list_projects first if you don't already have the project_id
- When you propose a creation, tell the user what you've prepared and ask them to confirm below
- Surface risks proactively: overdue invoices, budget overruns, approaching deadlines
- Be direct and specific — this is a business tool, not a chatbot
- Format lists clearly; use **bold** for important numbers`
}

// ── Route handler ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { messages } = await req.json()

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
        let currentMessages: Anthropic.MessageParam[] = messages.map((m: any) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content as string,
        }))

        for (let turn = 0; turn < 6; turn++) {
          const aiStream = anthropic.messages.stream({
            model: 'claude-sonnet-4-6',
            max_tokens: 2048,
            system: systemPrompt,
            messages: currentMessages,
            tools: PM_TOOLS,
          })

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

          const toolResults: Anthropic.ToolResultBlockParam[] = []
          for (const block of contentBlocks.filter(b => b.type === 'tool_use')) {
            const result = await runTool(block.name, block.input, supabase, send)
            toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) })
          }

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
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' },
  })
}

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const FILL_TOOL: Anthropic.Tool = {
  name: 'fill_document',
  description: 'Return structured data to fill a contractor document form',
  input_schema: {
    type: 'object',
    properties: {
      lineItems: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            quantity: { type: 'number' },
            unit: { type: 'string' },
            price: { type: 'number', description: 'Client-facing unit price in USD' },
          },
          required: ['description', 'quantity', 'unit', 'price'],
        },
      },
      scopeOfWork: {
        type: 'string',
        description: 'Clear professional scope of work paragraph. Use - prefix for bullet lines.',
      },
      terms: { type: 'string', description: 'Relevant payment and project terms' },
      notes: { type: 'string', description: 'Any important notes or clarifications' },
    },
    required: ['lineItems', 'scopeOfWork'],
  },
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type, description, photos = [] } = await req.json()
  if (!description?.trim()) return NextResponse.json({ error: 'Description required' }, { status: 400 })

  const typeLabel = (type as string).replace(/[-_]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())

  const userContent: Anthropic.MessageParam['content'] = [
    {
      type: 'text',
      text: `Generate line items and scope of work for this ${typeLabel}:\n\n${description.trim()}\n\nUse realistic market-rate pricing for residential/commercial contracting work.`,
    },
    ...photos.slice(0, 4).map((photo: string) => ({
      type: 'image' as const,
      source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data: photo.split(',')[1] || photo },
    })),
  ]

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: `You are an expert contractor estimator. Given a description of work, produce accurate line items with realistic pricing and a professional scope of work. Be specific — include materials, labor, and any prep/cleanup items that are standard for the work described. Prices should reflect current market rates.`,
    messages: [{ role: 'user', content: userContent }],
    tools: [FILL_TOOL],
    tool_choice: { type: 'any' },
  })

  const toolUse = response.content.find(b => b.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') {
    return NextResponse.json({ error: 'No structured response from AI' }, { status: 500 })
  }

  return NextResponse.json(toolUse.input)
}

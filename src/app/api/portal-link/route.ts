import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { requireUser } from '@/lib/auth-server'

const newToken = () => crypto.randomBytes(24).toString('hex')

// Returns the client portal URL for a project in the caller's org.
// { regenerate: true } rotates the token, which revokes every previously shared link.
export async function POST(req: NextRequest) {
  try {
    const { ctx, error } = await requireUser({ requireOrg: true })
    if (error) return error

    const { projectId, regenerate } = await req.json()
    if (typeof projectId !== 'string') {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
    }

    if (regenerate && !['owner', 'admin', 'manager'].includes(ctx.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { data: project } = await ctx.admin
      .from('projects')
      .select('id, portal_token')
      .eq('id', projectId)
      .eq('org_id', ctx.orgId!)
      .maybeSingle()

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    let token = project.portal_token as string | null
    if (!token || regenerate) {
      token = newToken()
      const { error: updateErr } = await ctx.admin.from('projects').update({ portal_token: token }).eq('id', project.id)
      if (updateErr) return NextResponse.json({ error: 'Could not create portal link' }, { status: 500 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin
    return NextResponse.json({ url: `${appUrl}/portal/${token}` })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

import nodemailer from 'nodemailer'
import type { SupabaseClient } from '@supabase/supabase-js'
import { escapeHtml } from '@/lib/auth-server'

// Owners are created with the org, never invited
export const ASSIGNABLE_ROLES = ['admin', 'manager', 'supervisor', 'worker', 'viewer']

// Seat limits per plan — counts the owner + members + open invites
const PLAN_SEAT_LIMITS: Record<string, number> = {
  free: 1, duo: 2, team: 5, business: 10, enterprise: 20,
}

export const appUrl = () => process.env.NEXT_PUBLIC_APP_URL || 'https://projex.live'
export const inviteUrl = (token: string) => `${appUrl()}/invite/${token}`

export async function getSeatUsage(admin: SupabaseClient, orgId: string, ownerUserId?: string) {
  let sub: any = null
  const { data: orgSub } = await admin.from('subscriptions')
    .select('plan, status').eq('org_id', orgId)
    .order('created_at', { ascending: false }).limit(1).maybeSingle()
  sub = orgSub
  if (!sub && ownerUserId) {
    const { data } = await admin.from('subscriptions').select('plan, status').eq('user_id', ownerUserId).maybeSingle()
    sub = data
  }

  const plan: string = sub?.plan || 'free'
  const status: string = sub?.status || 'none'
  const max = PLAN_SEAT_LIMITS[plan] || 1

  const [{ count: members }, { count: invites }] = await Promise.all([
    admin.from('org_members').select('id', { count: 'exact', head: true })
      .eq('org_id', orgId).eq('status', 'active'),
    admin.from('org_invites').select('id', { count: 'exact', head: true })
      .eq('org_id', orgId).is('accepted_at', null).is('revoked_at', null)
      .gt('expires_at', new Date().toISOString()),
  ])

  return {
    plan, status, max,
    used: (members || 1) + (invites || 0),
    subscribed: plan !== 'free' && (status === 'active' || status === 'trialing'),
  }
}

/** Returns true if the email was handed to SMTP, false if SMTP isn't configured or sending failed. */
export async function sendInviteEmail(opts: { to: string; inviterName: string; orgName: string; role: string; url: string }) {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return false

  const port = parseInt(process.env.SMTP_PORT || '465')
  const inviter = escapeHtml(opts.inviterName)
  const org = escapeHtml(opts.orgName)
  const role = escapeHtml(opts.role)

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST, port, secure: port === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
    await transporter.sendMail({
      from: process.env.SMTP_FROM || SMTP_USER,
      to: opts.to,
      subject: `${opts.inviterName} invited you to join ${opts.orgName} on Projex`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 20px; font-weight: 700; color: #111; letter-spacing: -0.5px; margin: 0;">PROJEX</h1>
          </div>
          <div style="background: #fafafa; border-radius: 12px; padding: 32px; border: 1px solid #e5e5e5;">
            <h2 style="font-size: 18px; font-weight: 600; color: #111; margin: 0 0 8px 0;">You've been invited</h2>
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
              <strong>${inviter}</strong> has invited you to join <strong>${org}</strong> on Projex as a <strong>${role}</strong>.
            </p>
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
              You don't need your own subscription. This link expires in 7 days.
            </p>
            <a href="${opts.url}" style="display: inline-block; background: #111; color: #fff; padding: 12px 28px; border-radius: 100px; text-decoration: none; font-size: 14px; font-weight: 500;">
              Accept Invite
            </a>
          </div>
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 24px;">
            Projex — Construction management, reimagined.
          </p>
        </div>
      `,
      text: `${opts.inviterName} invited you to join ${opts.orgName} on Projex as a ${opts.role}. Accept within 7 days: ${opts.url}`,
    })
    return true
  } catch (err: any) {
    console.error('Invite email failed:', err.message)
    return false
  }
}

export async function getInviterContext(admin: SupabaseClient, userId: string, orgId: string) {
  const [{ data: profile }, { data: org }] = await Promise.all([
    admin.from('profiles').select('full_name').eq('id', userId).maybeSingle(),
    admin.from('organizations').select('name, owner_id').eq('id', orgId).maybeSingle(),
  ])
  return {
    inviterName: profile?.full_name || 'Your team admin',
    orgName: org?.name || 'their team',
    ownerId: org?.owner_id as string | undefined,
  }
}

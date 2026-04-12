import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

// Seat limits per plan — counts the owner + team members
const PLAN_SEAT_LIMITS: Record<string, number> = {
  free: 1, duo: 2, team: 5, business: 10, enterprise: 20,
}

export async function POST(req: NextRequest) {
  try {
    const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supaUrl || !supaKey) {
      return NextResponse.json({ error: 'Server config error' }, { status: 500 })
    }

    const supabase = createClient(supaUrl, supaKey)
    const { userId, memberName, memberEmail, memberRole } = await req.json()

    if (!userId || !memberEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get admin's org first
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('org_id, full_name')
      .eq('id', userId)
      .single()

    console.log('Invite debug:', { userId, profile, profileErr })

    const orgId = profile?.org_id
    if (!orgId) {
      return NextResponse.json({ 
        error: 'No organization found. Please contact support.', 
        debug: { userId, hasProfile: !!profile, orgId: profile?.org_id, profileErr: profileErr?.message }
      }, { status: 400 })
    }

    const inviterName = profile?.full_name || 'Your team admin'
    const companyName = 'their team'

    // Get admin's subscription to check seat limits
    // First try org-level, then user-level
    let sub: any = null
    if (orgId) {
      const { data } = await supabase
        .from('subscriptions')
        .select('plan, status')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      if (data) sub = data
    }
    if (!sub) {
      const { data } = await supabase
        .from('subscriptions')
        .select('plan, status')
        .eq('user_id', userId)
        .single()
      if (data) sub = data
    }

    const plan = sub?.plan || 'free'
    const status = sub?.status || 'none'
    const maxSeats = PLAN_SEAT_LIMITS[plan] || 1

    // Admin must have an active subscription (or trial) to invite
    // Exception: free plan gets 1 seat (just the owner, no invites)
    if (plan === 'free' || (status !== 'active' && status !== 'trialing')) {
      return NextResponse.json({
        error: 'You need an active subscription to invite team members. Start a free trial to get started.',
        code: 'NO_SUBSCRIPTION',
      }, { status: 403 })
    }

    // Count active + pending org members (includes the owner)
    const { count } = await supabase
      .from('org_members')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .in('status', ['active', 'pending'])

    const totalSeats = count || 1

    if (totalSeats >= maxSeats) {
      return NextResponse.json({
        error: `You've used all ${maxSeats} seats on your ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan (${totalSeats} members). Upgrade your plan to add more.`,
        code: 'SEAT_LIMIT',
        current: totalSeats,
        max: maxSeats,
      }, { status: 403 })
    }

    // Create pending org_member (will activate when user signs up)
    const normalizedEmail = memberEmail.trim().toLowerCase()
    const { error: memberErr } = await supabase
      .from('org_members')
      .upsert({
        org_id: orgId,
        email: normalizedEmail,
        name: memberName || memberEmail.split('@')[0],
        role: memberRole || 'worker',
        status: 'pending',
        invited_by: userId,
      }, { onConflict: 'org_id,email' })

    if (memberErr) {
      console.error('Failed to create org member:', memberErr)
    }

    // If the invited user already has an account, activate immediately
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .single()

    if (existingUser) {
      // Activate their org membership
      await supabase.from('org_members')
        .update({ user_id: existingUser.id, status: 'active', joined_at: new Date().toISOString() })
        .eq('org_id', orgId)
        .eq('email', normalizedEmail)

      // Switch their profile to this org
      await supabase.from('profiles')
        .update({ org_id: orgId })
        .eq('id', existingUser.id)
    }

    // Send invite email if SMTP is configured
    const smtpHost = process.env.SMTP_HOST
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://projex.live'
    let emailSent = false

    if (smtpHost && smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(process.env.SMTP_PORT || '465'),
          secure: parseInt(process.env.SMTP_PORT || '465') === 465,
          auth: { user: smtpUser, pass: smtpPass },
        })

        await transporter.sendMail({
          from: process.env.SMTP_FROM || smtpUser,
          to: memberEmail,
          subject: `${inviterName} invited you to join ${companyName} on Projex`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="font-size: 20px; font-weight: 700; color: #111; letter-spacing: -0.5px; margin: 0;">PROJEX</h1>
              </div>
              <div style="background: #fafafa; border-radius: 12px; padding: 32px; border: 1px solid #e5e5e5;">
                <h2 style="font-size: 18px; font-weight: 600; color: #111; margin: 0 0 8px 0;">You've been invited</h2>
                <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                  <strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong> on Projex as a <strong>${memberRole || 'team member'}</strong>.
                </p>
                <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                  You don't need your own subscription — just sign up and you'll be added to the team automatically.
                </p>
                <a href="${appUrl}/login" style="display: inline-block; background: #111; color: #fff; padding: 12px 28px; border-radius: 100px; text-decoration: none; font-size: 14px; font-weight: 500;">
                  Accept Invite
                </a>
              </div>
              <p style="text-align: center; color: #999; font-size: 12px; margin-top: 24px;">
                Projex — Construction management, reimagined.
              </p>
            </div>
          `,
          text: `${inviterName} invited you to join ${companyName} on Projex as a ${memberRole || 'team member'}. You don't need your own subscription. Sign up at ${appUrl}/login`,
        })
        emailSent = true
      } catch (emailErr: any) {
        // Don't fail the invite if email fails — team member still gets added
        console.error('Invite email failed:', emailErr.message)
      }
    }

    return NextResponse.json({ 
      success: true, 
      emailSent,
      seatsUsed: totalSeats + 1,
      seatsMax: maxSeats,
    })
  } catch (err: any) {
    console.error('Invite error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

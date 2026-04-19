import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

async function refreshQBToken(supabase: any, orgId: string, clientId: string, clientSecret: string) {
  const { data: integ } = await supabase
    .from('integrations')
    .select('refresh_token')
    .eq('org_id', orgId)
    .eq('provider', 'quickbooks')
    .single()

  if (!integ?.refresh_token) throw new Error('No refresh token')

  const res = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: integ.refresh_token }).toString(),
  })

  if (!res.ok) throw new Error('Token refresh failed')
  const tokens = await res.json()
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

  await supabase.from('integrations').update({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token || integ.refresh_token,
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  }).eq('org_id', orgId).eq('provider', 'quickbooks')

  return tokens.access_token as string
}

export async function POST(req: NextRequest) {
  try {
    const { orgId, syncType = 'invoices' } = await req.json()
    if (!orgId) return NextResponse.json({ error: 'Missing orgId' }, { status: 400 })

    const clientId = process.env.QB_CLIENT_ID!
    const clientSecret = process.env.QB_CLIENT_SECRET!
    const qbEnv = process.env.QB_ENVIRONMENT || 'production'
    const baseUrl = qbEnv === 'sandbox'
      ? 'https://sandbox-quickbooks.api.intuit.com'
      : 'https://quickbooks.api.intuit.com'

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: integ } = await supabase
      .from('integrations')
      .select('access_token, realm_id, expires_at')
      .eq('org_id', orgId)
      .eq('provider', 'quickbooks')
      .single()

    if (!integ) return NextResponse.json({ error: 'QuickBooks not connected' }, { status: 400 })

    let accessToken = integ.access_token
    if (integ.expires_at && new Date(integ.expires_at) <= new Date()) {
      accessToken = await refreshQBToken(supabase, orgId, clientId, clientSecret)
    }

    const realmId = integ.realm_id
    const results: any = { synced: 0, errors: [] }

    if (syncType === 'invoices' || syncType === 'all') {
      const { data: invoices } = await supabase
        .from('generated_documents')
        .select('*')
        .eq('org_id', orgId)
        .eq('type', 'invoice')
        .eq('status', 'sent')

      for (const inv of (invoices || [])) {
        try {
          const qbInvoice = {
            Line: (inv.lineItems || []).map((li: any, i: number) => ({
              Id: String(i + 1),
              LineNum: i + 1,
              Amount: (li.quantity || 1) * (li.price || li.unitPrice || 0),
              DetailType: 'SalesItemLineDetail',
              SalesItemLineDetail: {
                UnitPrice: li.price || li.unitPrice || 0,
                Qty: li.quantity || 1,
                ItemRef: { value: '1', name: li.description || 'Services' },
              },
              Description: li.description || '',
            })),
            CustomerRef: { value: '1', name: inv.clientName || 'Client' },
            DueDate: inv.dateDue || inv.dateIssued,
            DocNumber: inv.documentNumber,
            TxnDate: inv.dateIssued || new Date().toISOString().split('T')[0],
            PrivateNote: `Synced from Projex — ${inv.documentNumber}`,
          }

          await fetch(`${baseUrl}/v3/company/${realmId}/invoice`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(qbInvoice),
          })
          results.synced++
        } catch (e: any) {
          results.errors.push(`Invoice ${inv.documentNumber}: ${e.message}`)
        }
      }
    }

    if (syncType === 'expenses' || syncType === 'all') {
      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .eq('org_id', orgId)
        .limit(50)

      for (const exp of (expenses || [])) {
        try {
          const qbExpense = {
            PaymentType: 'Cash',
            AccountRef: { value: '1' },
            TxnDate: exp.date || new Date().toISOString().split('T')[0],
            TotalAmt: exp.amount || 0,
            Line: [{
              Amount: exp.amount || 0,
              DetailType: 'AccountBasedExpenseLineDetail',
              AccountBasedExpenseLineDetail: { AccountRef: { value: '1' } },
              Description: exp.description || exp.category || 'Expense',
            }],
            PrivateNote: `Synced from Projex`,
          }

          await fetch(`${baseUrl}/v3/company/${realmId}/purchase`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(qbExpense),
          })
          results.synced++
        } catch (e: any) {
          results.errors.push(`Expense: ${e.message}`)
        }
      }
    }

    return NextResponse.json({ success: true, ...results })
  } catch (err: any) {
    console.error('QB sync error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

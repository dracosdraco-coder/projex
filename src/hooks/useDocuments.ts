'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { FormDocument, Meeting, Branch } from '@/types'
import {
  StorageDocument, MeetingFormData,
  LineItemTemplate, FormTemplate, GeneratedDocument,
} from '@/types/data'

export function useDocuments(userId: string | undefined, orgId?: string | null) {
  const [documents, setDocuments] = useState<FormDocument[]>([])
  const [storageDocuments, setStorageDocuments] = useState<StorageDocument[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [lineItemTemplates, setLineItemTemplates] = useState<LineItemTemplate[]>([])
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([])
  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocument[]>([])

  // ==================== LOAD ====================

  const loadStorageDocuments = useCallback(async () => {
    if (!userId) return
    const { data: docsData, error } = await supabase
      .from('documents')
      .select('*')
      .eq(orgId ? 'org_id' : 'user_id', orgId || userId!)
      .order('uploaded_at', { ascending: false })

    if (error) return

    const transformed: StorageDocument[] = (docsData || []).map((doc: any) => {
      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(doc.storage_path)
      return {
        id: doc.id, projectId: doc.project_id, name: doc.name, type: doc.type,
        fileUrl: publicUrl, fileSize: doc.file_size, mimeType: doc.mime_type, uploadedAt: doc.uploaded_at,
      }
    })
    setStorageDocuments(transformed)
  }, [userId])

  const loadMeetings = useCallback(async () => {
    if (!userId) return
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .eq(orgId ? 'org_id' : 'user_id', orgId || userId!)
      .order('start_time', { ascending: false })

    if (error) return
    setMeetings((data || []).map((m: any) => ({ ...m, attendees: m.attendees || [] })) as Meeting[])
  }, [userId])

  const loadBranches = useCallback(async () => {
    if (!userId) return
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq(orgId ? 'org_id' : 'user_id', orgId || userId!)
      .order('created_at', { ascending: false })

    if (error) return
    setBranches((data || []) as Branch[])
  }, [userId])

  const loadLineItemTemplates = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('line_item_templates')
      .select('*')
      .eq(orgId ? 'org_id' : 'user_id', orgId || userId!)
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    const transformed: LineItemTemplate[] = (data || []).map((item: any) => ({
      id: item.id, userId: item.user_id, category: item.category, name: item.name,
      description: item.description, unit: item.unit, cost: item.cost, price: item.price,
      marginPercent: item.margin_percent, taxRate: item.tax_rate, isTaxable: item.is_taxable,
      notes: item.notes, isActive: item.is_active, createdAt: item.created_at, updatedAt: item.updated_at,
    }))
    setLineItemTemplates(transformed)
  }, [userId])

  const loadFormTemplates = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('form_templates')
      .select('*')
      .eq(orgId ? 'org_id' : 'user_id', orgId || userId!)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    const transformed: FormTemplate[] = (data || []).map((tpl: any) => ({
      id: tpl.id, userId: tpl.user_id, type: tpl.type, name: tpl.name,
      companyName: tpl.company_name, companyLogoUrl: tpl.company_logo_url,
      companyAddress: tpl.company_address, companyPhone: tpl.company_phone,
      companyEmail: tpl.company_email, companyWebsite: tpl.company_website,
      showMargins: tpl.show_margins, terms: tpl.terms, notes: tpl.notes,
      footer: tpl.footer, lineItems: tpl.line_items || [],
      isActive: tpl.is_active, createdAt: tpl.created_at, updatedAt: tpl.updated_at,
    }))
    setFormTemplates(transformed)
  }, [userId])

  const loadGeneratedDocuments = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('generated_documents')
      .select('*')
      .eq(orgId ? 'org_id' : 'user_id', orgId || userId!)
      .order('date_issued', { ascending: false })

    const transformed: GeneratedDocument[] = (data || []).map((doc: any) => ({
      id: doc.id, userId: doc.user_id, projectId: doc.project_id, type: doc.type,
      documentNumber: doc.document_number, status: doc.status, dateIssued: doc.date_issued,
      dateDue: doc.date_due, dateSent: doc.date_sent, dateApproved: doc.date_approved,
      datePaid: doc.date_paid, companyName: doc.company_name, companyLogoUrl: doc.company_logo_url,
      companyAddress: doc.company_address, companyPhone: doc.company_phone,
      companyEmail: doc.company_email, companyWebsite: doc.company_website,
      clientName: doc.client_name, clientEmail: doc.client_email, clientPhone: doc.client_phone,
      clientAddress: doc.client_address, lineItems: doc.line_items || [],
      subtotal: doc.subtotal, taxTotal: doc.tax_total, total: doc.total, costTotal: doc.cost_total,
      profit: doc.profit, marginPercent: doc.margin_percent, terms: doc.terms, notes: doc.notes,
      footer: doc.footer, pxFilePath: doc.px_file_path, pdfFilePath: doc.pdf_file_path,
      attachedPdfs: doc.attached_pdfs || [], parentDocumentId: doc.parent_document_id,
      paymentMethod: doc.payment_method, paymentReference: doc.payment_reference,
      amountPaid: doc.amount_paid, createdAt: doc.created_at, updatedAt: doc.updated_at,
    }))
    setGeneratedDocuments(transformed)
  }, [userId])

  // ==================== STORAGE DOCUMENTS CRUD ====================

  const uploadDocument = useCallback(async (projectId: string, file: File, type: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const storagePath = `${user.id}/${projectId}/${timestamp}_${sanitizedName}`

    const { error: uploadError } = await supabase.storage.from('documents').upload(storagePath, file)
    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(storagePath)

    const { data: docRecord, error: dbError } = await supabase
      .from('documents')
      .insert([{
        user_id: user.id, project_id: projectId, name: file.name, type,
        storage_path: storagePath, file_size: file.size, mime_type: file.type,
      }])
      .select()
      .single()

    if (dbError) {
      await supabase.storage.from('documents').remove([storagePath])
      throw dbError
    }

    const newDoc: StorageDocument = {
      id: docRecord.id, projectId: docRecord.project_id, name: docRecord.name,
      type: docRecord.type, fileUrl: publicUrl, fileSize: docRecord.file_size,
      mimeType: docRecord.mime_type, uploadedAt: docRecord.uploaded_at,
    }
    setStorageDocuments(prev => [newDoc, ...prev])
  }, [])

  const deleteDocument = useCallback(async (documentId: string) => {
    const doc = storageDocuments.find(d => d.id === documentId)
    if (!doc) throw new Error('Document not found')

    const { data: docData, error: fetchError } = await supabase
      .from('documents')
      .select('storage_path')
      .eq('id', documentId)
      .single()

    if (fetchError) throw fetchError

    const { error: dbError } = await supabase.from('documents').delete().eq('id', documentId)
    if (dbError) throw dbError

    await supabase.storage.from('documents').remove([docData.storage_path])
    setStorageDocuments(prev => prev.filter(d => d.id !== documentId))
  }, [storageDocuments])

  const downloadDocument = useCallback(async (documentId: string, fileName: string) => {
    const doc = storageDocuments.find(d => d.id === documentId)
    if (!doc) throw new Error('Document not found')

    const response = await fetch(doc.fileUrl)
    if (!response.ok) throw new Error('Failed to fetch file')

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }, [storageDocuments])

  // ==================== MEETINGS ====================

  const createMeeting = useCallback(async (data: MeetingFormData) => {
    if (!userId) throw new Error('Not authenticated')

    const { data: newMeeting, error } = await supabase
      .from('meetings')
      .insert([{
        user_id: userId, org_id: orgId || undefined, project_id: data.projectId, title: data.title,
        start_time: `${data.date}T${data.time}`, end_time: `${data.date}T${data.time}`,
        attendees: data.attendees,
      }])
      .select()
      .single()

    if (error) throw error
    setMeetings(prev => [newMeeting as Meeting, ...prev])
    return newMeeting as Meeting
  }, [userId])

  const deleteMeeting = useCallback(async (id: string) => {
    const { error } = await supabase.from('meetings').delete().eq('id', id)
    if (error) throw error
    setMeetings(prev => prev.filter(m => m.id !== id))
  }, [])

  // ==================== FORM DOCUMENTS ====================

  const createDocument = useCallback(async (data: {
    projectId: string; title: string; type: string; status: string
  }) => {
    if (!userId) throw new Error('Not authenticated')

    const { data: newDoc, error } = await supabase
      .from('form_documents')
      .insert([{ user_id: userId, org_id: orgId || undefined, project_id: data.projectId, title: data.title, type: data.type, status: data.status }])
      .select()
      .single()

    if (error) throw error
    setDocuments(prev => [newDoc as FormDocument, ...prev])
    return newDoc as FormDocument
  }, [userId])

  // ==================== BRANCHES ====================

  const createBranch = useCallback(async (data: { name: string; location: string; manager?: string }) => {
    if (!userId) throw new Error('Not authenticated')

    const { data: newBranch, error } = await supabase
      .from('branches')
      .insert([{ user_id: userId, org_id: orgId || undefined, name: data.name, address: data.location }])
      .select()
      .single()

    if (error) throw error
    setBranches(prev => [newBranch as Branch, ...prev])
    return newBranch as Branch
  }, [userId])

  const deleteBranch = useCallback(async (id: string) => {
    const { error } = await supabase.from('branches').delete().eq('id', id)
    if (error) throw error
    setBranches(prev => prev.filter(b => b.id !== id))
  }, [])

  const updateBranch = useCallback(async (id: string, data: any) => {
    const updates: any = {}
    if (data.name !== undefined) updates.name = data.name
    if (data.address !== undefined) updates.location = [data.address, data.city, data.state, data.zipCode].filter(Boolean).join(', ')
    if (data.phone !== undefined) updates.phone = data.phone
    if (data.email !== undefined) updates.email = data.email
    if (data.manager !== undefined) updates.manager = data.manager
    const { error } = await supabase.from('branches').update(updates).eq('id', id)
    if (error) throw error
    setBranches(prev => prev.map(b => b.id === id ? { ...b, ...updates, ...data } : b))
  }, [])

  // ==================== LINE ITEM TEMPLATES ====================

  const createLineItemTemplate = useCallback(async (data: Partial<LineItemTemplate>) => {
    if (!userId) return null

    const { data: newTemplate, error } = await supabase
      .from('line_item_templates')
      .insert({
        user_id: userId, org_id: orgId || undefined, category: data.category, name: data.name, description: data.description,
        unit: data.unit, cost: data.cost, price: data.price, tax_rate: data.taxRate || 0,
        is_taxable: data.isTaxable ?? true, notes: data.notes, is_active: true,
      })
      .select()
      .single()

    if (error) return null

    const transformed: LineItemTemplate = {
      id: newTemplate.id, userId: newTemplate.user_id, category: newTemplate.category,
      name: newTemplate.name, description: newTemplate.description, unit: newTemplate.unit,
      cost: newTemplate.cost, price: newTemplate.price, marginPercent: newTemplate.margin_percent,
      taxRate: newTemplate.tax_rate, isTaxable: newTemplate.is_taxable, notes: newTemplate.notes,
      isActive: newTemplate.is_active, createdAt: newTemplate.created_at, updatedAt: newTemplate.updated_at,
    }

    setLineItemTemplates(prev => [...prev, transformed])
    return transformed
  }, [userId])

  const updateLineItemTemplate = useCallback(async (id: string, updates: Partial<LineItemTemplate>) => {
    const { data, error } = await supabase
      .from('line_item_templates')
      .update({
        name: updates.name, description: updates.description, category: updates.category,
        unit: updates.unit, cost: updates.cost, price: updates.price,
        tax_rate: updates.taxRate, is_taxable: updates.isTaxable, notes: updates.notes, is_active: updates.isActive,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) return null

    const updated: LineItemTemplate = {
      id: data.id, userId: data.user_id, category: data.category, name: data.name,
      description: data.description, unit: data.unit, cost: data.cost, price: data.price,
      marginPercent: data.margin_percent, taxRate: data.tax_rate, isTaxable: data.is_taxable,
      notes: data.notes, isActive: data.is_active, createdAt: data.created_at, updatedAt: data.updated_at,
    }

    setLineItemTemplates(prev => prev.map(t => t.id === id ? updated : t))
    return updated
  }, [])

  const deleteLineItemTemplate = useCallback(async (id: string) => {
    const { error } = await supabase.from('line_item_templates').update({ is_active: false }).eq('id', id)
    if (error) return false
    setLineItemTemplates(prev => prev.filter(t => t.id !== id))
    return true
  }, [])

  // ==================== FORM TEMPLATES ====================

  const createFormTemplate = useCallback(async (data: Partial<FormTemplate>) => {
    if (!userId) return null

    const { data: newTemplate, error } = await supabase
      .from('form_templates')
      .insert({
        user_id: userId, org_id: orgId || undefined, type: data.type, name: data.name,
        company_name: data.companyName, company_logo_url: data.companyLogoUrl,
        company_address: data.companyAddress, company_phone: data.companyPhone,
        company_email: data.companyEmail, company_website: data.companyWebsite,
        show_margins: data.showMargins ?? false, terms: data.terms, notes: data.notes,
        footer: data.footer, line_items: data.lineItems || [], is_active: true,
      })
      .select()
      .single()

    if (error) return null

    const transformed: FormTemplate = {
      id: newTemplate.id, userId: newTemplate.user_id, type: newTemplate.type, name: newTemplate.name,
      companyName: newTemplate.company_name, companyLogoUrl: newTemplate.company_logo_url,
      companyAddress: newTemplate.company_address, companyPhone: newTemplate.company_phone,
      companyEmail: newTemplate.company_email, companyWebsite: newTemplate.company_website,
      showMargins: newTemplate.show_margins, terms: newTemplate.terms, notes: newTemplate.notes,
      footer: newTemplate.footer, lineItems: newTemplate.line_items || [],
      isActive: newTemplate.is_active, createdAt: newTemplate.created_at, updatedAt: newTemplate.updated_at,
    }

    setFormTemplates(prev => [...prev, transformed])
    return transformed
  }, [userId])

  const updateFormTemplate = useCallback(async (id: string, updates: Partial<FormTemplate>) => {
    const { data, error } = await supabase
      .from('form_templates')
      .update({
        name: updates.name, company_name: updates.companyName, company_logo_url: updates.companyLogoUrl,
        company_address: updates.companyAddress, company_phone: updates.companyPhone,
        company_email: updates.companyEmail, company_website: updates.companyWebsite,
        show_margins: updates.showMargins, terms: updates.terms, notes: updates.notes,
        footer: updates.footer, line_items: updates.lineItems, is_active: updates.isActive,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) return null

    const updated: FormTemplate = {
      id: data.id, userId: data.user_id, type: data.type, name: data.name,
      companyName: data.company_name, companyLogoUrl: data.company_logo_url,
      companyAddress: data.company_address, companyPhone: data.company_phone,
      companyEmail: data.company_email, companyWebsite: data.company_website,
      showMargins: data.show_margins, terms: data.terms, notes: data.notes,
      footer: data.footer, lineItems: data.line_items || [],
      isActive: data.is_active, createdAt: data.created_at, updatedAt: data.updated_at,
    }

    setFormTemplates(prev => prev.map(t => t.id === id ? updated : t))
    return updated
  }, [])

  const deleteFormTemplate = useCallback(async (id: string) => {
    const { error } = await supabase.from('form_templates').update({ is_active: false }).eq('id', id)
    if (error) return false
    setFormTemplates(prev => prev.filter(t => t.id !== id))
    return true
  }, [])

  // ==================== GENERATED DOCUMENTS ====================

  const getNextDocumentNumber = useCallback(async (type: string, prefix: string = '') => {
    if (!userId) return null
    try {
      const { data, error } = await supabase.rpc('get_next_document_number', {
        p_user_id: userId, org_id: orgId || undefined, p_document_type: type, p_prefix: prefix || type.toUpperCase().substring(0, 3),
      })
      if (error || !data) return null
      return data
    } catch {
      return null
    }
  }, [userId])

  const createGeneratedDocument = useCallback(async (data: Partial<GeneratedDocument>) => {
    if (!userId) return null

    // Fall back to a timestamp-based number if the RPC isn't available yet
    const rpcNumber = await getNextDocumentNumber(data.type!, data.type?.toUpperCase().substring(0, 3))
    const documentNumber = rpcNumber || `${(data.type || 'DOC').toUpperCase().substring(0, 3)}-${Date.now().toString().slice(-6)}`

    const { data: newDoc, error } = await supabase
      .from('generated_documents')
      .insert({
        user_id: userId, org_id: orgId || undefined, project_id: data.projectId, type: data.type,
        document_number: documentNumber, status: data.status || 'draft',
        date_issued: data.dateIssued || new Date().toISOString().split('T')[0],
        date_due: data.dateDue, company_name: data.companyName, company_logo_url: data.companyLogoUrl,
        company_address: data.companyAddress, company_phone: data.companyPhone,
        company_email: data.companyEmail, company_website: data.companyWebsite,
        client_name: data.clientName, client_email: data.clientEmail,
        client_phone: data.clientPhone, client_address: data.clientAddress,
        line_items: data.lineItems || [], subtotal: data.subtotal || 0,
        tax_total: data.taxTotal || 0, total: data.total || 0, cost_total: data.costTotal || 0,
        terms: data.terms, notes: data.notes, footer: data.footer,
        px_file_path: data.pxFilePath, pdf_file_path: data.pdfFilePath,
        attached_pdfs: data.attachedPdfs || [], parent_document_id: data.parentDocumentId,
      })
      .select()
      .single()

    if (error) return null

    const transformed: GeneratedDocument = {
      id: newDoc.id, userId: newDoc.user_id, projectId: newDoc.project_id, type: newDoc.type,
      documentNumber: newDoc.document_number, status: newDoc.status, dateIssued: newDoc.date_issued,
      dateDue: newDoc.date_due, dateSent: newDoc.date_sent, dateApproved: newDoc.date_approved,
      datePaid: newDoc.date_paid, companyName: newDoc.company_name, companyLogoUrl: newDoc.company_logo_url,
      companyAddress: newDoc.company_address, companyPhone: newDoc.company_phone,
      companyEmail: newDoc.company_email, companyWebsite: newDoc.company_website,
      clientName: newDoc.client_name, clientEmail: newDoc.client_email,
      clientPhone: newDoc.client_phone, clientAddress: newDoc.client_address,
      lineItems: newDoc.line_items || [], subtotal: newDoc.subtotal, taxTotal: newDoc.tax_total,
      total: newDoc.total, costTotal: newDoc.cost_total, profit: newDoc.profit,
      marginPercent: newDoc.margin_percent, terms: newDoc.terms, notes: newDoc.notes,
      footer: newDoc.footer, pxFilePath: newDoc.px_file_path, pdfFilePath: newDoc.pdf_file_path,
      attachedPdfs: newDoc.attached_pdfs || [], parentDocumentId: newDoc.parent_document_id,
      paymentMethod: newDoc.payment_method, paymentReference: newDoc.payment_reference,
      amountPaid: newDoc.amount_paid, createdAt: newDoc.created_at, updatedAt: newDoc.updated_at,
    }

    setGeneratedDocuments(prev => [transformed, ...prev])
    return transformed
  }, [userId, getNextDocumentNumber])

  const updateGeneratedDocument = useCallback(async (id: string, updates: Partial<GeneratedDocument>) => {
    const { data, error } = await supabase
      .from('generated_documents')
      .update({
        status: updates.status, date_due: updates.dateDue, date_sent: updates.dateSent,
        date_approved: updates.dateApproved, date_paid: updates.datePaid,
        company_name: updates.companyName, company_logo_url: updates.companyLogoUrl,
        company_address: updates.companyAddress, company_phone: updates.companyPhone,
        company_email: updates.companyEmail, company_website: updates.companyWebsite,
        client_name: updates.clientName, client_email: updates.clientEmail,
        client_phone: updates.clientPhone, client_address: updates.clientAddress,
        line_items: updates.lineItems, subtotal: updates.subtotal,
        tax_total: updates.taxTotal, total: updates.total, cost_total: updates.costTotal,
        terms: updates.terms, notes: updates.notes, footer: updates.footer,
        px_file_path: updates.pxFilePath, pdf_file_path: updates.pdfFilePath,
        attached_pdfs: updates.attachedPdfs, payment_method: updates.paymentMethod,
        payment_reference: updates.paymentReference, amount_paid: updates.amountPaid,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) return null

    const updated: GeneratedDocument = {
      id: data.id, userId: data.user_id, projectId: data.project_id, type: data.type,
      documentNumber: data.document_number, status: data.status, dateIssued: data.date_issued,
      dateDue: data.date_due, dateSent: data.date_sent, dateApproved: data.date_approved,
      datePaid: data.date_paid, companyName: data.company_name, companyLogoUrl: data.company_logo_url,
      companyAddress: data.company_address, companyPhone: data.company_phone,
      companyEmail: data.company_email, companyWebsite: data.company_website,
      clientName: data.client_name, clientEmail: data.client_email,
      clientPhone: data.client_phone, clientAddress: data.client_address,
      lineItems: data.line_items || [], subtotal: data.subtotal, taxTotal: data.tax_total,
      total: data.total, costTotal: data.cost_total, profit: data.profit,
      marginPercent: data.margin_percent, terms: data.terms, notes: data.notes,
      footer: data.footer, pxFilePath: data.px_file_path, pdfFilePath: data.pdf_file_path,
      attachedPdfs: data.attached_pdfs || [], parentDocumentId: data.parent_document_id,
      paymentMethod: data.payment_method, paymentReference: data.payment_reference,
      amountPaid: data.amount_paid, createdAt: data.created_at, updatedAt: data.updated_at,
    }

    setGeneratedDocuments(prev => prev.map(d => d.id === id ? updated : d))
    return updated
  }, [])

  const deleteGeneratedDocument = useCallback(async (id: string) => {
    const { error } = await supabase.from('generated_documents').delete().eq('id', id)
    if (error) return false
    setGeneratedDocuments(prev => prev.filter(d => d.id !== id))
    return true
  }, [])

  return {
    documents, storageDocuments, meetings, branches,
    lineItemTemplates, formTemplates, generatedDocuments,
    loadStorageDocuments, loadMeetings, loadBranches,
    loadLineItemTemplates, loadFormTemplates, loadGeneratedDocuments,
    uploadDocument, deleteDocument, downloadDocument,
    createMeeting, deleteMeeting,
    createDocument,
    createBranch, updateBranch, deleteBranch,
    createLineItemTemplate, updateLineItemTemplate, deleteLineItemTemplate,
    createFormTemplate, updateFormTemplate, deleteFormTemplate,
    createGeneratedDocument, updateGeneratedDocument, deleteGeneratedDocument,
    getNextDocumentNumber,
  }
}

'use client'

import {
  LayoutDashboard, FolderOpen, CheckSquare, Layers, Clock, DollarSign,
  BarChart3, Users, MessageSquare, FileText, File, ClipboardList,
  Calendar, Mail, Pencil, Map, Building2, Settings, Menu, Plug, Camera, Phone, Target,
} from 'lucide-react'

const ICON_MAP: Record<string, any> = {
  dashboard: LayoutDashboard, projects: FolderOpen, tasks: CheckSquare,
  phases: Layers, timeline: Clock, budgeting: DollarSign, kpi: BarChart3,
  team: Users, messages: MessageSquare, forms: FileText, documents: File,
  templates: ClipboardList, calendar: Calendar, communication: Mail,
  drawings: Pencil, maps: Map, branches: Building2, settings: Settings,
  schedule: Calendar, meetings: Users, chat: MessageSquare,
  estimating: DollarSign, invoicing: FileText, menu: Menu,
  integrations: Plug, accounting: DollarSign, photos: Camera,
  comms: Phone, leads: Target,
}

interface CardIconProps { type: string; size?: number; className?: string }

export default function CardIcon({ type, size = 18, className = '' }: CardIconProps) {
  const Icon = ICON_MAP[type] || FolderOpen
  return <Icon className={className} style={{ width: size, height: size }} strokeWidth={1.75} />
}

export function getIconForType(type: string) {
  return ICON_MAP[type] ? type : 'projects'
}

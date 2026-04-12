// Stripe plan configuration
// After creating products in Stripe Dashboard, replace these placeholder IDs
// with your actual Stripe Price IDs

export const STRIPE_PLANS = {
  duo: {
    name: 'Duo',
    maxUsers: 2,
    maxProjects: 5,
    storageMB: 2048,
    features: ['estimates', 'invoices', 'calendar', 'scheduling', 'documents'],
  },
  team: {
    name: 'Team',
    maxUsers: 5,
    maxProjects: -1,
    storageMB: 10240,
    features: ['estimates', 'invoices', 'calendar', 'scheduling', 'documents', 'proposals', 'contracts', 'budgeting', 'kpi', 'team'],
  },
  business: {
    name: 'Business',
    maxUsers: 10,
    maxProjects: -1,
    storageMB: 51200,
    features: ['estimates', 'invoices', 'calendar', 'scheduling', 'documents', 'proposals', 'contracts', 'budgeting', 'kpi', 'team', 'branches', 'reports', 'templates'],
  },
  enterprise: {
    name: 'Enterprise',
    maxUsers: 20,
    maxProjects: -1,
    storageMB: 102400,
    features: ['estimates', 'invoices', 'calendar', 'scheduling', 'documents', 'proposals', 'contracts', 'budgeting', 'kpi', 'team', 'branches', 'reports', 'templates', 'api', 'integrations', 'sso'],
  },
} as const

// Server-only: resolve price IDs at runtime from env vars
export function getStripePriceId(planId: PlanId, interval: 'monthly' | 'annual'): string {
  const key = `STRIPE_PRICE_${planId.toUpperCase()}_${interval.toUpperCase()}`
  return process.env[key] || `price_${planId}_${interval}_placeholder`
}

export type PlanId = keyof typeof STRIPE_PLANS

// Feature access control
export function canAccess(plan: PlanId | 'free' | null, feature: string): boolean {
  if (!plan || plan === 'free') return false
  const planConfig = STRIPE_PLANS[plan as PlanId]
  if (!planConfig) return false
  return (planConfig.features as readonly string[]).includes(feature)
}

export function getPlanLimits(plan: PlanId | 'free' | null) {
  if (!plan || plan === 'free') return { maxUsers: 1, maxProjects: 1, storageMB: 100 }
  const planConfig = STRIPE_PLANS[plan as PlanId]
  if (!planConfig) return { maxUsers: 1, maxProjects: 1, storageMB: 100 }
  return { maxUsers: planConfig.maxUsers, maxProjects: planConfig.maxProjects, storageMB: planConfig.storageMB }
}

// Cards that require specific plans
export const CARD_PLAN_REQUIREMENTS: Record<string, PlanId> = {
  // Available to all paid plans
  dashboard: 'duo',
  projects: 'duo',
  tasks: 'duo',
  calendar: 'duo',
  forms: 'duo',
  documents: 'duo',
  estimating: 'duo',
  invoicing: 'duo',
  schedule: 'duo',
  meetings: 'duo',
  
  // Team plan and above
  budgeting: 'team',
  kpi: 'team',
  team: 'team',
  messages: 'team',
  proposals: 'team',
  communication: 'team',
  chat: 'team',
  drawings: 'team',
  timeline: 'team',
  phases: 'team',
  
  // Business plan and above
  branches: 'business',
  templates: 'business',
  maps: 'business',
  
  // Always available
  settings: 'duo',
}

const PLAN_HIERARCHY: (PlanId | 'free')[] = ['free', 'duo', 'team', 'business', 'enterprise']

export function meetsMinimumPlan(userPlan: PlanId | 'free' | null, requiredPlan: PlanId): boolean {
  const userIdx = PLAN_HIERARCHY.indexOf(userPlan || 'free')
  const reqIdx = PLAN_HIERARCHY.indexOf(requiredPlan)
  return userIdx >= reqIdx
}

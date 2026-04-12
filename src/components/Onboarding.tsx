'use client'

import { useState, useEffect } from 'react'
import { X, ChevronRight, ChevronLeft, Sparkles, Layout, FileText, Users, Calendar, Settings, HelpCircle } from 'lucide-react'

const STEPS = [
  {
    icon: Sparkles,
    title: 'Welcome to Projex',
    body: 'Your construction management workspace. Everything lives on one infinite canvas — drag, resize, and arrange cards however you like.',
    tip: 'Double-click the canvas background to zoom fit, or scroll to zoom in/out.',
  },
  {
    icon: Layout,
    title: 'Your Workspace',
    body: 'Each card is a module — Dashboard, Projects, Tasks, Calendar, Estimates, and more. Open them from the dock at the bottom of the screen.',
    tip: 'Click any dock icon to open that card. Drag cards to rearrange your workspace.',
  },
  {
    icon: FileText,
    title: 'Create Documents',
    body: 'Build professional estimates, invoices, proposals, and contracts. Assign them to projects and send them to clients.',
    tip: 'Open the Forms card → click "+ New" to start an estimate, invoice, or inspection form.',
  },
  {
    icon: Users,
    title: 'Team Management',
    body: 'Add team members, assign roles, and coordinate across projects. Everyone sees what they need, nothing they don\'t.',
    tip: 'Open the Team card to invite members. Assign them to specific projects.',
  },
  {
    icon: Calendar,
    title: 'Scheduling',
    body: 'Manage your calendar, schedule meetings, and track project timelines. Everything stays synced across cards.',
    tip: 'The Calendar card shows all events. The Schedule card shows crew assignments.',
  },
  {
    icon: Settings,
    title: 'You\'re All Set',
    body: 'Customize your account, manage your subscription, and tweak notifications in Settings. Need help? Hit the "?" button anytime.',
    tip: 'Pro tip: Use keyboard shortcut ⌘+K (or Ctrl+K) to search across everything.',
  },
]

interface OnboardingProps {
  onComplete: () => void
  visible: boolean
}

export default function Onboarding({ onComplete, visible }: OnboardingProps) {
  const [step, setStep] = useState(0)
  const [exiting, setExiting] = useState(false)

  if (!visible) return null

  const current = STEPS[step]
  const Icon = current.icon
  const isLast = step === STEPS.length - 1
  const progress = ((step + 1) / STEPS.length) * 100

  const handleClose = () => {
    setExiting(true)
    setTimeout(() => {
      setExiting(false)
      setStep(0)
      onComplete()
    }, 250)
  }

  const handleNext = () => {
    if (isLast) {
      handleClose()
    } else {
      setStep(step + 1)
    }
  }

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-250 ${exiting ? 'opacity-0' : 'opacity-100'}`}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className={`relative bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transition-all duration-250 ${exiting ? 'scale-95' : 'scale-100'}`}>
        {/* Progress bar */}
        <div className="h-1 bg-gray-100 dark:bg-[#222]">
          <div className="h-full bg-gray-900 dark:bg-white transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>

        {/* Close */}
        <button onClick={handleClose} className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-[#222]">
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="p-8 pt-7">
          {/* Step indicator */}
          <div className="flex items-center gap-1.5 mb-6">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-gray-900 dark:bg-white' : i < step ? 'w-1.5 bg-gray-400' : 'w-1.5 bg-gray-200 dark:bg-[#333]'}`} />
            ))}
          </div>

          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-[#222] flex items-center justify-center mb-5">
            <Icon className="w-6 h-6 text-gray-900 dark:text-gray-100" />
          </div>

          {/* Text */}
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 tracking-tight">{current.title}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">{current.body}</p>
          
          {/* Tip */}
          <div className="bg-gray-50 dark:bg-[#222] rounded-xl px-4 py-3 border border-gray-100 dark:border-[#2a2a2a]">
            <p className="text-xs text-gray-600 dark:text-gray-300"><span className="font-semibold">Tip:</span> {current.tip}</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="px-8 pb-6 flex items-center justify-between">
          <button
            onClick={() => step > 0 && setStep(step - 1)}
            className={`flex items-center gap-1 text-sm font-medium transition-colors ${step > 0 ? 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100' : 'text-transparent pointer-events-none'}`}
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex items-center gap-3">
            {!isLast && (
              <button onClick={handleClose} className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                Skip
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors active:scale-[0.97]"
            >
              {isLast ? 'Get started' : 'Next'} {!isLast && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Floating help button — replays onboarding
export function HelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[500] w-10 h-10 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:shadow-xl transition-all active:scale-95"
      title="Help & onboarding"
    >
      <HelpCircle className="w-5 h-5" />
    </button>
  )
}

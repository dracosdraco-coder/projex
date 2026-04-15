'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export function useFormDraft<T extends object>(key: string, initialValues: T) {
  const storageKey = `projex_draft_${key}`
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const [hasDraft, setHasDraft] = useState(false)

  // Restore from localStorage on mount, merging with initialValues
  const getInitial = (): T => {
    if (typeof window === 'undefined') return initialValues
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        setHasDraft(true)
        return { ...initialValues, ...parsed }
      }
    } catch {}
    return initialValues
  }

  const [values, setValues] = useState<T>(getInitial)

  // Auto-save with 500ms debounce whenever values change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(values))
        setHasDraft(true)
      } catch {}
    }, 500)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [values, storageKey])

  const update = useCallback((partial: Partial<T>) => {
    setValues(prev => ({ ...prev, ...partial }))
  }, [])

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey)
    } catch {}
    setHasDraft(false)
    setValues(initialValues)
  }, [storageKey, initialValues])

  const resetToInitial = useCallback(() => {
    setValues(initialValues)
  }, [initialValues])

  return { values, update, setValues, clearDraft, resetToInitial, hasDraft }
}

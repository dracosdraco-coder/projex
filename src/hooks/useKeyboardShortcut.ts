'use client'

import { useEffect } from 'react'

type KeyboardShortcut = {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  callback: () => void
}

export function useKeyboardShortcut(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      shortcuts.forEach(shortcut => {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()
        const ctrlMatches = shortcut.ctrlKey === undefined || event.ctrlKey === shortcut.ctrlKey
        const metaMatches = shortcut.metaKey === undefined || event.metaKey === shortcut.metaKey
        const shiftMatches = shortcut.shiftKey === undefined || event.shiftKey === shortcut.shiftKey
        const altMatches = shortcut.altKey === undefined || event.altKey === shortcut.altKey

        // Check if Cmd (Meta) or Ctrl is pressed for cross-platform support
        const modifierPressed = event.metaKey || event.ctrlKey

        if (keyMatches && ctrlMatches && metaMatches && shiftMatches && altMatches) {
          // For shortcuts that need Cmd/Ctrl
          if (shortcut.metaKey || shortcut.ctrlKey) {
            if (modifierPressed) {
              event.preventDefault()
              shortcut.callback()
            }
          } else {
            event.preventDefault()
            shortcut.callback()
          }
        }
      })
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [shortcuts])
}
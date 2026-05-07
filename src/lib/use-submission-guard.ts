"use client"

import { useRef, useState } from "react"

export function useSubmissionGuard(debounceMs = 800) {
  const lockRef = useRef(false)
  const lastAttemptRef = useRef(0)
  const [submitting, setSubmitting] = useState(false)

  const run = async <T>(action: () => Promise<T>) => {
    const now = Date.now()

    if (lockRef.current || now - lastAttemptRef.current < debounceMs) {
      return undefined
    }

    lockRef.current = true
    lastAttemptRef.current = now
    setSubmitting(true)

    try {
      return await action()
    } finally {
      setSubmitting(false)
      window.setTimeout(() => {
        lockRef.current = false
      }, debounceMs)
    }
  }

  return { run, submitting }
}

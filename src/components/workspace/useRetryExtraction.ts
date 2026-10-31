'use client'

import { useState } from 'react'

/**
 * Tracks an in-flight retry of the Style DNA extraction.
 * `handleRetry` does nothing when no callback was supplied.
 */
export function useRetryExtraction(onRetryExtraction?: () => void | Promise<void>) {
  const [isRetrying, setIsRetrying] = useState(false)

  const handleRetry = async () => {
    if (!onRetryExtraction) return
    setIsRetrying(true)
    try {
      await onRetryExtraction()
    } finally {
      setIsRetrying(false)
    }
  }

  return { isRetrying, handleRetry }
}

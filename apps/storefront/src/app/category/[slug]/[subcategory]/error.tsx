'use client'

import { useEffect } from 'react'
import { Package } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Category page error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-[44px]" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <Package className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-6">
            We encountered an error loading this category.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground mb-4">
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  )
}

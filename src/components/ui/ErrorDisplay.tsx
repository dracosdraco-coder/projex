interface ErrorDisplayProps {
  error: string
  onRetry?: () => void
}

export default function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#1a1a1a] p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Unable to Load Data
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {error}
        </p>
        
        <div className="flex gap-3 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Try Again
            </button>
          )}
          
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-[#333333] transition-colors font-medium"
          >
            Reload Page
          </button>
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 dark:bg-[#222222] rounded-lg text-left">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mb-2">Troubleshooting:</p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Check if the dev server is running</li>
            <li>• Verify database connection in .env</li>
            <li>• Check browser console for errors</li>
            <li>• Try running: npm run db:studio</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
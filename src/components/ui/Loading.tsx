interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
}

export default function Loading({ size = 'lg' }: LoadingProps = {}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-16 h-16'
  }

  const isFullPage = size === 'lg'

  if (isFullPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#1a1a1a]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-gray-200 dark:border-[#333333] rounded-full" />
            <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Loading PROJEX...</p>
        </div>
      </div>
    )
  }

  // Small spinner for inline use
  return (
    <div className={`relative ${sizeClasses[size]}`}>
      <div className="absolute inset-0 border-2 border-gray-200 dark:border-[#333333] rounded-full" />
      <div className="absolute inset-0 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'

interface DocumentViewerProps {
  isOpen: boolean
  onClose: () => void
  documentUrl?: string
  documentType?: 'pdf' | 'image' | 'text'
  documentName?: string
  documentData?: any
  isProjectFile?: boolean
  onEdit?: () => void
}

export default function DocumentViewer({
  isOpen,
  onClose,
  documentUrl,
  documentType = 'pdf',
  documentName = 'Document',
  isProjectFile = false,
  onEdit,
}: DocumentViewerProps) {
  const [zoom, setZoom] = useState(100)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages] = useState(1) // For future multi-page support

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleEscape)
      return () => window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleZoomIn = () => {
    if (zoom < 200) setZoom(prev => Math.min(prev + 25, 200))
  }

  const handleZoomOut = () => {
    if (zoom > 50) setZoom(prev => Math.max(prev - 25, 50))
  }

  const handleDownload = () => {
    if (!documentUrl) return
    const link = document.createElement('a')
    link.href = documentUrl
    link.download = documentName
    link.click()
  }

  const handlePrint = () => {
    if (!documentUrl) return
    const printWindow = window.open(documentUrl, '_blank')
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.print()
      })
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[10001] flex items-center justify-center p-6">
        <div 
          className="bg-white dark:bg-[#1c1c1e] rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#2c2c2e]">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate max-w-md">
                {documentName}
              </h2>
              {isProjectFile && (
                <span className="px-2 py-0.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-medium rounded">
                  PROJEX
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              {documentType === 'pdf' && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-[#2c2c2e] rounded-lg">
                  <button
                    onClick={handleZoomOut}
                    disabled={zoom <= 50}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-[#3c3c3e] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Zoom out"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                    </svg>
                  </button>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[3rem] text-center">
                    {zoom}%
                  </span>
                  <button
                    onClick={handleZoomIn}
                    disabled={zoom >= 200}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-[#3c3c3e] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Zoom in"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Actions */}
              {isProjectFile && onEdit && (
                <button
                  onClick={onEdit}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2c2c2e] rounded-lg transition-colors flex items-center gap-2"
                  title="Edit in Forms"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
              )}

              <button
                onClick={handleDownload}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2c2c2e] rounded-lg transition-colors flex items-center gap-2"
                title="Download"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>

              <button
                onClick={handlePrint}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2c2c2e] rounded-lg transition-colors flex items-center gap-2"
                title="Print"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>

              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-[#2c2c2e] rounded-lg transition-colors"
                title="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto bg-gray-100 dark:bg-[#000000] p-6 flex items-center justify-center">
            {documentType === 'pdf' && documentUrl && (
              <div 
                className="bg-white shadow-2xl"
                style={{ 
                  width: `${210 * (zoom / 100)}mm`,
                  minHeight: `${297 * (zoom / 100)}mm`,
                }}
              >
                <iframe
                  src={documentUrl}
                  className="w-full h-full"
                  style={{ minHeight: `${297 * (zoom / 100)}mm` }}
                  title={documentName}
                />
              </div>
            )}

            {documentType === 'image' && documentUrl && (
              <div className="max-w-full max-h-full flex items-center justify-center">
                <img
                  src={documentUrl}
                  alt={documentName}
                  className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                  style={{ transform: `scale(${zoom / 100})` }}
                />
              </div>
            )}

            {documentType === 'text' && documentUrl && (
              <div 
                className="bg-white dark:bg-[#1c1c1e] p-8 rounded-xl shadow-2xl max-w-4xl w-full"
                style={{ transform: `scale(${zoom / 100})` }}
              >
                <iframe
                  src={documentUrl}
                  className="w-full h-[70vh]"
                  title={documentName}
                />
              </div>
            )}
          </div>

          {/* Footer - Page Navigation (for future multi-page support) */}
          {documentType === 'pdf' && totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 px-6 py-4 border-t border-gray-200 dark:border-[#2c2c2e]">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2c2c2e] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2c2c2e] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

import React from "react"

interface LoadingStateProps {
  message?: string
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message }) => {
  return (
    <div className="plasmo-flex plasmo-flex-col plasmo-items-center plasmo-justify-center plasmo-min-h-screen plasmo-p-4">
      <div className="plasmo-relative plasmo-w-12 plasmo-h-12 plasmo-mb-4">
        <div className="plasmo-absolute plasmo-inset-0 plasmo-border-4 plasmo-border-slate-200 plasmo-rounded-full"></div>
        <div className="plasmo-absolute plasmo-inset-0 plasmo-border-4 plasmo-border-slate-900 plasmo-rounded-full plasmo-border-t-transparent plasmo-animate-spin"></div>
      </div>

      {message && (
        <p className="plasmo-text-sm plasmo-text-slate-600 plasmo-text-center">
          {message}
        </p>
      )}
    </div>
  )
}

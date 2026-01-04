import React, { Component, ReactNode } from "react"

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, retry: () => void) => ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("Error caught by boundary:", error, errorInfo)
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null
    })
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry)
      }

      return (
        <div className="plasmo-flex plasmo-items-center plasmo-justify-center plasmo-min-h-screen plasmo-p-4">
          <div className="plasmo-bg-white plasmo-border plasmo-border-red-200 plasmo-rounded-lg plasmo-shadow-md plasmo-p-6 plasmo-max-w-md plasmo-w-full">
            <div className="plasmo-flex plasmo-items-center plasmo-gap-3 plasmo-mb-4">
              <svg
                className="plasmo-w-6 plasmo-h-6 plasmo-text-red-500 plasmo-flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="plasmo-text-lg plasmo-font-semibold plasmo-text-gray-900">
                Something went wrong
              </h2>
            </div>

            <div className="plasmo-mb-4">
              <p className="plasmo-text-sm plasmo-text-gray-600 plasmo-mb-2">
                An error occurred while rendering this component:
              </p>
              <pre className="plasmo-bg-red-50 plasmo-border plasmo-border-red-200 plasmo-rounded plasmo-p-3 plasmo-text-xs plasmo-text-red-800 plasmo-overflow-auto plasmo-max-h-32">
                {this.state.error.message}
              </pre>
            </div>

            <button
              onClick={this.handleRetry}
              className="plasmo-w-full plasmo-bg-red-500 hover:plasmo-bg-red-600 plasmo-text-white plasmo-font-medium plasmo-py-2 plasmo-px-4 plasmo-rounded plasmo-transition-colors plasmo-duration-200">
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

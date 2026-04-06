import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 * 
 * Catches runtime rendering errors in its children and displays a fallback UI.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-[32px] border border-gray-100 p-10 shadow-sm text-center space-y-6">
            <div className="h-20 w-20 bg-red-50 rounded-[30px] flex items-center justify-center text-red-500 mx-auto border border-red-100 shadow-sm">
                <AlertCircle size={40} />
            </div>
            <div className="space-y-2">
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">Something went wrong</h1>
                <p className="text-gray-500 text-sm font-medium leading-relaxed">
                  The application encountered an unexpected error. Please try refreshing the page.
                </p>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <div className="text-left bg-gray-50 p-4 rounded-2xl overflow-auto max-h-40 border border-gray-100">
                <code className="text-[10px] text-gray-600 whitespace-pre font-mono">
                  {this.state.error.toString()}
                </code>
              </div>
            )}

            <button
              onClick={this.handleRetry}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-2xl text-sm font-bold hover:bg-black transition-all shadow-xl shadow-gray-200 active:scale-95"
            >
              <RefreshCcw className="h-4 w-4" />
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

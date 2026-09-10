import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
          <div className="max-w-lg w-full">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-10 text-center">
              {/* Icon */}
              <div className="w-20 h-20 mx-auto mb-6 bg-red-50 rounded-full flex items-center justify-center border-4 border-red-100">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold text-slate-800 mb-2">Something went wrong</h1>
              <p className="text-slate-500 mb-8 leading-relaxed">
                Sanjeevani AI-OS encountered an unexpected error. Don't worry — your data is safe.
                Please try refreshing the page.
              </p>

              {/* Error Details (dev only) */}
              {process.env.NODE_ENV !== 'production' && this.state.error && (
                <div className="mb-8 text-left">
                  <details className="group">
                    <summary className="cursor-pointer text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-2">
                      <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                      Technical Details
                    </summary>
                    <div className="mt-3 p-4 bg-slate-900 rounded-xl text-sm text-red-300 font-mono overflow-x-auto max-h-48 overflow-y-auto">
                      <p className="text-red-400 font-bold mb-2">{this.state.error.toString()}</p>
                      {this.state.errorInfo && (
                        <pre className="text-slate-400 text-xs whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      )}
                    </div>
                  </details>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={this.handleReload}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-md shadow-blue-500/30 transition-all"
                >
                  <RefreshCw className="w-4 h-4" /> Refresh Page
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-xl border border-slate-200 shadow-sm transition-all"
                >
                  <Home className="w-4 h-4" /> Go Home
                </button>
              </div>
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-slate-400 mt-6">
              If this problem persists, please contact hospital IT support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

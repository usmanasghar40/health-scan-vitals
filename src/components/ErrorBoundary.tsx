import React from "react";

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("App render error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full rounded-2xl border border-slate-700 bg-slate-900/80 p-6">
            <h1 className="text-2xl font-semibold text-white mb-2">App failed to render</h1>
            <p className="text-slate-400 mb-4">
              Check the browser console for details. The error message below can help pinpoint the issue.
            </p>
            <pre className="text-sm text-rose-300 whitespace-pre-wrap break-words bg-slate-950/60 border border-slate-800 rounded-xl p-4">
              {this.state.error?.message || "Unknown error"}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

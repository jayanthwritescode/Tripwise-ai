import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = 'An unexpected error occurred.';
      let isPermissionError = false;

      try {
        const parsedError = JSON.parse(this.state.error?.message || '{}');
        if (parsedError.error?.includes('Missing or insufficient permissions')) {
          errorMessage = 'You do not have permission to perform this action. Please ensure you are signed in with the correct account.';
          isPermissionError = true;
        } else if (parsedError.error) {
          errorMessage = parsedError.error;
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FBFCFE] p-6">
          <div className="max-w-md w-full bg-white p-10 rounded-[3rem] border border-gray-100 shadow-2xl text-center space-y-8 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-3xl font-editorial italic text-[#1E1B4B]">Something went wrong</h2>
              <p className="text-gray-400 text-sm font-medium leading-relaxed italic">
                {errorMessage}
              </p>
            </div>

            <button
              onClick={this.handleReset}
              className="w-full py-4 bg-[#1E1B4B] text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-900/10"
            >
              <RefreshCcw className="w-5 h-5" />
              Try Again
            </button>
            
            {isPermissionError && (
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">
                Security Policy Enforcement
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

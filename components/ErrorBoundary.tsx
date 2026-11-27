'use client';

import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let message = error.message || 'An unexpected error occurred.';
    try {
      const parsed = JSON.parse(message);
      if (parsed && typeof parsed.error === 'string') {
        message = parsed.error;
      }
    } catch {
      // Plain error message
    }
    return { hasError: true, errorMessage: message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAF8] px-6 py-12">
          <div className="max-w-md w-full bg-white border border-[#DCE5DF] rounded-2xl p-8 text-center shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] text-[#B45309] flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2
              className="text-xl font-semibold text-[#132A1E] mb-2"
              style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
            >
              Unable to complete request
            </h2>
            <p className="text-sm text-[#4E6157] mb-6 leading-relaxed">
              {this.state.errorMessage}
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, errorMessage: '' })}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1F5E3B] text-white text-sm font-medium hover:bg-[#17482D] transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              Return to Pharmacy
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

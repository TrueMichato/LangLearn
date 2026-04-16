import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('LangLearn error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      const message = this.state.error?.message ?? 'Unknown error';
      const stack = this.state.error?.stack ?? message;

      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-900">
          <div className="w-full max-w-md space-y-4 text-center">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              Something went wrong 😟
            </h1>

            <pre className="overflow-x-auto rounded-lg bg-slate-200 p-3 text-left text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {message.slice(0, 200)}
            </pre>

            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Reload
              </button>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(stack)}
                className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              >
                Copy Error
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

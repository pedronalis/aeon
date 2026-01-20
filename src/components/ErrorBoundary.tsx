import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background text-text p-4">
          <div className="max-w-md w-full bg-surface border-2 border-error rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl">⚠️</div>
              <h1 className="text-2xl font-bold text-error">Erro na Aplicação</h1>
            </div>
            
            <p className="text-text-secondary">
              Ocorreu um erro ao carregar a aplicação. Veja os detalhes no console.
            </p>

            {this.state.error && (
              <div className="bg-background border border-border rounded p-3">
                <p className="text-xs font-mono text-error break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-primary text-background rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Recarregar Aplicação
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

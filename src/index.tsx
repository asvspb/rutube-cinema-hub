import React, { ReactNode, ErrorInfo } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { logger } from './services/loggerService';
import { AuthProvider } from './contexts/AuthContext';
import '../public/index.css';

// Initialize global error logging
logger.initGlobalHandlers();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Uncaught error in ErrorBoundary', { errorInfo }, error);
  }

  handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            backgroundColor: '#000917',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'sans-serif',
            padding: '20px',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '24px', marginBottom: '16px', fontWeight: 'bold' }}>
            Что-то пошло не так
          </h1>
          <p style={{ color: '#a1a1aa', marginBottom: '24px', maxWidth: '400px' }}>
            Произошла ошибка при отрисовке приложения. Возможно, данные повреждены.
          </p>
          <div
            style={{
              backgroundColor: '#27272a',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px',
              textAlign: 'left',
              width: '100%',
              maxWidth: '600px',
              overflow: 'auto',
            }}
          >
            <code style={{ fontFamily: 'monospace', color: '#ef4444' }}>
              {this.state.error?.toString()}
            </code>
          </div>
          <button
            onClick={this.handleReset}
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Сбросить настройки и перезагрузить
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/app/App';
import { AuthProvider } from './src/features/auth/context/AuthContext';
import { ErrorTracker } from './src/services/errorTracker';

// Initialize global real-time error telemetry
ErrorTracker.initGlobalHandlers();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

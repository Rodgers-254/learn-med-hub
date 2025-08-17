// src/main.tsx
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// 1. Import AuthProvider
import { AuthProvider } from '@/lib/AuthContext';

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);

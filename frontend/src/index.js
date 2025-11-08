import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ClerkProvider } from '@clerk/clerk-react';

// Clerk publishable key - directly set for reliability
const PUBLISHABLE_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY || 'pk_test_ZGVhci1lbGVwaGFudC0zNS5jbGVyay5hY2NvdW50cy5kZXYk';

if (!PUBLISHABLE_KEY || PUBLISHABLE_KEY.includes('your_clerk')) {
  console.error('❌ Invalid Clerk key! Please check your .env file.');
}

console.log('✅ Clerk key loaded:', PUBLISHABLE_KEY.substring(0, 20) + '...');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <App />
    </ClerkProvider>
  </React.StrictMode>
);

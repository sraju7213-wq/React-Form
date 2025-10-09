import React from 'react';
import ReactDOM from 'react-dom/client';
import AdminApp from './AdminApp';
import './admin.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Admin root element not found');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <AdminApp />
  </React.StrictMode>,
);

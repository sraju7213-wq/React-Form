import React from 'react';
import ReactDOM from 'react-dom/client';
import '../style.css';
import { AdminApp } from './AdminApp';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AdminApp />
  </React.StrictMode>,
);

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { GlobalFilterProvider } from './context/GlobalFilterContext.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/dashboard.scss';

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <GlobalFilterProvider>
        <App />
      </GlobalFilterProvider>
    </BrowserRouter>
  </React.StrictMode>
);


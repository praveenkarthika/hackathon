import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard.jsx';
import TicketList from './pages/TicketList.jsx';
import EditTicket from './pages/EditTicket.jsx';
import Header from './components/layout/Header.jsx';
import Login from './pages/Login.jsx';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    // Check for token on initial load (handled by initial state, but can double check or validate if needed)
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }

    const handleUnauthorized = () => {
      handleLogout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="d-flex flex-column min-vh-100 bg-body">
      <Header onLogout={handleLogout} />
      
      <main className="flex-grow-1 overflow-auto p-4 container-xxl">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tickets" element={<TicketList />} />
          <Route path="/tickets/edit/:ticketId" element={<EditTicket />} />
          {/* Redirect any unknown route to dashboard if authenticated */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

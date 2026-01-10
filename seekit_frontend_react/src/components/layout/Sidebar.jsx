import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import styles from './Sidebar.module.scss';

function Sidebar({ isNavOpen = true }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Track expansion of main items
  const [expanded, setExpanded] = useState({
    tickets: true // Default expanded
  });

  const toggleExpand = (id) => {
    setExpanded(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleMainClick = (id, path) => {
    navigate(path);
    // For tickets, we also want to ensure it's expanded if we click the main item
    if (id === 'tickets') {
        // Optional: force expand if clicking main item, or toggle
        // User said "on click ticket it will show below", so expanding makes sense.
        if (!expanded.tickets) {
            setExpanded(prev => ({ ...prev, tickets: true }));
        }
        // If already expanded, maybe don't collapse? Or toggle? 
        // Standard accordion behavior is toggle.
        // But if clicking main link navigates, maybe we just expand.
        // I'll stick to toggle for flexibility, or just ensure open.
        // Let's just toggle for now.
        toggleExpand(id);
    }
  };

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className={`${styles.sidebar} ${isNavOpen ? '' : styles.sidebarClosed}`}>
      {/* Dashboard */}
      <div 
        className={`${styles.menuItem} ${isActive('/dashboard-v2') ? styles.active : ''}`}
        onClick={() => handleMainClick('dashboard', '/dashboard-v2')}
      >
        <div className="d-flex align-items-center">
            <i className={`bi bi-speedometer2 ${styles.icon}`}></i>
            <span>Dashboard</span>
        </div>
      </div>

      {/* Tickets */}
      <div 
        className={`${styles.menuItem} ${isActive('/tickets') ? styles.active : ''}`}
        onClick={() => handleMainClick('tickets', '/tickets')}
      >
        <div className="d-flex align-items-center">
            <i className={`bi bi-ticket-perforated ${styles.icon}`}></i>
            <span>Tickets</span>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;

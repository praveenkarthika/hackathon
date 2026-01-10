import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Header.module.scss';

function Header({ onLogout }) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className={`${styles.header} d-flex align-items-center justify-content-between px-4`}>
      <div className="d-flex align-items-center gap-4">
        {/* Logo */}
        <div className="d-flex align-items-center">
          <img src="/logo1.png" alt="CKit Logo" style={{ height: '50px' }} />
        </div>

        {/* Navigation */}
        <nav className="d-flex align-items-center gap-1">
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
          >
            <i className="bi bi-speedometer2"></i>
            Dashboard
          </NavLink>
          <NavLink 
            to="/dashboard-v2" 
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
          >
            <i className="bi bi-graph-up-arrow"></i>
            Dashboard 2.0
            <span className="badge bg-primary rounded-pill ms-2" style={{ fontSize: '0.6rem' }}>NEW</span>
          </NavLink>
          <NavLink 
            to="/tickets" 
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
          >
            <i className="bi bi-ticket-perforated"></i>
            Tickets
          </NavLink>
        </nav>
      </div>

      <div className="d-flex align-items-center gap-2">
        {/* Icons */}
        <div className="d-flex align-items-center gap-1 me-2">
          <div className={styles.iconBtn} title="My Day">
            <i className="bi bi-calendar-check"></i>
          </div>
          <div className={styles.iconBtn} title="Notifications">
            <i className="bi bi-bell"></i>
          </div>
          <div className={styles.iconBtn} title="Settings">
            <i className="bi bi-gear"></i>
          </div>
        </div>
        
        {/* User Profile */}
        <div className="position-relative">
          <div 
            className={styles.avatar} 
            role="button" 
            onClick={() => setShowDropdown(!showDropdown)}
            title="User Profile"
          >
            <img src="https://ui-avatars.com/api/?name=Admin+User&background=0078d4&color=fff" alt="User" />
          </div>

          {showDropdown && (
            <>
              <div className="position-fixed top-0 start-0 w-100 h-100" style={{ zIndex: 999 }} onClick={() => setShowDropdown(false)}></div>
              <div className="position-absolute end-0 mt-2 bg-white border rounded shadow-sm py-1" style={{ minWidth: '150px', zIndex: 1000 }}>
                <button 
                  className="dropdown-item d-flex align-items-center px-3 py-2 text-danger" 
                  onClick={() => {
                    setShowDropdown(false);
                    onLogout();
                  }}
                >
                  <i className="bi bi-box-arrow-right me-2"></i>
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;

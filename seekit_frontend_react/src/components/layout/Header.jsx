import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Header.module.scss';

function Header({ onLogout }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <header className={`${styles.header} d-flex flex-wrap align-items-center justify-content-between px-3 px-md-4 py-2`}>
      <div className="d-flex align-items-center gap-3 gap-md-4">
        {/* Mobile Menu Toggle */}
        <button className="btn btn-link p-0 text-dark d-md-none" onClick={() => setShowMobileMenu(!showMobileMenu)}>
          <i className="bi bi-list fs-4"></i>
        </button>

        {/* Logo */}
        <div className="d-flex align-items-center">
          <img src="/logo1.png" alt="CKit Logo" style={{ height: '40px', maxHeight: '50px' }} />
        </div>

        {/* Navigation */}
        <nav className="d-none d-md-flex align-items-center gap-1">
          <NavLink 
            to="/dashboard-v2" 
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
          >
            <i className="bi bi-speedometer2"></i>
            Dashboard
          </NavLink>
          <NavLink 
            to="/tickets" 
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
          >
            <i className="bi bi-ticket-perforated"></i>
            Tickets
          </NavLink>
          <NavLink 
            to="/assets" 
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
          >
            <i className="bi bi-pc-display"></i>
            Assets
          </NavLink>
          <NavLink 
            to="/contracts" 
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
          >
            <i className="bi bi-receipt"></i>
            Contracts
          </NavLink>
          <NavLink 
            to="/users" 
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
          >
            <i className="bi bi-people"></i>
            Users
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
      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="w-100 d-md-none mt-3 border-top pt-2">
          <nav className="d-flex flex-column gap-2">
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''} px-2 py-2`}
              onClick={() => setShowMobileMenu(false)}
            >
              <i className="bi bi-speedometer2 me-2"></i>
              Dashboard
            </NavLink>
            <NavLink 
              to="/dashboard-v2" 
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''} px-2 py-2`}
              onClick={() => setShowMobileMenu(false)}
            >
              <i className="bi bi-graph-up-arrow me-2"></i>
              Dashboard 2.0
              <span className="badge bg-primary rounded-pill ms-2" style={{ fontSize: '0.6rem' }}>NEW</span>
            </NavLink>
            <NavLink 
              to="/tickets" 
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''} px-2 py-2`}
              onClick={() => setShowMobileMenu(false)}
            >
              <i className="bi bi-ticket-perforated me-2"></i>
              Tickets
            </NavLink>
            <NavLink 
              to="/assets" 
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''} px-2 py-2`}
              onClick={() => setShowMobileMenu(false)}
            >
              <i className="bi bi-pc-display me-2"></i>
              Assets
            </NavLink>
            <NavLink 
              to="/users" 
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''} px-2 py-2`}
              onClick={() => setShowMobileMenu(false)}
            >
              <i className="bi bi-people me-2"></i>
              Users
            </NavLink>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Header;

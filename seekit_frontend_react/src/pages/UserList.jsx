import { useEffect, useMemo, useState } from 'react';
import { fetchUsers } from '../services/api';

function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter & Sort State
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [sort, setSort] = useState({ key: 'user_id', dir: 'asc' });
  
  // Pagination State
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Fetch Data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchUsers();
        // Handle different response structures safely
        const rawUsers = Array.isArray(data) ? data : (data.users || []);
        
        // Map API response to component state
        const mappedUsers = rawUsers.map(u => ({
            user_id: u.id,
            name: u.username,
            email: u.user_email,
            role: u.role,
            status: u.status,
            created_at: u.created_at,
            department: '-' // Not provided in API response
        }));
        
        setUsers(mappedUsers);
      } catch (err) {
        console.error("Failed to fetch users:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Derived Data (Stats)
  const stats = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter(u => (u.role || '').toLowerCase().includes('admin')).length,
      editors: users.filter(u => (u.role || '').toLowerCase().includes('editor')).length,
      viewers: users.filter(u => (u.role || '').toLowerCase().includes('viewer')).length
    };
  }, [users]);

  // Filter Logic
  const filteredUsers = useMemo(() => {
    let result = users;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(u => 
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        String(u.user_id || '').toLowerCase().includes(q)
      );
    }

    if (roleFilter !== 'All') {
      result = result.filter(u => (u.role || '') === roleFilter);
    }

    return result;
  }, [users, search, roleFilter]);

  // Sort Logic
  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      const valA = a[sort.key] || '';
      const valB = b[sort.key] || '';
      
      if (sort.dir === 'asc') {
        return String(valA).localeCompare(String(valB));
      } else {
        return String(valB).localeCompare(String(valA));
      }
    });
  }, [filteredUsers, sort]);

  // Pagination Logic
  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedUsers.slice(start, start + pageSize);
  }, [sortedUsers, page]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize);

  const handleSort = (key) => {
    setSort(prev => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Extract unique roles for filter dropdown
  const roles = useMemo(() => {
    const uniqueRoles = new Set(users.map(u => u.role).filter(Boolean));
    return ['All', ...Array.from(uniqueRoles)];
  }, [users]);

  const maskEmail = (email) => {
    if (!email) return '';
    try {
      const parts = email.split('@');
      if (parts.length !== 2) return email;
      
      const [name, domain] = parts;
      if (name.length <= 2) {
        return `${name}***@${domain}`;
      }
      return `${name.substring(0, 2)}****@${domain}`;
    } catch (e) {
      return email;
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger m-4" role="alert">
        Error loading users: {error}
      </div>
    );
  }

  return (
    <div className="container-fluid p-4 bg-light min-vh-100">
      <style>{`
        .approach-card {
            background: #fff;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            transition: all 0.2s ease;
            cursor: pointer;
            border: 1px solid #e2e8f0;
            height: 100%;
            position: relative;
            overflow: hidden;
        }
        .approach-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            border-color: rgba(26, 27, 103, 0.3);
        }
        .approach-card.active {
            border-color: rgba(26, 27, 103, 0.867);
            background-color: rgba(26, 27, 103, 0.02);
        }
        .approach-card .card-icon-wrapper {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            margin-bottom: 1rem;
        }
        .approach-card .card-label {
            color: #64748b;
            font-size: 0.875rem;
            font-weight: 600;
            margin-bottom: 0.25rem;
        }
        .approach-card .card-value {
            color: #0f172a;
            font-size: 1.875rem;
            font-weight: 700;
            line-height: 1.2;
        }
        .search-input:focus {
          border-color: rgba(26, 27, 103, 0.867);
          box-shadow: 0 0 0 2px rgba(26, 27, 103, 0.1);
        }
        .table-custom thead th {
          background-color: #f8fafc;
          color: #64748b;
          font-weight: 600;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #e2e8f0;
          padding: 1rem 1.5rem;
          white-space: nowrap;
          cursor: pointer;
        }
        .table-custom tbody td {
          padding: 1rem 1.5rem;
          color: #334155;
          font-size: 0.875rem;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }
        .table-custom tbody tr:nth-of-type(even) {
          background-color: #f8fafc;
        }
        .table-custom tbody tr:hover {
          background-color: #f1f5f9;
        }
        .page-link.active {
          background-color: rgba(26, 27, 103, 0.867);
          border-color: rgba(26, 27, 103, 0.867);
        }
      `}</style>

      <div className="d-flex flex-column gap-4 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h4 className="fw-bold text-dark mb-1">User Management</h4>
          <p className="text-secondary small mb-0">Manage system users and their roles</p>
        </div>

        {/* Approach Cards */}
        <div className="row g-4">
          <div className="col-md-3">
            <div className="approach-card" onClick={() => { setSearch(''); setRoleFilter('All'); }}>
              <div className="card-icon-wrapper bg-primary-subtle text-primary">
                <i className="bi bi-people"></i>
              </div>
              <div className="card-label">Total Users</div>
              <div className="card-value">{stats.total}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="approach-card" onClick={() => setRoleFilter(roles.find(r => r.toLowerCase().includes('admin')) || 'All')}>
              <div className="card-icon-wrapper bg-danger-subtle text-danger">
                <i className="bi bi-shield-lock"></i>
              </div>
              <div className="card-label">Administrators</div>
              <div className="card-value">{stats.admins}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="approach-card" onClick={() => setRoleFilter('editor')}>
              <div className="card-icon-wrapper bg-info-subtle text-info">
                <i className="bi bi-pencil-square"></i>
              </div>
              <div className="card-label">Editors</div>
              <div className="card-value">{stats.editors}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="approach-card" onClick={() => setRoleFilter('viewer')}>
              <div className="card-icon-wrapper bg-success-subtle text-success">
                <i className="bi bi-eye"></i>
              </div>
              <div className="card-label">Viewers</div>
              <div className="card-value">{stats.viewers}</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
          <div className="position-relative" style={{ minWidth: '300px' }}>
            <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"></i>
            <input 
              type="text" 
              className="form-control search-input ps-5" 
              placeholder="Search by name, email or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="d-flex align-items-center gap-2">
            <label className="text-secondary small fw-semibold">Role:</label>
            <select 
              className="form-select" 
              style={{ width: 'auto' }}
              value={roleFilter} 
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
          <div className="table-responsive">
            <table className="table table-custom align-middle mb-0">
              <thead>
                <tr>
                  <th onClick={() => handleSort('user_id')}>
                    ID {sort.key === 'user_id' && (sort.dir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('name')}>
                    Name {sort.key === 'name' && (sort.dir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('email')}>
                    Email {sort.key === 'email' && (sort.dir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('role')}>
                    Role {sort.key === 'role' && (sort.dir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('status')}>
                    Status {sort.key === 'status' && (sort.dir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('created_at')}>
                    Created {sort.key === 'created_at' && (sort.dir === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length > 0 ? (
                  pageItems.map(user => (
                    <tr key={user.user_id || Math.random()}>
                      <td><span className="font-monospace fw-semibold text-primary">{user.user_id}</span></td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="rounded-circle bg-secondary-subtle d-flex align-items-center justify-content-center" style={{width: '32px', height: '32px'}}>
                            <span className="small fw-bold text-secondary">{(user.name || 'U').charAt(0).toUpperCase()}</span>
                          </div>
                          <span className="fw-medium">{user.name}</span>
                        </div>
                      </td>
                      <td title={user.email}>{maskEmail(user.email)}</td>
                      <td>
                        <span className={`badge rounded-pill fw-medium ${
                          (user.role || '').toLowerCase().includes('admin') ? 'bg-danger-subtle text-danger' :
                          (user.role || '').toLowerCase().includes('editor') ? 'bg-info-subtle text-info' :
                          'bg-light text-dark border'
                        }`}>
                          {user.role || 'User'}
                        </span>
                      </td>
                      <td>
                         <span className={`badge rounded-pill ${user.status ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}>
                           {user.status ? 'Active' : 'Inactive'}
                         </span>
                      </td>
                      <td>
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-5 text-muted">
                      <i className="bi bi-person-x fs-1 d-block mb-2"></i>
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center p-3 border-top bg-light bg-opacity-25">
              <span className="text-muted small">
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filteredUsers.length)} of {filteredUsers.length} users
              </span>
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button>
                  </li>
                  {[...Array(totalPages)].map((_, i) => (
                    <li key={i} className={`page-item ${page === i + 1 ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => setPage(i + 1)}>{i + 1}</button>
                    </li>
                  ))}
                  <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserList;

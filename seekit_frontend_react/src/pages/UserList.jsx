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
  
  // Selection & Editing State
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

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

  const handleUpdateUser = (updatedUser) => {
    // Optimistic update
    setUsers(prevUsers => prevUsers.map(u => 
      u.user_id === updatedUser.user_id ? updatedUser : u
    ));
    setEditingUser(null);
    // TODO: Call API to persist changes
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
    <>
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
        .user-offcanvas {
          box-shadow: -4px 0 20px rgba(0, 0, 0, 0.05);
          width: 480px !important;
        }
        .info-card {
          background: #fff;
          border-radius: 12px;
          padding: 1.25rem;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          border: 1px solid #f1f5f9;
        }
        .info-label {
          color: #64748b;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.025em;
          margin-bottom: 0.35rem;
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }
        .info-value {
          color: rgba(26, 27, 103, 0.867);
          font-size: 0.9375rem;
          font-weight: 500;
        }
        .action-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .action-btn:hover {
          background-color: #f1f5f9;
          transform: translateY(-1px);
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
                  <th className="text-end pe-4">Actions</th>
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
                      <td className="text-end pe-4">
                        <div className="d-flex justify-content-end gap-1">
                           <button 
                            className="btn btn-link text-secondary p-0 action-btn rounded-circle" 
                            onClick={() => setSelectedUser(user)}
                            title="View Details"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          <button 
                            className="btn btn-link text-secondary p-0 action-btn rounded-circle" 
                            onClick={() => setEditingUser(user)}
                            title="Edit User"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                        </div>
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

      {/* Backdrop for Offcanvas */}
      {selectedUser && <div className="offcanvas-backdrop fade show" onClick={() => setSelectedUser(null)}></div>}

      {/* User Details Drawer (Offcanvas) */}
      <div 
        className={`offcanvas offcanvas-end user-offcanvas ${selectedUser ? 'show' : ''}`} 
        tabIndex="-1" 
        style={{ visibility: selectedUser ? 'visible' : 'hidden' }}
      >
        <div className="offcanvas-header border-bottom">
          <h5 className="offcanvas-title fw-bold text-dark">User Details</h5>
          <button type="button" className="btn-close" onClick={() => setSelectedUser(null)} aria-label="Close"></button>
        </div>
        <div className="offcanvas-body bg-light p-3">
          {selectedUser && (
            <div className="d-flex flex-column gap-3">
               {/* Profile Card */}
               <div className="info-card text-center py-4">
                  <div className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center mx-auto mb-3" style={{width: '80px', height: '80px', fontSize: '2rem'}}>
                    {(selectedUser.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <h5 className="fw-bold text-dark mb-1">{selectedUser.name}</h5>
                  <span className={`badge rounded-pill ${
                      (selectedUser.role || '').toLowerCase().includes('admin') ? 'bg-danger-subtle text-danger' :
                      (selectedUser.role || '').toLowerCase().includes('editor') ? 'bg-info-subtle text-info' :
                      'bg-secondary-subtle text-secondary'
                    }`}>
                      {selectedUser.role}
                  </span>
               </div>

               {/* General Info */}
               <div className="info-card">
                  <h6 className="fw-bold text-primary mb-3 small text-uppercase">
                    <i className="bi bi-person-lines-fill me-2"></i>Contact Information
                  </h6>
                  <div className="d-flex flex-column gap-3">
                    <div>
                      <label className="info-label">User ID</label>
                      <div className="info-value font-monospace text-dark">{selectedUser.user_id}</div>
                    </div>
                    <div>
                      <label className="info-label">Email Address</label>
                      <div className="info-value text-break">{selectedUser.email}</div>
                      <div className="text-success small mt-1"><i className="bi bi-unlock me-1"></i>Unmasked for admin view</div>
                    </div>
                    <div>
                      <label className="info-label">Status</label>
                      <div>
                        <span className={`badge rounded-pill ${selectedUser.status ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}>
                           {selectedUser.status ? 'Active' : 'Inactive'}
                         </span>
                      </div>
                    </div>
                  </div>
               </div>

               {/* Metadata */}
               <div className="info-card">
                  <h6 className="fw-bold text-primary mb-3 small text-uppercase">
                    <i className="bi bi-clock-history me-2"></i>System Metadata
                  </h6>
                  <div className="row g-3">
                    <div className="col-6">
                      <label className="info-label">Created At</label>
                      <div className="info-value small text-dark">
                        {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString() : '-'}
                      </div>
                    </div>
                    <div className="col-6">
                      <label className="info-label">Last Login</label>
                      <div className="info-value small text-dark">-</div>
                    </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }} tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                <div className="modal-header border-bottom p-4 border-top border-4" style={{ borderColor: 'rgba(26, 27, 103, 0.867)', backgroundColor: 'rgba(26, 27, 103, 0.03)' }}>
                  <div className="d-flex align-items-center gap-3">
                    <div className="text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, backgroundColor: 'rgba(26, 27, 103, 0.867)' }}>
                        <i className="bi bi-person-gear fs-4"></i>
                    </div>
                    <div>
                        <h5 className="modal-title fw-bold text-dark mb-1">Edit User</h5>
                        <div className="text-secondary small d-flex align-items-center gap-2">
                            <span className="badge bg-light text-secondary border">{editingUser.user_id}</span>
                        </div>
                    </div>
                  </div>
                  <button type="button" className="btn-close" onClick={() => setEditingUser(null)}></button>
                </div>
                <div className="modal-body p-4">
                  <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.target);
                      const updated = {
                        ...editingUser,
                        name: formData.get('name'),
                        email: formData.get('email'), // Allow editing email?
                        role: formData.get('role'),
                        status: formData.get('status') === 'true'
                      };
                      handleUpdateUser(updated);
                    }}>
                    
                    <div className="mb-4">
                      <label className="form-label fw-bold text-secondary small text-uppercase d-flex align-items-center gap-2">
                        <i className="bi bi-person" style={{ color: 'rgba(26, 27, 103, 0.867)' }}></i> Full Name <span className="text-danger">*</span>
                      </label>
                      <input 
                        name="name" 
                        className="form-control bg-light border-0 shadow-none" 
                        defaultValue={editingUser.name} 
                        required 
                      />
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-bold text-secondary small text-uppercase d-flex align-items-center gap-2">
                        <i className="bi bi-envelope" style={{ color: 'rgba(26, 27, 103, 0.867)' }}></i> Email Address <span className="text-danger">*</span>
                      </label>
                      <input 
                        name="email" 
                        type="email"
                        className="form-control bg-light border-0 shadow-none" 
                        defaultValue={editingUser.email} 
                        required 
                      />
                    </div>
                    
                    <div className="row g-4 mb-4">
                        <div className="col-md-6">
                            <label className="form-label fw-bold text-secondary small text-uppercase d-flex align-items-center gap-2">
                                <i className="bi bi-shield-lock" style={{ color: 'rgba(26, 27, 103, 0.867)' }}></i> Role
                            </label>
                            <select 
                                name="role" 
                                className="form-select bg-light border-0 shadow-none" 
                                defaultValue={editingUser.role}
                            >
                                <option value="Admin">Admin</option>
                                <option value="Editor">Editor</option>
                                <option value="Viewer">Viewer</option>
                            </select>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-bold text-secondary small text-uppercase d-flex align-items-center gap-2">
                                <i className="bi bi-toggle-on" style={{ color: 'rgba(26, 27, 103, 0.867)' }}></i> Status
                            </label>
                            <select 
                                name="status" 
                                className="form-select bg-light border-0 shadow-none" 
                                defaultValue={editingUser.status ? 'true' : 'false'}
                            >
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div className="d-flex justify-content-end gap-2 pt-3 border-top">
                        <button type="button" className="btn btn-light border px-4" onClick={() => setEditingUser(null)}>Cancel</button>
                        <button type="submit" className="btn text-white px-4 fw-semibold shadow-sm" style={{ backgroundColor: 'rgba(26, 27, 103, 0.867)' }}>
                            <i className="bi bi-check-lg me-2"></i>Save Changes
                        </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
        </div>
      )}
    </>
  );
}

export default UserList;

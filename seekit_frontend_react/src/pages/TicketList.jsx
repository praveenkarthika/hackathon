import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useGlobalFilters } from '../context/GlobalFilterContext.jsx';
import { fetchAuditLogs, fetchUsers } from '../services/api';

const TICKET_TYPE_CATALOG = [
  { type: 'Hardware', categories: ['Laptop', 'Desktop', 'Server', 'Printer', 'Scanner', 'Monitor', 'Keyboard', 'Mouse', 'UPS'] },
  { type: 'Software', categories: ['Email', 'ERP', 'CRM', 'Accounting Software', 'HRMS', 'Browser', 'Operating System', 'Antivirus', 'VPN Client'] },
  { type: 'Network', categories: ['WiFi', 'LAN', 'VPN', 'Firewall', 'Router', 'Switch', 'Bandwidth', 'DNS'] },
  { type: 'Access', categories: ['User Login', 'Password Reset', 'Role Access', 'Email Access', 'VPN Access', 'Application Access', 'Database Access'] },
  { type: 'Security', categories: ['Malware', 'Phishing', 'Data Breach', 'Unauthorized Access', 'Endpoint Security', 'Patch Management'] },
  { type: 'Service Request', categories: ['New Laptop Request', 'Software Installation', 'User Creation', 'Email Setup', 'VPN Setup', 'Asset Allocation'] },
  { type: 'Maintenance', categories: ['System Upgrade', 'Server Maintenance', 'Network Maintenance', 'Backup', 'Patch Update'] },
  { type: 'Other', categories: ['General Query', 'Unknown Issue'] },
];

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });
};

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function TicketList() {
  const { filteredTickets, resolveTicket, updateTicket, createTicket, loading, error } = useGlobalFilters();
  const query = useQuery();
  const [localFilter, setLocalFilter] = useState({ status: 'All', type: 'All', category: 'All', priority: 'All', searchId: '', slaBreached: false });
  const [sort, setSort] = useState({ key: 'createdAt', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [drawerTab, setDrawerTab] = useState('DETAILS'); // New state for drawer tabs
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const stats = useMemo(() => {
    return {
      total: filteredTickets.length,
      open: filteredTickets.filter(t => t.status === 'Open').length,
      highPriority: filteredTickets.filter(t => t.priority === 'High').length,
      slaBreached: filteredTickets.filter(t => t.slaBreached).length
    };
  }, [filteredTickets]);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    type: 'Hardware',
    category: 'Laptop', // Default to first category of Hardware
    priority: 'Low',
    assigned_agent: ''
  });
  const [editingTicket, setEditingTicket] = useState(null);
  
  // User Search State
  const [allUsers, setAllUsers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState([]);

  const [confirmStatus, setConfirmStatus] = useState(null);
  const [confirmComment, setConfirmComment] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Auto-dismiss toast
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);
  const pageSize = 10;

  const ticketTypeOptions = useMemo(() => ['All', ...TICKET_TYPE_CATALOG.map((x) => x.type)], []);
  const ticketCategoryOptions = useMemo(() => {
    if (localFilter.type === 'All') {
      const all = TICKET_TYPE_CATALOG.flatMap((x) => x.categories);
      return ['All', ...Array.from(new Set(all))];
    }
    const found = TICKET_TYPE_CATALOG.find((x) => x.type === localFilter.type);
    return ['All', ...(found?.categories ?? [])];
  }, [localFilter.type]);

  useEffect(() => {
    const status = query.get('status') || 'All';
    const type = query.get('type') || 'All';
    setLocalFilter((prev) => ({ ...prev, status, type }));
  }, [query]);

  useEffect(() => {
    setShowStatusDropdown(false);
    setDrawerTab('DETAILS'); // Reset tab when ticket selection changes
  }, [selectedTicket]);

  // Fetch Users when Edit Modal or Create Modal Opens
  useEffect(() => {
    if (editingTicket || showCreateModal) {
      if (editingTicket) {
        setUserSearchQuery(editingTicket.assigned_agent || '');
      } else {
        setUserSearchQuery('');
      }
      const loadUsers = async () => {
        try {
          const data = await fetchUsers();
          const users = Array.isArray(data) ? data : (data.users || []);
          setAllUsers(users);
        } catch (err) {
          console.error("Failed to fetch users:", err);
        }
      };
      loadUsers();
    }
  }, [editingTicket, showCreateModal]);

  // Filter Users
  useEffect(() => {
    if (userSearchQuery && showUserDropdown) {
        const query = userSearchQuery.toLowerCase();
        setFilteredUsers(allUsers.filter(u => 
            (u.username || '').toLowerCase().includes(query) || 
            (u.user_email || '').toLowerCase().includes(query)
        ));
    } else {
        setFilteredUsers([]);
    }
  }, [userSearchQuery, allUsers, showUserDropdown]);

  // Fetch audit logs when tab is active
  useEffect(() => {
    if (selectedTicket && drawerTab === 'AUDIT') {
      const loadLogs = async () => {
        setAuditLoading(true);
        try {
          const response = await fetchAuditLogs(selectedTicket.id);
          setAuditLogs(Array.isArray(response) ? response : (response.logs || []));
        } catch (err) {
          console.error("Failed to fetch audit logs", err);
           setAuditLogs([
            { id: 1, action: 'Ticket Viewed', user: 'System', timestamp: new Date().toISOString(), details: 'Ticket details viewed' },
            { id: 2, action: 'Status Update', user: 'Admin', timestamp: new Date(Date.now() - 86400000).toISOString(), details: 'Status changed from Open to In Progress' }
          ]);
        } finally {
          setAuditLoading(false);
        }
      };
      loadLogs();
    }
  }, [selectedTicket, drawerTab]);

  const tickets = useMemo(() => {
    let t = filteredTickets;
    if (localFilter.searchId) {
      t = t.filter((x) => x.id && x.id.toLowerCase().includes(localFilter.searchId.toLowerCase()));
    }
    if (localFilter.status !== 'All') {
      t = t.filter((x) => x.status === localFilter.status);
    }
    if (localFilter.type !== 'All') {
      t = t.filter((x) => x.type === localFilter.type);
    }
    if (localFilter.category !== 'All') {
      t = t.filter((x) => x.category === localFilter.category);
    }
    if (localFilter.priority !== 'All') {
      t = t.filter((x) => x.priority === localFilter.priority);
    }
    if (localFilter.slaBreached) {
      t = t.filter((x) => x.slaBreached);
    }
    const sorted = [...t].sort((a, b) => {
      const va = a[sort.key];
      const vb = b[sort.key];
      // Safety check for undefined values
      const valA = va || '';
      const valB = vb || '';
      
      if (sort.key === 'createdAt') {
        return sort.dir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sort.dir === 'asc' ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });
    return sorted;
  }, [filteredTickets, localFilter, sort]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger m-3" role="alert">
        Error loading tickets: {error}
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(tickets.length / pageSize));
  const pageItems = tickets.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

  const changeSort = (key) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
  };

  const handleStatusChange = async (newStatus) => {
    setShowStatusDropdown(false);
    if (!selectedTicket) return;
    if (selectedTicket.status === newStatus && newStatus !== 'Resolved') return;
    setConfirmStatus(newStatus);
    setConfirmComment('');
  };

  const confirmStatusChange = async () => {
    if (!selectedTicket || !confirmStatus) return;

    const updated = { ...selectedTicket, status: confirmStatus };
    setSelectedTicket(updated);
    await resolveTicket(selectedTicket.id, confirmStatus, confirmComment || '');
    setConfirmStatus(null);
    setConfirmComment('');
    setSelectedTicket(null);
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      await createTicket({
          ...newTicket,
          status: 'Created', // Default status
          created_at: new Date().toISOString()
      });
      setShowCreateModal(false);
      setNewTicket({
        title: '',
        description: '',
        type: 'Hardware',
        category: 'Laptop',
        priority: 'Low',
        assigned_agent: ''
      });
      setToast({ show: true, message: 'Ticket created successfully', type: 'success' });
    } catch (err) {
      alert('Failed to create ticket: ' + err.message);
    }
  };

  const handleNewTicketTypeChange = (e) => {
    const type = e.target.value;
    const found = TICKET_TYPE_CATALOG.find((x) => x.type === type);
    setNewTicket(prev => ({
        ...prev,
        type,
        category: found?.categories[0] || ''
    }));
  };

  const columns = [
    { key: 'id', label: 'Ticket ID' },
    { key: 'title', label: 'Title' },
    { key: 'type', label: 'Ticket Type' },
    { key: 'category', label: 'Category' },
    { key: 'priority', label: 'Priority' },
    { key: 'status', label: 'Status' },
    { key: 'assigned_agent', label: 'Assigned Agent' },
  ];

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  const columnCell = (ticket, col) => {
    const value = ticket?.[col.key];

    if (['createdAt', 'acknowledged_at', 'resolved_at', 'closed_at'].includes(col.key)) {
      return <span>{formatDate(value)}</span>;
    }

    if (col.key === 'id') {
      return <span className="ticketsIdLink" onClick={() => setSelectedTicket(ticket)}>{value ?? '-'}</span>;
    }

    if (col.key === 'priority') {
      const cls = ticket.priority === 'High'
        ? 'bg-danger-subtle text-danger-emphasis'
        : ticket.priority === 'Medium'
          ? 'bg-warning-subtle text-warning-emphasis'
          : 'bg-secondary-subtle text-secondary-emphasis';
      return <span className={`badge rounded-pill fw-semibold ${cls}`}>{ticket.priority ?? '-'}</span>;
    }

    if (col.key === 'slaBreached') {
      return ticket.slaBreached
        ? <span className="badge rounded-pill bg-danger-subtle text-danger-emphasis fw-semibold">Breached</span>
        : <span className="badge rounded-pill bg-success-subtle text-success-emphasis fw-semibold">OK</span>;
    }

    const shouldTruncate = col.key === 'title' || col.key === 'description' || col.key === 'assigned_agent';
    if (shouldTruncate) {
      const maxWidth = col.key === 'description' ? 280 : 200;
      return (
        <span className="d-inline-block text-truncate" style={{ maxWidth }} title={value ?? ''}>
          {value ?? '-'}
        </span>
      );
    }

    return value ?? '-';
  };

  return (
    <div className="container-fluid p-4 bg-light min-vh-100">
      {/* Toast Notification */}
      {toast.show && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1100 }}>
          <div className={`toast show align-items-center text-white bg-${toast.type === 'success' ? 'success' : 'danger'} border-0`} role="alert" aria-live="assertive" aria-atomic="true">
            <div className="d-flex">
              <div className="toast-body">
                {toast.message}
              </div>
              <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToast(prev => ({ ...prev, show: false }))} aria-label="Close"></button>
            </div>
          </div>
        </div>
      )}
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
        .search-input-group {
          position: relative;
        }
        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
        }
        .search-input {
          padding-left: 38px;
          border-radius: 8px;
          border-color: #e2e8f0;
          box-shadow: none;
        }
        .search-input:focus {
          border-color: rgba(26, 27, 103, 0.867);
          box-shadow: 0 0 0 2px rgba(26, 27, 103, 0.1);
        }
        .filter-select {
          border-radius: 8px;
          border-color: #e2e8f0;
          font-size: 0.875rem;
          cursor: pointer;
        }
        .filter-select:focus {
          border-color: rgba(26, 27, 103, 0.867);
          box-shadow: 0 0 0 2px rgba(26, 27, 103, 0.1);
        }
        .table-custom {
          margin-bottom: 0;
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
        }
        .table-custom tbody td {
          padding: 1rem 1.5rem;
          color: #334155;
          font-size: 0.875rem;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }
        .table-custom tbody tr {
          transition: all 0.2s;
        }
        .table-custom tbody tr:nth-of-type(even) {
          background-color: #f8fafc;
        }
        .table-custom tbody tr:hover {
          background-color: #f1f5f9;
        }
        .ticketsIdLink {
          font-family: 'Monaco', 'Consolas', monospace;
          color: rgba(26, 27, 103, 0.867);
          font-weight: 600;
          cursor: pointer;
        }
        .ticketsIdLink:hover {
          text-decoration: underline;
        }
        .pagination-custom .page-link {
          border: none;
          color: #64748b;
          border-radius: 8px;
          margin: 0 4px;
          font-size: 0.875rem;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .pagination-custom .page-item.active .page-link {
          background-color: rgba(26, 27, 103, 0.867);
          color: white;
          box-shadow: 0 2px 4px rgba(26, 27, 103, 0.2);
        }
        .pagination-custom .page-item.disabled .page-link {
          color: #cbd5e1;
          background-color: transparent;
        }
        .pagination-custom .page-link:hover:not(.active) {
          background-color: #e2e8f0;
          color: rgba(26, 27, 103, 0.867);
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

        /* Drawer Styles */
        .ticket-offcanvas {
          box-shadow: -4px 0 20px rgba(0, 0, 0, 0.05);
          width: 480px !important;
        }
        .ticket-offcanvas .offcanvas-header {
          background-color: #fff;
          padding: 1.25rem 1.5rem;
        }
        .ticket-offcanvas .offcanvas-title {
          font-weight: 700;
          color: rgba(26, 27, 103, 0.867);
          font-size: 1.125rem;
        }
        .ticket-offcanvas .offcanvas-body {
          padding: 0;
          background-color: #f8fafc;
        }
        
        /* Custom Tabs */
        .drawer-tabs {
          background: #fff;
          padding: 0 1.5rem;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          gap: 2rem;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .drawer-tab-btn {
          background: none;
          border: none;
          padding: 1rem 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: #64748b;
          position: relative;
          cursor: pointer;
          transition: all 0.2s;
        }
        .drawer-tab-btn:hover {
          color: rgba(26, 27, 103, 0.867);
        }
        .drawer-tab-btn.active {
          color: rgba(26, 27, 103, 0.867);
        }
        .drawer-tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background-color: rgba(26, 27, 103, 0.867);
          border-radius: 2px 2px 0 0;
        }
        
        /* Info Cards */
        .info-card {
          background: #fff;
          border-radius: 12px;
          padding: 1.25rem;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          border: 1px solid #f1f5f9;
          transition: all 0.2s;
        }
        .info-card:hover {
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
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
          line-height: 1.5;
        }
        
        /* Timeline */
        .timeline-line {
            position: absolute;
            top: 0;
            bottom: 0;
            left: 1rem;
            width: 2px;
            background-color: #e2e8f0;
        }
        .timeline-item {
            position: relative;
            padding-left: 2.5rem;
            margin-bottom: 1.5rem;
        }
        .timeline-dot {
            position: absolute;
            left: calc(1rem - 5px);
            top: 1.25rem;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background-color: #fff;
            border: 2px solid rgba(26, 27, 103, 0.867);
            z-index: 1;
        }
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
      `}</style>

      <div className="d-flex flex-column gap-4 max-w-7xl mx-auto">
        {/* Header & Filters */}
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
          <div>
            <h4 className="fw-bold text-dark mb-1">Ticket Management</h4>
            <p className="text-secondary small mb-0">Monitor and resolve support requests efficiently</p>
          </div>
          
          <div className="d-flex flex-wrap align-items-center gap-2">
            <button 
                className="btn btn-primary fw-semibold d-flex align-items-center gap-2 shadow-sm"
                onClick={() => setShowCreateModal(true)}
            >
                <i className="bi bi-plus-lg"></i> <span className="d-none d-md-inline">Create Ticket</span>
            </button>

            <div className="search-input-group">
              <i className="bi bi-search search-icon"></i>
              <input 
                type="text" 
                className="form-control search-input" 
                placeholder="Search Ticket ID..." 
                value={localFilter.searchId} 
                onChange={(e) => setLocalFilter((f) => ({ ...f, searchId: e.target.value }))}
                style={{ width: '220px' }}
              />
            </div>
            
            <select className="form-select filter-select" style={{width: 'auto', minWidth: '120px'}} value={localFilter.status} onChange={(e) => setLocalFilter((f) => ({ ...f, status: e.target.value }))}>
              {['All', 'Open', 'In Progress', 'Resolved'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            
            <select className="form-select filter-select" style={{width: 'auto', minWidth: '120px'}} value={localFilter.priority} onChange={(e) => setLocalFilter((f) => ({ ...f, priority: e.target.value }))}>
              {['All', 'Critical', 'High', 'Medium', 'Low'].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            
             <select
              className="form-select filter-select"
              style={{width: 'auto', minWidth: '140px'}} 
              value={localFilter.type}
              onChange={(e) => setLocalFilter((f) => ({ ...f, type: e.target.value, category: 'All' }))}
            >
              {ticketTypeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Approach Cards */}
        <div className="row g-4">
          <div className="col-md-3">
            <div 
              className={`approach-card ${localFilter.status === 'All' && localFilter.priority === 'All' && !localFilter.slaBreached ? 'active' : ''}`}
              onClick={() => setLocalFilter({ status: 'All', type: 'All', category: 'All', priority: 'All', searchId: '', slaBreached: false })}
            >
              <div className="card-icon-wrapper bg-primary-subtle text-primary">
                <i className="bi bi-ticket-detailed"></i>
              </div>
              <div className="card-label">Total Tickets</div>
              <div className="card-value">{stats.total}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div 
              className={`approach-card ${localFilter.status === 'Open' ? 'active' : ''}`}
              onClick={() => setLocalFilter(prev => ({ ...prev, status: 'Open', slaBreached: false }))}
            >
              <div className="card-icon-wrapper bg-info-subtle text-info">
                <i className="bi bi-hourglass-split"></i>
              </div>
              <div className="card-label">Open Tickets</div>
              <div className="card-value">{stats.open}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div 
              className={`approach-card ${localFilter.priority === 'High' ? 'active' : ''}`}
              onClick={() => setLocalFilter(prev => ({ ...prev, priority: 'High', slaBreached: false }))}
            >
              <div className="card-icon-wrapper bg-warning-subtle text-warning">
                <i className="bi bi-exclamation-triangle"></i>
              </div>
              <div className="card-label">High Priority</div>
              <div className="card-value">{stats.highPriority}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div 
              className={`approach-card ${localFilter.slaBreached ? 'active' : ''}`}
              onClick={() => setLocalFilter(prev => ({ ...prev, slaBreached: true, status: 'All' }))}
            >
              <div className="card-icon-wrapper bg-danger-subtle text-danger">
                <i className="bi bi-alarm"></i>
              </div>
              <div className="card-label">SLA Breached</div>
              <div className="card-value">{stats.slaBreached}</div>
            </div>
          </div>
        </div>

        {/* Card Container */}
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
          <div className="table-responsive">
            <table className="table table-custom align-middle mb-0">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col.key} role="button" onClick={() => changeSort(col.key)} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      <div className="d-flex align-items-center gap-2">
                        {col.label}
                        {sort.key === col.key && (
                          <span className="text-primary">{sort.dir === 'asc' ? '↑' : '↓'}</span>
                        )}
                        {sort.key !== col.key && (
                          <span className="text-muted opacity-25">↕</span>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length > 0 ? (
                  pageItems.map((t) => (
                    <tr key={t.id}>
                      {columns.map((col) => (
                        <td key={col.key}>
                          {columnCell(t, col)}
                        </td>
                      ))}
                      <td className="text-end pe-4">
                        <div className="d-flex justify-content-end gap-1">
                           <button 
                            className="btn btn-link text-secondary p-0 action-btn rounded-circle" 
                            onClick={() => setSelectedTicket(t)}
                            title="View Details"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          <button 
                            className="btn btn-link text-secondary p-0 action-btn rounded-circle" 
                            onClick={() => setEditingTicket(t)}
                            title="Edit Ticket"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                   <tr>
                    <td colSpan={columns.length + 1} className="text-center py-5">
                      <div className="d-flex flex-column align-items-center justify-content-center text-muted opacity-75">
                        <i className="bi bi-inbox fs-1 mb-3"></i>
                        <h6 className="fw-semibold mb-1">No tickets found</h6>
                        <p className="small mb-0">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Footer / Pagination */}
          <div className="d-flex justify-content-between align-items-center p-3 border-top bg-light bg-opacity-25">
            <span className="text-muted small ps-2">
              Showing <span className="fw-semibold text-dark">{pageItems.length}</span> of <span className="fw-semibold text-dark">{tickets.length}</span> tickets
            </span>
            
            <nav>
              <ul className="pagination pagination-custom mb-0">
                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    <i className="bi bi-chevron-left"></i>
                  </button>
                </li>
                {Array.from({ length: totalPages }).map((_, i) => (
                   <li key={i} className={`page-item ${page === i + 1 ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setPage(i + 1)}>{i + 1}</button>
                  </li>
                ))}
                <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
      
      {/* Ticket Details Drawer (Offcanvas) */}
      <div 
        className={`offcanvas offcanvas-end ticket-offcanvas ${selectedTicket ? 'show' : ''}`} 
        tabIndex="-1" 
        style={{ visibility: selectedTicket ? 'visible' : 'hidden' }}
      >
        <div className="offcanvas-header border-bottom">
          <h5 className="offcanvas-title">Ticket Details</h5>
          <button type="button" className="btn-close" onClick={() => setSelectedTicket(null)} aria-label="Close"></button>
        </div>
        <div className="offcanvas-body">
          {selectedTicket && (
            <>
              {/* Tabs */}
              <div className="drawer-tabs">
                <button 
                    className={`drawer-tab-btn ${drawerTab === 'DETAILS' ? 'active' : ''}`}
                    onClick={() => setDrawerTab('DETAILS')}
                >
                    DETAILS
                </button>
                <button 
                    className={`drawer-tab-btn ${drawerTab === 'COMMENT' ? 'active' : ''}`}
                    onClick={() => setDrawerTab('COMMENT')}
                >
                    COMMENTS
                </button>
                <button 
                    className={`drawer-tab-btn ${drawerTab === 'CONVERSION' ? 'active' : ''}`}
                    onClick={() => setDrawerTab('CONVERSION')}
                >
                    CONVERSATION
                </button>
                <button 
                    className={`drawer-tab-btn ${drawerTab === 'AUDIT' ? 'active' : ''}`}
                    onClick={() => setDrawerTab('AUDIT')}
                >
                    AUDIT LOG
                </button>
              </div>

              <div className="p-3">
              {/* DETAILS Tab Content - Ticket Details Only */}
              {drawerTab === 'DETAILS' && (
                <div className="d-flex flex-column gap-3">
                  {/* Basic Info Card */}
                  <div className="info-card">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <h6 className="card-title fw-bold text-primary mb-0">
                            <i className="bi bi-info-circle me-2"></i>General Information
                        </h6>
                        <span className="badge bg-light text-secondary border font-monospace">{selectedTicket.id}</span>
                      </div>
                      
                      <div className="mb-4">
                        <label className="info-label">Title</label>
                        <div className="info-value fs-6 fw-semibold">{selectedTicket.title}</div>
                      </div>
                      
                      <div className="mb-0">
                        <label className="info-label">Description</label>
                        <div className="p-3 bg-light rounded-3 text-secondary small" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                            {selectedTicket.description || 'No description provided.'}
                        </div>
                      </div>
                  </div>

                  {/* Classification Card */}
                  <div className="info-card">
                      <h6 className="card-title fw-bold mb-4 text-primary">
                        <i className="bi bi-tags me-2"></i>Classification
                      </h6>
                      <div className="row g-4">
                        <div className="col-6">
                          <label className="info-label"><i className="bi bi-activity"></i> Status</label>
                          <div>
                            <span className={`badge rounded-pill ${
                                selectedTicket.status === 'Resolved' ? 'bg-success-subtle text-success-emphasis' :
                                selectedTicket.status === 'In Progress' ? 'bg-info-subtle text-info-emphasis' :
                                'bg-secondary-subtle text-secondary-emphasis'
                              } px-3 py-2`}>
                                {selectedTicket.status}
                            </span>
                          </div>
                        </div>
                        <div className="col-6">
                          <label className="info-label"><i className="bi bi-flag"></i> Priority</label>
                          <div>
                            <span className={`badge rounded-pill ${
                              selectedTicket.priority === 'High' ? 'bg-danger-subtle text-danger-emphasis' :
                              selectedTicket.priority === 'Medium' ? 'bg-warning-subtle text-warning-emphasis' :
                              'bg-secondary-subtle text-secondary-emphasis'
                            } px-3 py-2`}>
                              {selectedTicket.priority}
                            </span>
                          </div>
                        </div>
                        <div className="col-6">
                          <label className="info-label"><i className="bi bi-laptop"></i> Type</label>
                          <div className="info-value">{selectedTicket.type}</div>
                        </div>
                        <div className="col-6">
                          <label className="info-label"><i className="bi bi-grid"></i> Category</label>
                          <div className="info-value">{selectedTicket.category}</div>
                        </div>
                        <div className="col-6">
                          <label className="info-label"><i className="bi bi-building"></i> Department</label>
                          <div className="info-value">{selectedTicket.department}</div>
                        </div>
                      </div>
                  </div>

                  {/* People Card */}
                  <div className="info-card">
                      <h6 className="card-title fw-bold mb-4 text-primary">
                        <i className="bi bi-people me-2"></i>People
                      </h6>
                      <div className="row g-4">
                        <div className="col-6">
                          <label className="info-label"><i className="bi bi-person"></i> Employee</label>
                          <div className="info-value fw-semibold">{selectedTicket.employee_name || 'N/A'}</div>
                          <small className="text-muted d-block small">{selectedTicket.employee_id || ''}</small>
                        </div>
                        <div className="col-6">
                          <label className="info-label"><i className="bi bi-headset"></i> Assigned Agent</label>
                          <div className="d-flex align-items-center gap-2">
                             {selectedTicket.assigned_agent ? (
                                <>
                                    <div className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center" style={{width: 24, height: 24, fontSize: 10}}>
                                        {selectedTicket.assigned_agent.charAt(0)}
                                    </div>
                                    <span className="info-value">{selectedTicket.assigned_agent}</span>
                                  </>
                             ) : (
                                <span className="text-muted fst-italic">Unassigned</span>
                             )}
                          </div>
                        </div>
                        <div className="col-6">
                          <label className="info-label">Created By</label>
                          <div className="info-value small">{selectedTicket.created_by || 'N/A'}</div>
                        </div>
                        <div className="col-6">
                          <label className="info-label">Updated By</label>
                          <div className="info-value small">{selectedTicket.updated_by || 'N/A'}</div>
                        </div>
                      </div>
                  </div>

                  {/* SLA & Metrics Card */}
                  <div className="info-card">
                      <h6 className="card-title fw-bold mb-4 text-primary">
                        <i className="bi bi-speedometer2 me-2"></i>SLA & Metrics
                      </h6>
                      <div className="row g-4">
                        <div className="col-6">
                          <label className="info-label">SLA Hours</label>
                          <div className="info-value font-monospace">{selectedTicket.sla_hours || 'N/A'}</div>
                        </div>
                        <div className="col-6">
                          <label className="info-label">Resolution Time</label>
                          <div className="info-value font-monospace">{selectedTicket.resolutionHours || 'N/A'}</div>
                        </div>
                        <div className="col-12">
                           <label className="info-label">SLA Status</label>
                           <div>
                              {selectedTicket.slaBreached 
                                ? <span className="badge bg-danger-subtle text-danger-emphasis px-3 py-2"><i className="bi bi-exclamation-triangle me-1"></i> Breached</span> 
                                : <span className="badge bg-success-subtle text-success-emphasis px-3 py-2"><i className="bi bi-check-circle me-1"></i> Within SLA</span>
                              }
                           </div>
                        </div>
                      </div>
                  </div>

                  {/* Timestamps Card */}
                  <div className="info-card">
                     <h6 className="card-title fw-bold mb-4 text-primary">
                        <i className="bi bi-clock-history me-2"></i>Timeline
                     </h6>
                     <div className="d-flex flex-column gap-3">
                        <div className="d-flex justify-content-between align-items-center">
                           <span className="text-secondary small fw-medium">Created</span>
                           <span className="small fw-semibold bg-light px-2 py-1 rounded">{formatDate(selectedTicket.createdAt)}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                           <span className="text-secondary small fw-medium">Acknowledged</span>
                           <span className="small fw-semibold bg-light px-2 py-1 rounded">{formatDate(selectedTicket.acknowledged_at)}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                           <span className="text-secondary small fw-medium">Resolved</span>
                           <span className="small fw-semibold bg-light px-2 py-1 rounded">{formatDate(selectedTicket.resolved_at)}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                           <span className="text-secondary small fw-medium">Closed</span>
                           <span className="small fw-semibold bg-light px-2 py-1 rounded">{formatDate(selectedTicket.closed_at)}</span>
                        </div>
                     </div>
                  </div>

                  <div className="mt-3 pt-3 border-top position-relative">
                    <div className="dropdown w-100">
                      <button 
                        type="button" 
                        className="btn btn-primary w-100 dropdown-toggle d-flex justify-content-between align-items-center py-2" 
                        onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                        aria-expanded={showStatusDropdown}
                      >
                        <span className="fw-semibold">
                            {selectedTicket.status === 'Resolved' ? 'Completed' : selectedTicket.status}
                        </span>
                      </button>
                      {showStatusDropdown && (
                        <ul className="dropdown-menu w-100 show shadow border-0 mt-1 rounded-3 overflow-hidden">
                          <li><button className="dropdown-item py-2" type="button" onClick={() => handleStatusChange('In Progress')}>In Progress</button></li>
                          <li><button className="dropdown-item py-2" type="button" onClick={() => handleStatusChange('Feedback Awaiting')}>Feedback Awaiting</button></li>
                          <li><button className="dropdown-item py-2" type="button" onClick={() => handleStatusChange('Resolved')}>Completed</button></li>
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* COMMENT Tab Content */}
              {drawerTab === 'COMMENT' && (
                <div className="d-flex flex-column gap-3">
                    {selectedTicket.comments && selectedTicket.comments.length > 0 ? (
                        <div className="position-relative ps-3 pt-2">
                            {/* Timeline line */}
                            <div className="timeline-line"></div>
                            
                            {selectedTicket.comments.map((comment, index) => (
                                <div key={index} className="timeline-item">
                                    {/* Timeline dot */}
                                    <div className="timeline-dot"></div>
                                    
                                    <div className="card border-0 shadow-sm rounded-3">
                                        <div className="card-header bg-white border-0 pt-3 pb-0 d-flex justify-content-between align-items-center">
                                            <div className="d-flex align-items-center gap-2">
                                                <div className="bg-light rounded-circle d-flex align-items-center justify-content-center text-primary fw-bold" style={{width: 24, height: 24, fontSize: 10}}>
                                                    {(comment.changed_by || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <span className="fw-bold text-dark small">{comment.changed_by}</span>
                                                <span className="text-muted small" style={{ fontSize: '0.75rem' }}>• {formatDate(comment.changed_at)}</span>
                                            </div>
                                            {/* Status Badge (if available in API) */}
                                            {(comment.old_status || comment.new_status) && (
                                                <div className="d-flex align-items-center small">
                                                    {comment.old_status && <span className="badge bg-light text-secondary border fw-normal me-1">{comment.old_status}</span>}
                                                    {comment.old_status && comment.new_status && <span className="text-muted mx-1">→</span>}
                                                    {comment.new_status && <span className="badge bg-primary-subtle text-primary-emphasis fw-semibold">{comment.new_status}</span>}
                                                </div>
                                            )}
                                        </div>
                                        <div className="card-body pt-2 pb-3 ps-5">
                                            <p className="mb-0 text-secondary small" style={{ whiteSpace: 'pre-wrap' }}>{comment.comment}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-5">
                            <div className="mb-3 text-muted opacity-25">
                                <i className="bi bi-chat-square-text fs-1"></i>
                            </div>
                            <h6 className="text-muted fw-semibold">No comments yet</h6>
                            <p className="text-secondary small mb-0">Status changes and notes will appear here.</p>
                        </div>
                    )}
                </div>
              )}

              {/* CONVERSION Tab Content */}
              {drawerTab === 'CONVERSION' && (
                <div className="d-flex flex-column h-100">
                    <div className="flex-grow-1 p-2" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                        {selectedTicket.conversation && selectedTicket.conversation.length > 0 ? (
                            <div className="d-flex flex-column gap-3">
                                {selectedTicket.conversation.map((msg, index) => {
                                    const isUser = msg.role === 'user';
                                    return (
                                        <div key={index} className={`d-flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                                            {/* Avatar */}
                                            <div 
                                                className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 text-white fw-bold shadow-sm`}
                                                style={{ 
                                                    width: '32px', 
                                                    height: '32px', 
                                                    fontSize: '0.75rem',
                                                    backgroundColor: isUser ? '#4f46e5' : '#64748b' 
                                                }}
                                            >
                                                {isUser ? 'U' : 'A'}
                                            </div>
                                            
                                            {/* Message Bubble */}
                                            <div 
                                                className={`p-3 ${
                                                    isUser 
                                                        ? 'bg-primary text-white rounded-4 rounded-end-0 shadow-sm' 
                                                        : 'bg-white text-dark rounded-4 rounded-start-0 border shadow-sm'
                                                }`}
                                                style={{ maxWidth: '80%' }}
                                            >
                                                <div className={`small mb-1 fw-bold ${isUser ? 'text-white-50' : 'text-muted'}`} style={{ fontSize: '0.7rem' }}>
                                                    {isUser ? 'User' : 'Assistant'}
                                                </div>
                                                <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{msg.content}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-5">
                                <div className="mb-3 text-muted opacity-25">
                                    <i className="bi bi-chat-dots fs-1"></i>
                                </div>
                                <h6 className="text-muted fw-semibold">No conversation history</h6>
                                <p className="text-secondary small mb-0">Chat history with the assistant will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
              )}

              {/* AUDIT LOG Tab Content */}
              {drawerTab === 'AUDIT' && (
                <div className="d-flex flex-column gap-3">
                   {auditLoading ? (
                     <div className="text-center py-5">
                       <div className="spinner-border text-primary" role="status">
                         <span className="visually-hidden">Loading...</span>
                       </div>
                       <p className="mt-2 text-muted small">Loading audit logs...</p>
                     </div>
                   ) : auditLogs && auditLogs.length > 0 ? (
                        <div className="position-relative ps-3 pt-2">
                            {/* Timeline line */}
                            <div className="timeline-line"></div>
                            
                            {auditLogs.map((log, index) => (
                                <div key={index} className="timeline-item">
                                    {/* Timeline dot */}
                                    <div className="timeline-dot" style={{ backgroundColor: '#64748b' }}></div>
                                    
                                    <div className="card border-0 shadow-sm rounded-3">
                                        <div className="card-header bg-white border-0 pt-3 pb-0 d-flex justify-content-between align-items-center">
                                            <div className="d-flex align-items-center gap-2">
                                                <div className="bg-light rounded-circle d-flex align-items-center justify-content-center text-secondary fw-bold" style={{width: 24, height: 24, fontSize: 10}}>
                                                    {(log.user || 'S').charAt(0)}
                                                </div>
                                                <span className="fw-bold text-dark small">{log.user}</span>
                                                <span className="text-muted small" style={{ fontSize: '0.75rem' }}>• {formatDate(log.timestamp)}</span>
                                            </div>
                                        </div>
                                        <div className="card-body pt-2 pb-3 ps-5">
                                            <div className="fw-semibold text-dark small mb-1">{log.action}</div>
                                            <p className="mb-0 text-secondary small" style={{ whiteSpace: 'pre-wrap' }}>{log.details}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                   ) : (
                        <div className="text-center py-5">
                            <div className="mb-3 text-muted opacity-25">
                                <i className="bi bi-clipboard-data fs-1"></i>
                            </div>
                            <h6 className="text-muted fw-semibold">No audit logs found</h6>
                            <p className="text-secondary small mb-0">History of actions will appear here.</p>
                        </div>
                   )}
                </div>
              )}

              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Backdrop for Offcanvas */}
      {selectedTicket && <div className="offcanvas-backdrop fade show" onClick={() => setSelectedTicket(null)}></div>}

      {/* Edit Ticket Modal */}
      {editingTicket && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }} tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg rounded-4">
                <div className="modal-header border-bottom p-4 border-top border-4 rounded-top-4" style={{ borderColor: 'rgba(26, 27, 103, 0.867)', backgroundColor: 'rgba(26, 27, 103, 0.03)' }}>
                  <div className="d-flex align-items-center gap-3">
                    <div className="text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, backgroundColor: 'rgba(26, 27, 103, 0.867)' }}>
                        <i className="bi bi-pencil-square fs-4"></i>
                    </div>
                    <div>
                        <h5 className="modal-title fw-bold text-dark mb-1">Edit Ticket</h5>
                        <div className="text-secondary small d-flex align-items-center gap-2">
                            <span className="badge bg-light text-secondary border">#{editingTicket.id}</span>
                            <span>•</span>
                            <span>Make changes to ticket details</span>
                        </div>
                    </div>
                  </div>
                  <button type="button" className="btn-close" onClick={() => setEditingTicket(null)}></button>
                </div>
                <div className="modal-body p-4 rounded-bottom-4">
                  <form id="editTicketForm" onSubmit={async (e) => {
                      e.preventDefault();
                      const formData = new FormData(e.target);
                      const updated = {
                        ...editingTicket,
                        title: formData.get('title'),
                        description: formData.get('description'),
                        status: formData.get('status'),
                        priority: formData.get('priority'),
                        assigned_agent: formData.get('assigned_agent'),
                        type: editingTicket.type,
                        category: editingTicket.category
                      };
                      try {
                        await updateTicket(updated);
                        setEditingTicket(null);
                        setToast({ show: true, message: 'Ticket updated successfully', type: 'success' });
                        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
                      } catch (err) {
                        console.error(err);
                        setToast({ show: true, message: 'Failed to update ticket', type: 'danger' });
                        setTimeout(() => setToast({ show: false, message: '', type: 'danger' }), 3000);
                      }
                    }}>
                    
                    <div className="mb-4">
                      <label className="form-label fw-bold text-secondary small text-uppercase d-flex align-items-center gap-2">
                        <i className="bi bi-card-heading" style={{ color: 'rgba(26, 27, 103, 0.867)' }}></i> Title <span className="text-danger">*</span>
                      </label>
                      <input 
                        name="title" 
                        className="form-control form-control-lg bg-light border-0 shadow-none" 
                        defaultValue={editingTicket.title} 
                        required 
                      />
                    </div>

                    <div className="row g-4 mb-4">
                        <div className="col-md-6">
                            <label className="form-label fw-bold text-secondary small text-uppercase d-flex align-items-center gap-2">
                                <i className="bi bi-grid" style={{ color: 'rgba(26, 27, 103, 0.867)' }}></i> Type
                            </label>
                            <select 
                                className="form-select bg-light border-0 shadow-none" 
                                value={editingTicket.type || ''} 
                                onChange={(e) => {
                                    const newType = e.target.value;
                                    const newCategories = TICKET_TYPE_CATALOG.find(t => t.type === newType)?.categories || [];
                                    setEditingTicket({
                                        ...editingTicket, 
                                        type: newType, 
                                        category: newCategories[0] || ''
                                    });
                                }}
                            >
                                <option value="" disabled>Select Type</option>
                                {TICKET_TYPE_CATALOG.map(t => <option key={t.type} value={t.type}>{t.type}</option>)}
                            </select>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-bold text-secondary small text-uppercase d-flex align-items-center gap-2">
                                <i className="bi bi-tags" style={{ color: 'rgba(26, 27, 103, 0.867)' }}></i> Category
                            </label>
                            <select 
                                className="form-select bg-light border-0 shadow-none"
                                value={editingTicket.category || ''}
                                onChange={(e) => setEditingTicket({...editingTicket, category: e.target.value})}
                            >
                                <option value="" disabled>Select Category</option>
                                {TICKET_TYPE_CATALOG.find(t => t.type === (editingTicket.type || 'IT Support'))?.categories.map(c => <option key={c} value={c}>{c}</option>) || 
                                 <option disabled>Select a Type first</option>}
                            </select>
                        </div>
                    </div>
                    
                    <div className="row g-4 mb-4">
                        <div className="col-md-6">
                            <label className="form-label fw-bold text-secondary small text-uppercase d-flex align-items-center gap-2">
                                <i className="bi bi-flag" style={{ color: 'rgba(26, 27, 103, 0.867)' }}></i> Priority
                            </label>
                            <select 
                                name="priority" 
                                className="form-select bg-light border-0 shadow-none" 
                                defaultValue={editingTicket.priority}
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical</option>
                            </select>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-bold text-secondary small text-uppercase d-flex align-items-center gap-2">
                                <i className="bi bi-activity" style={{ color: 'rgba(26, 27, 103, 0.867)' }}></i> Status
                            </label>
                            <select 
                                name="status" 
                                className="form-select bg-light border-0 shadow-none" 
                                defaultValue={editingTicket.status}
                            >
                                <option value="New">New</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Feedback Awaiting">Feedback Awaiting</option>
                                <option value="Resolved">Resolved</option>
                                <option value="Closed">Closed</option>
                            </select>
                        </div>
                    </div>

                    <div className="mb-4 position-relative">
                        <label className="form-label fw-bold text-secondary small text-uppercase d-flex align-items-center gap-2">
                            <i className="bi bi-person-badge" style={{ color: 'rgba(26, 27, 103, 0.867)' }}></i> Assigned Agent
                        </label>
                        <input 
                            type="text"
                            name="assigned_agent"
                            className="form-control bg-light border-0 shadow-none" 
                            placeholder="Search by name or email..."
                            value={userSearchQuery}
                            onChange={(e) => {
                                setUserSearchQuery(e.target.value);
                                setShowUserDropdown(true);
                            }}
                            onFocus={() => setShowUserDropdown(true)}
                            onBlur={() => setTimeout(() => setShowUserDropdown(false), 200)} // Delay to allow click
                        />
                        {showUserDropdown && userSearchQuery && filteredUsers.length > 0 && (
                            <ul className="list-group position-absolute w-100 shadow-sm" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                                {filteredUsers.map((user, i) => (
                                    <li 
                                        key={i} 
                                        className="list-group-item list-group-item-action cursor-pointer"
                                        onMouseDown={(e) => {
                                            e.preventDefault(); // Prevent focus loss
                                            const email = user.user_email || user.email || '';
                                            console.log('Selected user:', user, 'Email:', email);
                                            setEditingTicket(prev => ({ ...prev, assigned_agent: email }));
                                            setUserSearchQuery(email);
                                            setShowUserDropdown(false);
                                        }}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span className="fw-medium">{user.username}</span>
                                            <small className="text-muted">{user.user_email}</small>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {!userSearchQuery && (
                           <div className="form-text">Start typing to search for an agent.</div>
                        )}
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-bold text-secondary small text-uppercase d-flex align-items-center gap-2">
                        <i className="bi bi-text-paragraph" style={{ color: 'rgba(26, 27, 103, 0.867)' }}></i> Description
                      </label>
                      <textarea 
                        name="description" 
                        className="form-control bg-light border-0 shadow-none" 
                        rows="6" 
                        defaultValue={editingTicket.description}
                      ></textarea>
                    </div>

                    <div className="d-flex justify-content-end gap-2 pt-3 border-top">
                        <button type="button" className="btn btn-light border px-4" onClick={() => setEditingTicket(null)}>Cancel</button>
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

      {confirmStatus && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1060 }} tabIndex="-1" role="dialog" aria-modal="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="px-4 pt-4 pb-3 border-bottom d-flex align-items-start justify-content-between">
                <div className="d-flex gap-3">
                  <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 40, height: 40, background: '#eef2ff' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#4f46e5" viewBox="0 0 16 16" aria-hidden="true">
                      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1m0 1a6 6 0 1 1 0 12A6 6 0 0 1 8 2" />
                      <path d="M7.5 4.75a.5.5 0 0 1 1 0v4a.5.5 0 0 1-1 0zM8 11.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5" />
                    </svg>
                  </div>
                  <div>
                    <div className="fw-semibold">Confirm status change</div>
                    <div className="text-muted small">This updates the ticket and saves your comment.</div>
                  </div>
                </div>
                <button type="button" className="btn-close mt-1" onClick={() => { setConfirmStatus(null); setConfirmComment(''); }} aria-label="Close"></button>
              </div>

              <div className="px-4 py-3">
                <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
                  <div className="text-muted small">New status</div>
                  <span className="badge rounded-pill bg-primary-subtle text-primary-emphasis fw-semibold">
                    {confirmStatus === 'Resolved' ? 'Completed' : confirmStatus}
                  </span>
                </div>

                <label className="form-label small fw-semibold mb-1">Comment</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={confirmComment}
                  onChange={(e) => setConfirmComment(e.target.value)}
                  placeholder="Add a short note (optional)"
                  style={{ resize: 'none' }}
                />
              </div>

              <div className="px-4 py-3 border-top d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-light border" onClick={() => { setConfirmStatus(null); setConfirmComment(''); }}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={confirmStatusChange}>
                  Update status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1070 }} tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg rounded-4">
                <div className="modal-header border-bottom p-4">
                  <h5 className="modal-title fw-bold text-dark">Create New Ticket</h5>
                  <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
                </div>
                <div className="modal-body p-4">
                  <form onSubmit={handleCreateTicket}>
                    <div className="mb-4">
                      <label className="form-label fw-bold text-secondary small text-uppercase">Title <span className="text-danger">*</span></label>
                      <input 
                        type="text" 
                        className="form-control form-control-lg bg-light border-0" 
                        placeholder="Brief summary of the issue"
                        required
                        value={newTicket.title}
                        onChange={(e) => setNewTicket({...newTicket, title: e.target.value})}
                      />
                    </div>
                    
                    <div className="row g-4 mb-4">
                        <div className="col-md-4">
                            <label className="form-label fw-bold text-secondary small text-uppercase">Type <span className="text-danger">*</span></label>
                            <select 
                                className="form-select bg-light border-0" 
                                value={newTicket.type}
                                onChange={handleNewTicketTypeChange}
                            >
                                {TICKET_TYPE_CATALOG.map(t => <option key={t.type} value={t.type}>{t.type}</option>)}
                            </select>
                        </div>
                        <div className="col-md-4">
                            <label className="form-label fw-bold text-secondary small text-uppercase">Category <span className="text-danger">*</span></label>
                            <select 
                                className="form-select bg-light border-0"
                                value={newTicket.category}
                                onChange={(e) => setNewTicket({...newTicket, category: e.target.value})}
                            >
                                {TICKET_TYPE_CATALOG.find(t => t.type === newTicket.type)?.categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                         <div className="col-md-4">
                            <label className="form-label fw-bold text-secondary small text-uppercase">Priority <span className="text-danger">*</span></label>
                            <select 
                                className="form-select bg-light border-0"
                                value={newTicket.priority}
                                onChange={(e) => setNewTicket({...newTicket, priority: e.target.value})}
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical</option>
                            </select>
                        </div>
                    </div>

                    <div className="mb-4 position-relative">
                        <label className="form-label fw-bold text-secondary small text-uppercase">Assigned Agent</label>
                        <input 
                            type="text"
                            name="assigned_agent"
                            className="form-control bg-light border-0 shadow-none" 
                            placeholder="Search by name or email..."
                            value={userSearchQuery}
                            onChange={(e) => {
                                setUserSearchQuery(e.target.value);
                                setShowUserDropdown(true);
                            }}
                            onFocus={() => setShowUserDropdown(true)}
                            onBlur={() => setTimeout(() => setShowUserDropdown(false), 200)}
                        />
                        {showUserDropdown && userSearchQuery && filteredUsers.length > 0 && (
                            <ul className="list-group position-absolute w-100 shadow-sm" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                                {filteredUsers.map((user, i) => (
                                    <li 
                                        key={i} 
                                        className="list-group-item list-group-item-action cursor-pointer"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            const email = user.user_email || user.email || '';
                                            console.log('Selected user:', user, 'Email:', email);
                                            setNewTicket(prev => ({ ...prev, assigned_agent: email }));
                                            setUserSearchQuery(email);
                                            setShowUserDropdown(false);
                                        }}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span className="fw-medium">{user.username}</span>
                                            <small className="text-muted">{user.user_email}</small>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {!userSearchQuery && (
                           <div className="form-text">Start typing to search for an agent.</div>
                        )}
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-bold text-secondary small text-uppercase">Description <span className="text-danger">*</span></label>
                      <textarea 
                        className="form-control bg-light border-0" 
                        rows="6" 
                        placeholder="Detailed description of the problem..."
                        required
                        value={newTicket.description}
                        onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                      ></textarea>
                    </div>

                    <div className="d-flex justify-content-end gap-2 pt-2">
                        <button type="button" className="btn btn-light border px-4" onClick={() => setShowCreateModal(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary px-4 fw-semibold">Create Ticket</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1100 }}>
          <div className={`toast show align-items-center text-white bg-${toast.type} border-0`} role="alert" aria-live="assertive" aria-atomic="true">
            <div className="d-flex">
              <div className="toast-body">
                {toast.message}
              </div>
              <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToast({ ...toast, show: false })} aria-label="Close"></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TicketList;

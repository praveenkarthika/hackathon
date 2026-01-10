import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGlobalFilters } from '../context/GlobalFilterContext.jsx';

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

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function TicketList() {
  const navigate = useNavigate();
  const { filteredTickets, resolveTicket, updateTicket, loading, error } = useGlobalFilters();
  const query = useQuery();
  const [localFilter, setLocalFilter] = useState({ status: 'All', type: 'All', category: 'All', priority: 'All', searchId: '' });
  const [sort, setSort] = useState({ key: 'createdAt', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [drawerTab, setDrawerTab] = useState('DETAILS'); // New state for drawer tabs
  const [editingTicket, setEditingTicket] = useState(null);
  const [confirmStatus, setConfirmStatus] = useState(null);
  const [confirmComment, setConfirmComment] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
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
      return <span className="ticketsIdLink">{value ?? '-'}</span>;
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
    <div className="card">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h6 className="mb-0">Tickets</h6>
          <div className="d-flex gap-2">
            <input 
              type="text" 
              className="form-control form-control-sm" 
              placeholder="Search Ticket ID..." 
              value={localFilter.searchId} 
              onChange={(e) => setLocalFilter((f) => ({ ...f, searchId: e.target.value }))}
              // style={{ maxWidth: '150px' }}
            />
            <select className="form-select form-select-sm" value={localFilter.status} onChange={(e) => setLocalFilter((f) => ({ ...f, status: e.target.value }))}>
              {['All', 'Open', 'In Progress', 'Resolved'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              className="form-select form-select-sm"
              value={localFilter.type}
              onChange={(e) => setLocalFilter((f) => ({ ...f, type: e.target.value, category: 'All' }))}
            >
              {ticketTypeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select
              className="form-select form-select-sm"
              value={localFilter.category}
              onChange={(e) => setLocalFilter((f) => ({ ...f, category: e.target.value }))}
            >
              {ticketCategoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="form-select form-select-sm" value={localFilter.priority} onChange={(e) => setLocalFilter((f) => ({ ...f, priority: e.target.value }))}>
              {['All', 'Critical', 'High', 'Medium', 'Low'].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div className="ticketsTableWrap">
          <div className="table-responsive">
            <table className="table ticketsTable align-middle">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key} role="button" onClick={() => changeSort(col.key)}>
                    <span className="ticketsThLabel">{col.label}</span>
                    {sort.key === col.key ? <span className="ticketsSortMark">{sort.dir === 'asc' ? '↑' : '↓'}</span> : null}
                  </th>
                ))}
                <th className="ticketsThAction">Action</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((t) => (
                <tr key={t.id}>
                  {columns.map((col) => (
                    <td key={col.key}>{columnCell(t, col)}</td>
                  ))}
                  <td className="ticketsTdAction">
                    <button 
                      className="btn btn-sm btn-link text-primary p-0 me-2" 
                      onClick={() => setSelectedTicket(t)}
                      title="View Details"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"/>
                        <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/>
                      </svg>
                    </button>
                    <button 
                      className="btn btn-sm btn-link text-secondary p-0" 
                      onClick={() => navigate(`/tickets/edit/${t.id}`)}
                      title="Edit Ticket"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/>
                        <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
        <div className="d-flex justify-content-between align-items-center">
          <div className="text-muted small">Showing {pageItems.length} of {tickets.length}</div>
          <nav>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
              </li>
              {Array.from({ length: totalPages }).map((_, i) => (
                <li key={i} className={`page-item ${page === i + 1 ? 'active' : ''}`}>
                  <button className="page-link" onClick={() => setPage(i + 1)}>{i + 1}</button>
                </li>
              ))}
              <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
      
      {/* Ticket Details Drawer (Offcanvas) */}
      <div 
        className={`offcanvas offcanvas-end ${selectedTicket ? 'show' : ''}`} 
        tabIndex="-1" 
        style={{ visibility: selectedTicket ? 'visible' : 'hidden', width: '400px' }}
      >
        <div className="offcanvas-header border-bottom">
          <h5 className="offcanvas-title">Ticket Details</h5>
          <button type="button" className="btn-close" onClick={() => setSelectedTicket(null)} aria-label="Close"></button>
        </div>
        <div className="offcanvas-body">
          {selectedTicket && (
            <>
              {/* Tabs */}
              <div className="d-flex gap-2 mb-3 border-bottom pb-2">
                <button 
                    className={`btn btn-sm ${drawerTab === 'DETAILS' ? 'btn-primary' : 'btn-outline-primary'} flex-grow-1`}
                    onClick={() => setDrawerTab('DETAILS')}
                >
                    DETAILS
                </button>
                <button 
                    className={`btn btn-sm ${drawerTab === 'COMMENT' ? 'btn-primary' : 'btn-outline-primary'} flex-grow-1`}
                    onClick={() => setDrawerTab('COMMENT')}
                >
                    COMMENT
                </button>
                <button 
                    className={`btn btn-sm ${drawerTab === 'CONVERSION' ? 'btn-primary' : 'btn-outline-primary'} flex-grow-1`}
                    onClick={() => setDrawerTab('CONVERSION')}
                >
                    CONVERSION
                </button>
              </div>

              {/* DETAILS Tab Content - Ticket Details Only */}
              {drawerTab === 'DETAILS' && (
                <div className="d-flex flex-column gap-3">
                  {/* Basic Info Card */}
                  <div className="card border-0 bg-light">
                    <div className="card-body p-3">
                      <h6 className="card-title fw-bold mb-3 text-primary">General Information</h6>
                      <div className="mb-3">
                        <label className="fw-bold d-block text-secondary small mb-1">Title</label>
                        <div className="fs-6 fw-semibold">{selectedTicket.title}</div>
                      </div>
                      <div className="mb-0">
                        <label className="fw-bold d-block text-secondary small mb-1">Description</label>
                        <div className="p-2 bg-white rounded border text-secondary small" style={{ whiteSpace: 'pre-wrap' }}>{selectedTicket.description || 'No description provided.'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Classification Card */}
                  <div className="card border-0 bg-light">
                    <div className="card-body p-3">
                      <h6 className="card-title fw-bold mb-3 text-primary">Classification</h6>
                      <div className="row g-3">
                        <div className="col-6">
                          <label className="fw-bold d-block text-secondary small mb-1">Ticket ID</label>
                          <div className="fs-6 font-monospace">{selectedTicket.id}</div>
                        </div>
                        <div className="col-6">
                          <label className="fw-bold d-block text-secondary small mb-1">Status</label>
                          <div>
                            <span className={`badge rounded-pill ${
                                selectedTicket.status === 'Resolved' ? 'bg-success-subtle text-success-emphasis' :
                                selectedTicket.status === 'In Progress' ? 'bg-info-subtle text-info-emphasis' :
                                'bg-secondary-subtle text-secondary-emphasis'
                              }`}>
                                {selectedTicket.status}
                            </span>
                          </div>
                        </div>
                        <div className="col-6">
                          <label className="fw-bold d-block text-secondary small mb-1">Type</label>
                          <div className="fs-6">{selectedTicket.type}</div>
                        </div>
                        <div className="col-6">
                          <label className="fw-bold d-block text-secondary small mb-1">Category</label>
                          <div className="fs-6">{selectedTicket.category}</div>
                        </div>
                        <div className="col-6">
                          <label className="fw-bold d-block text-secondary small mb-1">Priority</label>
                          <div>
                            <span className={`badge rounded-pill ${
                              selectedTicket.priority === 'High' ? 'bg-danger-subtle text-danger-emphasis' :
                              selectedTicket.priority === 'Medium' ? 'bg-warning-subtle text-warning-emphasis' :
                              'bg-secondary-subtle text-secondary-emphasis'
                            }`}>
                              {selectedTicket.priority}
                            </span>
                          </div>
                        </div>
                        <div className="col-6">
                          <label className="fw-bold d-block text-secondary small mb-1">Department</label>
                          <div className="fs-6">{selectedTicket.department}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* People Card */}
                  <div className="card border-0 bg-light">
                    <div className="card-body p-3">
                      <h6 className="card-title fw-bold mb-3 text-primary">People</h6>
                      <div className="row g-3">
                        <div className="col-6">
                          <label className="fw-bold d-block text-secondary small mb-1">Employee</label>
                          <div className="fs-6">{selectedTicket.employee_name || 'N/A'}</div>
                          <small className="text-muted d-block">{selectedTicket.employee_id || ''}</small>
                        </div>
                        <div className="col-6">
                          <label className="fw-bold d-block text-secondary small mb-1">Assigned Agent</label>
                          <div className="fs-6">{selectedTicket.assigned_agent || 'Unassigned'}</div>
                        </div>
                        <div className="col-6">
                          <label className="fw-bold d-block text-secondary small mb-1">Created By</label>
                          <div className="fs-6 small">{selectedTicket.created_by || 'N/A'}</div>
                        </div>
                        <div className="col-6">
                          <label className="fw-bold d-block text-secondary small mb-1">Updated By</label>
                          <div className="fs-6 small">{selectedTicket.updated_by || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SLA & Metrics Card */}
                  <div className="card border-0 bg-light">
                    <div className="card-body p-3">
                      <h6 className="card-title fw-bold mb-3 text-primary">SLA & Metrics</h6>
                      <div className="row g-3">
                        <div className="col-6">
                          <label className="fw-bold d-block text-secondary small mb-1">SLA Hours</label>
                          <div className="fs-6">{selectedTicket.sla_hours || 'N/A'}</div>
                        </div>
                        <div className="col-6">
                          <label className="fw-bold d-block text-secondary small mb-1">Resolution Time</label>
                          <div className="fs-6">{selectedTicket.resolutionHours || 'N/A'}</div>
                        </div>
                        <div className="col-12">
                           <label className="fw-bold d-block text-secondary small mb-1">SLA Status</label>
                           <div>
                              {selectedTicket.slaBreached 
                                ? <span className="badge bg-danger-subtle text-danger-emphasis">Breached</span> 
                                : <span className="badge bg-success-subtle text-success-emphasis">Within SLA</span>
                              }
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timestamps Card */}
                  <div className="card border-0 bg-light">
                     <div className="card-body p-3">
                        <h6 className="card-title fw-bold mb-3 text-primary">Timeline</h6>
                        <div className="d-flex flex-column gap-2">
                           <div className="d-flex justify-content-between">
                              <span className="text-secondary small">Created</span>
                              <span className="small fw-semibold">{formatDate(selectedTicket.createdAt)}</span>
                           </div>
                           <div className="d-flex justify-content-between">
                              <span className="text-secondary small">Acknowledged</span>
                              <span className="small fw-semibold">{formatDate(selectedTicket.acknowledged_at)}</span>
                           </div>
                           <div className="d-flex justify-content-between">
                              <span className="text-secondary small">Resolved</span>
                              <span className="small fw-semibold">{formatDate(selectedTicket.resolved_at)}</span>
                           </div>
                           <div className="d-flex justify-content-between">
                              <span className="text-secondary small">Closed</span>
                              <span className="small fw-semibold">{formatDate(selectedTicket.closed_at)}</span>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="mt-3 pt-3 border-top position-relative">
                    <div className="dropdown w-100">
                      <button 
                        type="button" 
                        className="btn btn-primary w-100 dropdown-toggle d-flex justify-content-between align-items-center" 
                        onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                        aria-expanded={showStatusDropdown}
                      >
                        {selectedTicket.status === 'Resolved' ? 'Completed' : selectedTicket.status}
                      </button>
                      {showStatusDropdown && (
                        <ul className="dropdown-menu w-100 show" style={{ position: 'absolute', top: '100%', marginTop: '5px' }}>
                          <li><button className="dropdown-item" type="button" onClick={() => handleStatusChange('In Progress')}>In Progress</button></li>
                          <li><button className="dropdown-item" type="button" onClick={() => handleStatusChange('Feedback Awaiting')}>Feedback Awaiting</button></li>
                          <li><button className="dropdown-item" type="button" onClick={() => handleStatusChange('Resolved')}>Completed</button></li>
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
                        <div className="position-relative ps-3">
                            {/* Timeline line */}
                            <div className="position-absolute top-0 bottom-0 start-0 border-start border-2 ms-2" style={{ borderColor: '#e9ecef' }}></div>
                            
                            {selectedTicket.comments.map((comment, index) => (
                                <div key={index} className="position-relative mb-4 ms-2">
                                    {/* Timeline dot */}
                                    <div className="position-absolute top-0 start-0 translate-middle rounded-circle bg-white border border-2 border-primary" style={{ width: '12px', height: '12px', left: '-10px', marginTop: '1.2rem' }}></div>
                                    
                                    <div className="card border-0 shadow-sm rounded-3">
                                        <div className="card-header bg-white border-0 pt-3 pb-0 d-flex justify-content-between align-items-center">
                                            <div className="d-flex align-items-center gap-2">
                                                <span className="fw-bold text-dark small">{comment.changed_by}</span>
                                                <span className="text-muted small" style={{ fontSize: '0.75rem' }}>• {formatDate(comment.changed_at)}</span>
                                            </div>
                                            {/* Status Badge */}
                                            {(comment.old_status || comment.new_status) && (
                                                <div className="d-flex align-items-center small">
                                                    {comment.old_status && <span className="badge bg-light text-secondary border fw-normal me-1">{comment.old_status}</span>}
                                                    {comment.old_status && comment.new_status && <span className="text-muted mx-1">→</span>}
                                                    {comment.new_status && <span className="badge bg-primary-subtle text-primary-emphasis fw-semibold">{comment.new_status}</span>}
                                                </div>
                                            )}
                                        </div>
                                        <div className="card-body pt-2 pb-3">
                                            <p className="mb-0 text-secondary small" style={{ whiteSpace: 'pre-wrap' }}>{comment.comment}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-5">
                            <div className="mb-3 text-muted opacity-25">
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M2.678 11.894a1 1 0 0 1 .287.801 10.97 10.97 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8.06 8.06 0 0 0 8 14c3.996 0 7-2.807 7-6 0-3.192-3.004-6-7-6S1 4.808 1 8c0 1.468.617 2.83 1.678 3.894zm-.493 3.905a21.682 21.682 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a9.68 9.68 0 0 0 .244-.697 1.502 1.502 0 0 0-.431-1.61c-1.258-1.26-1.996-2.91-1.996-4.558 0-4.102 3.864-7.393 8.981-7.393 5.118 0 8.981 3.29 8.981 7.393 0 4.103-3.863 7.393-8.981 7.393-1.615 0-3.128-.328-4.43-1.033a1.501 1.501 0 0 0-1.558.17l-.873.578z"/>
                                </svg>
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
                                                    backgroundColor: isUser ? '#0d6efd' : '#6c757d' 
                                                }}
                                            >
                                                {isUser ? 'U' : 'A'}
                                            </div>
                                            
                                            {/* Message Bubble */}
                                            <div 
                                                className={`p-3 ${
                                                    isUser 
                                                        ? 'bg-primary text-white rounded-4 rounded-end-0 shadow-sm' 
                                                        : 'bg-light text-dark rounded-4 rounded-start-0'
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
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6-.097 1.016-.417 2.13-.771 2.966-.079.186.074.394.273.362 2.256-.37 3.597-.938 4.18-1.234A9.06 9.06 0 0 0 8 15z"/>
                                    </svg>
                                </div>
                                <h6 className="text-muted fw-semibold">No conversation history</h6>
                                <p className="text-secondary small mb-0">Chat history with the assistant will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Backdrop for Offcanvas */}
      {selectedTicket && <div className="offcanvas-backdrop fade show" onClick={() => setSelectedTicket(null)}></div>}

      {/* Edit Ticket Drawer (Offcanvas) */}
      <div 
        className={`offcanvas offcanvas-end ${editingTicket ? 'show' : ''}`} 
        tabIndex="-1" 
        style={{ visibility: editingTicket ? 'visible' : 'hidden', width: '400px', zIndex: 1055 }}
      >
        <div className="offcanvas-header border-bottom">
          <h5 className="offcanvas-title">Edit Ticket</h5>
          <button type="button" className="btn-close" onClick={() => setEditingTicket(null)} aria-label="Close"></button>
        </div>
        <div className="offcanvas-body d-flex flex-column bg-light">
          {editingTicket && (
            <>
              <form id="editTicketForm" className="flex-grow-1 d-flex flex-column gap-3" onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const updated = {
                    ...editingTicket,
                    title: formData.get('title'),
                    description: formData.get('description'),
                    status: formData.get('status'),
                    priority: formData.get('priority'),
                  };
                  updateTicket(updated);
                  setEditingTicket(null);
                }}>
                  
                  {/* Ticket Information Card */}
                  <div className="card border-0 shadow-sm">
                    <div className="card-body p-3">
                        <h6 className="card-title fw-bold mb-3 text-primary">Ticket Information</h6>
                        <div className="mb-3">
                            <label className="form-label small fw-bold text-secondary">Title</label>
                            <input name="title" className="form-control" defaultValue={editingTicket.title} required />
                        </div>
                        <div className="mb-0">
                            <label className="form-label small fw-bold text-secondary">Description</label>
                            <textarea name="description" className="form-control" rows="5" defaultValue={editingTicket.description}></textarea>
                        </div>
                    </div>
                  </div>

                  {/* Priority Card */}
                  <div className="card border-0 shadow-sm">
                    <div className="card-body p-3">
                        <h6 className="card-title fw-bold mb-3 text-primary">Priority</h6>
                        <div className="row g-3">
                            <div className="col-12">
                                <label className="form-label small fw-bold text-secondary">Priority</label>
                                <select name="priority" className="form-select" defaultValue={editingTicket.priority}>
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            </div>
                        </div>
                    </div>
                  </div>
              </form>
              <div className="mt-auto pt-3 border-top d-flex gap-2 justify-content-end bg-white position-sticky bottom-0 pb-2 mx-n3 px-3 mb-n2">
                <button type="button" className="btn btn-light border" onClick={() => setEditingTicket(null)}>Cancel</button>
                <button type="submit" form="editTicketForm" className="btn btn-primary px-4">Save Changes</button>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Backdrop for Edit Offcanvas */}
      {editingTicket && <div className="offcanvas-backdrop fade show" style={{ zIndex: 1050 }} onClick={() => setEditingTicket(null)}></div>}

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
    </div>
  );
}

export default TicketList;

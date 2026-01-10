import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { assetList } from '../data/mockData';

const ASSET_TYPE_CATALOG = [
  { type: 'Laptop', categories: ['MacBook', 'ThinkPad', 'Dell Latitude', 'HP EliteBook'] },
  { type: 'Desktop', categories: ['iMac', 'Dell OptiPlex', 'HP ProDesk', 'Custom Build'] },
  { type: 'Server', categories: ['Dell PowerEdge', 'HP ProLiant', 'Cisco UCS'] },
  { type: 'Network', categories: ['Switch', 'Router', 'Firewall', 'Access Point'] },
  { type: 'Monitor', categories: ['Dell', 'Samsung', 'LG', 'HP'] },
  { type: 'Mobile', categories: ['iPhone', 'Samsung Galaxy', 'Pixel', 'iPad'] },
  { type: 'Peripheral', categories: ['Keyboard', 'Mouse', 'Headset', 'Docking Station'] },
  { type: 'Software', categories: ['License', 'Subscription'] },
  { type: 'Other', categories: ['Projector', 'Printer', 'Scanner'] },
];

function AssetList() {
  const navigate = useNavigate();
  // Main Data State
  const [allAssets, setAllAssets] = useState(assetList);
  
  // Filter & Sort State
  const [localFilter, setLocalFilter] = useState({ status: 'All', type: 'All', brand: 'All', searchId: '' });
  const [sort, setSort] = useState({ key: 'id', dir: 'asc' });
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Selection & UI State
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [editingAsset, setEditingAsset] = useState(null);
  const [drawerTab, setDrawerTab] = useState('DETAILS');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Asset Form State
  const [newAsset, setNewAsset] = useState({
    name: '',
    type: 'Laptop',
    brand: '',
    model: '',
    serial_number: '',
    status: 'In Stock',
    location: 'HQ',
    purchase_date: '',
    warranty_expiry: '',
    value: '',
    assigned_user: ''
  });

  // Derived Data (Filtering & Sorting)
  const assets = useMemo(() => {
    let t = allAssets;
    if (localFilter.searchId) {
      const q = localFilter.searchId.toLowerCase();
      t = t.filter((x) => 
        (x.id && x.id.toLowerCase().includes(q)) ||
        (x.name && x.name.toLowerCase().includes(q)) ||
        (x.serial_number && x.serial_number.toLowerCase().includes(q))
      );
    }
    if (localFilter.status !== 'All') {
      t = t.filter((x) => x.status === localFilter.status);
    }
    if (localFilter.type !== 'All') {
      t = t.filter((x) => x.type === localFilter.type);
    }
    if (localFilter.brand !== 'All') {
        t = t.filter((x) => x.brand === localFilter.brand);
    }

    const sorted = [...t].sort((a, b) => {
      const va = a[sort.key];
      const vb = b[sort.key];
      const valA = va || '';
      const valB = vb || '';
      
      if (sort.key === 'purchase_date' || sort.key === 'warranty_expiry') {
        return sort.dir === 'asc' ? new Date(valA) - new Date(valB) : new Date(valB) - new Date(valA);
      }
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sort.dir === 'asc' ? valA - valB : valB - valA;
      }
      return sort.dir === 'asc' ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });
    return sorted;
  }, [allAssets, localFilter, sort]);

  const stats = useMemo(() => {
    return {
      total: allAssets.length,
      inUse: allAssets.filter(a => a.status === 'In Use').length,
      inStock: allAssets.filter(a => a.status === 'In Stock').length,
      maintenance: allAssets.filter(a => a.status === 'Maintenance').length
    };
  }, [allAssets]);

  const totalPages = Math.max(1, Math.ceil(assets.length / pageSize));
  const pageItems = assets.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

  // Handlers
  const changeSort = (key) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
  };

  const handleCreateAsset = (e) => {
    e.preventDefault();
    // Generate a mock ID
    const newId = `AST-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    const created = {
        id: newId,
        ...newAsset,
        value: Number(newAsset.value) || 0
    };
    
    setAllAssets(prev => [created, ...prev]);
    setShowCreateModal(false);
    
    // Reset form
    setNewAsset({
        name: '',
        type: 'Laptop',
        brand: '',
        model: '',
        serial_number: '',
        status: 'In Stock',
        location: 'HQ',
        purchase_date: '',
        warranty_expiry: '',
        value: '',
        assigned_user: ''
    });
  };

  const handleDeleteAsset = () => {
    if (!editingAsset) return;
    if (window.confirm(`Are you sure you want to delete asset ${editingAsset.name} (${editingAsset.id})?`)) {
      setAllAssets(prev => prev.filter(a => a.id !== editingAsset.id));
      setEditingAsset(null);
      if (selectedAsset && selectedAsset.id === editingAsset.id) {
        setSelectedAsset(null);
      }
    }
  };

  const handleUpdateAsset = (e) => {
    e.preventDefault();
    if (!editingAsset) return;

    const formData = new FormData(e.target);
    const updated = {
              ...editingAsset,
              name: formData.get('name'),
              type: formData.get('type'),
              brand: formData.get('brand'),
              model: formData.get('model'),
              serial_number: formData.get('serial_number'),
              status: formData.get('status'),
              location: formData.get('location'),
              assigned_user: formData.get('assigned_user'),
              purchase_date: formData.get('purchase_date'),
              warranty_expiry: formData.get('warranty_expiry'),
              value: Number(formData.get('value')),
              history: [
                {
                    action: 'Asset Updated',
                    date: new Date().toLocaleDateString(),
                    description: 'Asset details updated.'
                },
                ...(editingAsset.history || [])
              ]
          };
          setAllAssets(prev => prev.map(a => a.id === updated.id ? updated : a));
    setEditingAsset(null);
    // Also update selectedAsset if it's the same one being viewed
    if (selectedAsset && selectedAsset.id === updated.id) {
        setSelectedAsset(updated);
    }
  };

  const columns = [
    { key: 'id', label: 'Asset ID' },
    { key: 'name', label: 'Asset Name' },
    { key: 'type', label: 'Type' },
    { key: 'brand', label: 'Brand' },
    { key: 'model', label: 'Model' },
    { key: 'serial_number', label: 'Serial No.' },
    { key: 'status', label: 'Status' },
    { key: 'assigned_user', label: 'Assigned To' },
  ];

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (value) => {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const columnCell = (asset, col) => {
    const value = asset?.[col.key];

    if (col.key === 'id') {
      return <span className="ticketsIdLink">{value ?? '-'}</span>;
    }

    if (col.key === 'status') {
      const cls = asset.status === 'In Use'
        ? 'bg-success-subtle text-success-emphasis'
        : asset.status === 'In Stock'
          ? 'bg-info-subtle text-info-emphasis'
          : asset.status === 'Maintenance'
            ? 'bg-warning-subtle text-warning-emphasis'
            : 'bg-secondary-subtle text-secondary-emphasis';
      return <span className={`badge rounded-pill fw-semibold ${cls}`}>{asset.status ?? '-'}</span>;
    }

    return value ?? '-';
  };

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
      `}</style>

      <div className="d-flex flex-column gap-4 max-w-7xl mx-auto">
        {/* Header & Filters */}
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
          <div>
            <h4 className="fw-bold text-dark mb-1">Asset Register</h4>
            <p className="text-secondary small mb-0">Track and manage IT assets, workflows, and lifecycle</p>
          </div>
          
          <div className="d-flex flex-wrap align-items-center gap-2">
            <button 
                className="btn btn-primary fw-semibold d-flex align-items-center gap-2 shadow-sm"
                onClick={() => setShowCreateModal(true)}
            >
                <i className="bi bi-plus-lg"></i> <span className="d-none d-md-inline">Add Asset</span>
            </button>

            <div className="search-input-group">
              <i className="bi bi-search search-icon"></i>
              <input 
                type="text" 
                className="form-control search-input" 
                placeholder="Search Asset ID, Name..." 
                value={localFilter.searchId} 
                onChange={(e) => setLocalFilter((f) => ({ ...f, searchId: e.target.value }))}
                style={{ width: '220px' }}
              />
            </div>
            
            <select className="form-select filter-select" style={{width: 'auto', minWidth: '120px'}} value={localFilter.status} onChange={(e) => setLocalFilter((f) => ({ ...f, status: e.target.value }))}>
              {['All', 'In Use', 'In Stock', 'Maintenance', 'Retired'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            
            <select
              className="form-select filter-select"
              style={{width: 'auto', minWidth: '140px'}} 
              value={localFilter.type}
              onChange={(e) => setLocalFilter((f) => ({ ...f, type: e.target.value }))}
            >
              {['All', ...ASSET_TYPE_CATALOG.map((t) => t.type)].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Approach Cards */}
        <div className="row g-4">
          <div className="col-md-3">
            <div 
              className={`approach-card ${localFilter.status === 'All' ? 'active' : ''}`}
              onClick={() => setLocalFilter({ status: 'All', type: 'All', brand: 'All', searchId: '' })}
            >
              <div className="card-icon-wrapper bg-primary-subtle text-primary">
                <i className="bi bi-pc-display"></i>
              </div>
              <div className="card-label">Total Assets</div>
              <div className="card-value">{stats.total}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div 
              className={`approach-card ${localFilter.status === 'In Use' ? 'active' : ''}`}
              onClick={() => setLocalFilter(prev => ({ ...prev, status: 'In Use' }))}
            >
              <div className="card-icon-wrapper bg-success-subtle text-success">
                <i className="bi bi-check-circle"></i>
              </div>
              <div className="card-label">In Use</div>
              <div className="card-value">{stats.inUse}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div 
              className={`approach-card ${localFilter.status === 'In Stock' ? 'active' : ''}`}
              onClick={() => setLocalFilter(prev => ({ ...prev, status: 'In Stock' }))}
            >
              <div className="card-icon-wrapper bg-info-subtle text-info">
                <i className="bi bi-box-seam"></i>
              </div>
              <div className="card-label">In Stock</div>
              <div className="card-value">{stats.inStock}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div 
              className={`approach-card ${localFilter.status === 'Maintenance' ? 'active' : ''}`}
              onClick={() => setLocalFilter(prev => ({ ...prev, status: 'Maintenance' }))}
            >
              <div className="card-icon-wrapper bg-warning-subtle text-warning">
                <i className="bi bi-tools"></i>
              </div>
              <div className="card-label">Maintenance</div>
              <div className="card-value">{stats.maintenance}</div>
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
                  pageItems.map((asset) => (
                    <tr key={asset.id}>
                      {columns.map((col) => (
                        <td key={col.key}>
                          {columnCell(asset, col)}
                        </td>
                      ))}
                      <td className="text-end pe-4">
                        <div className="d-flex justify-content-end gap-1">
                           <button 
                            className="btn btn-link text-secondary p-0 action-btn rounded-circle" 
                            onClick={() => setSelectedAsset(asset)}
                            title="View Details"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          <button 
                            className="btn btn-link text-secondary p-0 action-btn rounded-circle" 
                            onClick={() => setEditingAsset(asset)}
                            title="Edit Asset"
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
                        <i className="bi bi-box fs-1 mb-3"></i>
                        <h6 className="fw-semibold mb-1">No assets found</h6>
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
              Showing <span className="fw-semibold text-dark">{pageItems.length}</span> of <span className="fw-semibold text-dark">{assets.length}</span> assets
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
      
      {/* Asset Details Drawer (Offcanvas) */}
      <div 
        className={`offcanvas offcanvas-end ticket-offcanvas ${selectedAsset ? 'show' : ''}`} 
        tabIndex="-1" 
        style={{ visibility: selectedAsset ? 'visible' : 'hidden' }}
      >
        <div className="offcanvas-header border-bottom">
          <h5 className="offcanvas-title">Asset Details</h5>
          <button type="button" className="btn-close" onClick={() => setSelectedAsset(null)} aria-label="Close"></button>
        </div>
        <div className="offcanvas-body">
          {selectedAsset && (
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
                    className={`drawer-tab-btn ${drawerTab === 'HISTORY' ? 'active' : ''}`}
                    onClick={() => setDrawerTab('HISTORY')}
                >
                    HISTORY
                </button>
              </div>

              <div className="p-3">
              {/* DETAILS Tab Content */}
              {drawerTab === 'DETAILS' && (
                <div className="d-flex flex-column gap-3">
                  {/* Basic Info Card */}
                  <div className="info-card">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <h6 className="card-title fw-bold text-primary mb-0">
                            <i className="bi bi-info-circle me-2"></i>General Information
                        </h6>
                        <span className="badge bg-light text-secondary border font-monospace">{selectedAsset.id}</span>
                      </div>
                      
                      <div className="mb-3">
                        <label className="info-label">Asset Name</label>
                        <div className="info-value fs-6 fw-semibold">{selectedAsset.name}</div>
                      </div>

                      <div className="row g-3">
                        <div className="col-6">
                            <label className="info-label">Type</label>
                            <div className="info-value">{selectedAsset.type}</div>
                        </div>
                         <div className="col-6">
                            <label className="info-label">Brand</label>
                            <div className="info-value">{selectedAsset.brand}</div>
                        </div>
                         <div className="col-6">
                            <label className="info-label">Model</label>
                            <div className="info-value">{selectedAsset.model}</div>
                        </div>
                         <div className="col-6">
                            <label className="info-label">Serial Number</label>
                            <div className="info-value font-monospace">{selectedAsset.serial_number}</div>
                        </div>
                      </div>
                  </div>

                  {/* Status & Location Card */}
                  <div className="info-card">
                      <h6 className="card-title fw-bold mb-4 text-primary">
                        <i className="bi bi-geo-alt me-2"></i>Status & Location
                      </h6>
                      <div className="row g-4">
                        <div className="col-6">
                          <label className="info-label"><i className="bi bi-activity"></i> Status</label>
                          <div>
                            <span className={`badge rounded-pill ${
                                selectedAsset.status === 'In Use' ? 'bg-success-subtle text-success-emphasis' :
                                selectedAsset.status === 'In Stock' ? 'bg-info-subtle text-info-emphasis' :
                                selectedAsset.status === 'Maintenance' ? 'bg-warning-subtle text-warning-emphasis' :
                                'bg-secondary-subtle text-secondary-emphasis'
                              } px-3 py-2`}>
                                {selectedAsset.status}
                            </span>
                          </div>
                        </div>
                        <div className="col-6">
                          <label className="info-label"><i className="bi bi-building"></i> Location</label>
                          <div className="info-value">{selectedAsset.location}</div>
                        </div>
                        <div className="col-12">
                          <label className="info-label"><i className="bi bi-person"></i> Assigned User</label>
                          <div className="info-value fw-semibold">{selectedAsset.assigned_user || 'Unassigned'}</div>
                        </div>
                      </div>
                  </div>

                  {/* Financial & Warranty Card */}
                  <div className="info-card">
                      <h6 className="card-title fw-bold mb-4 text-primary">
                        <i className="bi bi-currency-dollar me-2"></i>Financial & Warranty
                      </h6>
                      <div className="row g-4">
                        <div className="col-6">
                          <label className="info-label">Purchase Date</label>
                          <div className="info-value">{formatDate(selectedAsset.purchase_date)}</div>
                        </div>
                        <div className="col-6">
                          <label className="info-label">Warranty Expiry</label>
                          <div className="info-value">{formatDate(selectedAsset.warranty_expiry)}</div>
                        </div>
                        <div className="col-6">
                           <label className="info-label">Value</label>
                           <div className="info-value">{formatCurrency(selectedAsset.value)}</div>
                        </div>
                      </div>
                  </div>
                </div>
              )}
              
              {/* HISTORY Tab Content (Mock) */}
              {drawerTab === 'HISTORY' && (
                  <div className="p-3">
                    <h6 className="fw-bold mb-3">Asset History</h6>
                    <div className="timeline ps-3 border-start" style={{ marginLeft: '10px' }}>
                    {selectedAsset.history && selectedAsset.history.length > 0 ? (
                        selectedAsset.history.map((item, index) => (
                            <div className="timeline-item position-relative mb-4 ps-4" key={index}>
                                <div className="timeline-dot position-absolute bg-primary rounded-circle border border-white" style={{ width: '12px', height: '12px', left: '-6px', top: '2px' }}></div>
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="fw-bold text-dark small">{item.action}</span>
                                    <span className="text-secondary small">{item.date}</span>
                                </div>
                                <p className="mb-0 text-secondary small">{item.description}</p>
                            </div>
                        ))
                    ) : (
                         <div className="text-center text-secondary small py-4">No history available for this asset.</div>
                    )}
                  </div>
              </div>
              )}
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Backdrop for Details Offcanvas */}
      {selectedAsset && <div className="offcanvas-backdrop fade show" onClick={() => setSelectedAsset(null)}></div>}

      {/* Edit Asset Drawer (Offcanvas) */}
      <div 
        className={`offcanvas offcanvas-end ${editingAsset ? 'show' : ''}`} 
        tabIndex="-1" 
        style={{ visibility: editingAsset ? 'visible' : 'hidden', width: '400px', zIndex: 1055 }}
      >
        <div className="offcanvas-header border-bottom">
          <h5 className="offcanvas-title">Edit Asset</h5>
          <button type="button" className="btn-close" onClick={() => setEditingAsset(null)} aria-label="Close"></button>
        </div>
        <div className="offcanvas-body d-flex flex-column bg-light">
          {editingAsset && (
            <>
              <form id="editAssetForm" className="flex-grow-1 d-flex flex-column gap-3" onSubmit={handleUpdateAsset}>
                  
                  {/* General Info */}
                  <div className="card border-0 shadow-sm">
                    <div className="card-body p-3">
                        <h6 className="card-title fw-bold mb-3 text-primary">General Information</h6>
                        <div className="mb-3">
                            <label className="form-label small fw-bold text-secondary">Asset Name</label>
                            <input name="name" className="form-control" defaultValue={editingAsset.name} required />
                        </div>
                        <div className="row g-3">
                            <div className="col-6">
                                <label className="form-label small fw-bold text-secondary">Type</label>
                                <select name="type" className="form-select" defaultValue={editingAsset.type}>
                                    {ASSET_TYPE_CATALOG.map(t => <option key={t.type} value={t.type}>{t.type}</option>)}
                                </select>
                            </div>
                            <div className="col-6">
                                <label className="form-label small fw-bold text-secondary">Brand</label>
                                <input name="brand" className="form-control" defaultValue={editingAsset.brand} />
                            </div>
                            <div className="col-6">
                                <label className="form-label small fw-bold text-secondary">Model</label>
                                <input name="model" className="form-control" defaultValue={editingAsset.model} />
                            </div>
                             <div className="col-6">
                                <label className="form-label small fw-bold text-secondary">Serial No.</label>
                                <input name="serial_number" className="form-control" defaultValue={editingAsset.serial_number} />
                            </div>
                        </div>
                    </div>
                  </div>

                  {/* Status & Location */}
                  <div className="card border-0 shadow-sm">
                    <div className="card-body p-3">
                        <h6 className="card-title fw-bold mb-3 text-primary">Status & Location</h6>
                        <div className="mb-3">
                            <label className="form-label small fw-bold text-secondary">Status</label>
                            <select name="status" className="form-select" defaultValue={editingAsset.status}>
                                <option value="In Use">In Use</option>
                                <option value="In Stock">In Stock</option>
                                <option value="Maintenance">Maintenance</option>
                                <option value="Retired">Retired</option>
                            </select>
                        </div>
                        <div className="mb-3">
                            <label className="form-label small fw-bold text-secondary">Location</label>
                            <input name="location" className="form-control" defaultValue={editingAsset.location} />
                        </div>
                         <div className="mb-0">
                            <label className="form-label small fw-bold text-secondary">Assigned User</label>
                            <input name="assigned_user" className="form-control" defaultValue={editingAsset.assigned_user} placeholder="e.g. John Doe" />
                        </div>
                    </div>
                  </div>

                  {/* Financial */}
                  <div className="card border-0 shadow-sm">
                    <div className="card-body p-3">
                        <h6 className="card-title fw-bold mb-3 text-primary">Financial</h6>
                        <div className="row g-3">
                            <div className="col-6">
                                <label className="form-label small fw-bold text-secondary">Purchase Date</label>
                                <input type="date" name="purchase_date" className="form-control" defaultValue={editingAsset.purchase_date} />
                            </div>
                            <div className="col-6">
                                <label className="form-label small fw-bold text-secondary">Warranty Expiry</label>
                                <input type="date" name="warranty_expiry" className="form-control" defaultValue={editingAsset.warranty_expiry} />
                            </div>
                            <div className="col-12">
                                <label className="form-label small fw-bold text-secondary">Value ($)</label>
                                <input type="number" name="value" className="form-control" defaultValue={editingAsset.value} />
                            </div>
                        </div>
                    </div>
                  </div>

              </form>
              <div className="mt-auto pt-3 border-top d-flex gap-2 justify-content-end bg-white position-sticky bottom-0 pb-2 mx-n3 px-3 mb-n2">
                <button type="button" className="btn btn-light border" onClick={() => setEditingAsset(null)}>Cancel</button>
                <button type="submit" form="editAssetForm" className="btn btn-primary px-4">Save Changes</button>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Backdrop for Edit Offcanvas */}
      {editingAsset && <div className="offcanvas-backdrop fade show" style={{ zIndex: 1050 }} onClick={() => setEditingAsset(null)}></div>}

      {/* Create Asset Modal */}
      {showCreateModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1070 }} tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg rounded-4">
                <div className="modal-header border-bottom p-4">
                  <h5 className="modal-title fw-bold text-dark">Add New Asset</h5>
                  <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
                </div>
                <div className="modal-body p-4">
                  <form onSubmit={handleCreateAsset}>
                    <div className="mb-4">
                      <label className="form-label fw-bold text-secondary small text-uppercase">Asset Name <span className="text-danger">*</span></label>
                      <input 
                        type="text" 
                        className="form-control form-control-lg bg-light border-0" 
                        placeholder="e.g. MacBook Pro 16"
                        required
                        value={newAsset.name}
                        onChange={(e) => setNewAsset({...newAsset, name: e.target.value})}
                      />
                    </div>
                    
                    <div className="row g-4 mb-4">
                        <div className="col-md-4">
                            <label className="form-label fw-bold text-secondary small text-uppercase">Type <span className="text-danger">*</span></label>
                            <select 
                                className="form-select bg-light border-0" 
                                value={newAsset.type}
                                onChange={(e) => setNewAsset({...newAsset, type: e.target.value})}
                            >
                                {ASSET_TYPE_CATALOG.map(t => <option key={t.type} value={t.type}>{t.type}</option>)}
                            </select>
                        </div>
                        <div className="col-md-4">
                            <label className="form-label fw-bold text-secondary small text-uppercase">Brand</label>
                            <input 
                                type="text"
                                className="form-control bg-light border-0"
                                value={newAsset.brand}
                                onChange={(e) => setNewAsset({...newAsset, brand: e.target.value})}
                                placeholder="e.g. Apple"
                            />
                        </div>
                         <div className="col-md-4">
                            <label className="form-label fw-bold text-secondary small text-uppercase">Model</label>
                            <input 
                                type="text"
                                className="form-control bg-light border-0"
                                value={newAsset.model}
                                onChange={(e) => setNewAsset({...newAsset, model: e.target.value})}
                                placeholder="e.g. M1 Pro"
                            />
                        </div>
                    </div>

                    <div className="row g-4 mb-4">
                        <div className="col-md-6">
                            <label className="form-label fw-bold text-secondary small text-uppercase">Serial Number</label>
                            <input 
                                type="text"
                                className="form-control bg-light border-0"
                                value={newAsset.serial_number}
                                onChange={(e) => setNewAsset({...newAsset, serial_number: e.target.value})}
                                placeholder="Enter serial number"
                            />
                        </div>
                        <div className="col-md-6">
                             <label className="form-label fw-bold text-secondary small text-uppercase">Location</label>
                            <input 
                                type="text"
                                className="form-control bg-light border-0"
                                value={newAsset.location}
                                onChange={(e) => setNewAsset({...newAsset, location: e.target.value})}
                                placeholder="e.g. HQ - Floor 2"
                            />
                        </div>
                    </div>

                    <div className="d-flex justify-content-end gap-2 pt-2">
                        <button type="button" className="btn btn-light border px-4" onClick={() => setShowCreateModal(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary px-4 fw-semibold">Add Asset</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
      )}
    </div>
  );
}

export default AssetList;

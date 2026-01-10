import { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { mockVendors, mockSubscriptions, mockAssignments } from '../data/mockContractData';

// --- Components ---

// 1. Dashboard Tab
const ContractDashboard = ({ subscriptions, vendors }) => {
  // Calculations
  const totalCost = subscriptions.reduce((sum, sub) => sum + (sub.status !== 'Expired' ? sub.total_cost : 0), 0);
  const activeCount = subscriptions.filter(s => s.status === 'Active').length;
  const expiringCount = subscriptions.filter(s => s.status === 'Expiring Soon').length; // Mock status usage
  const expiredCount = subscriptions.filter(s => s.status === 'Expired').length;

  // Chart Data: Cost by Vendor
  const costByVendorData = useMemo(() => {
    const data = {};
    subscriptions.forEach(sub => {
      const vendor = vendors.find(v => v.vendor_id === sub.vendor_id);
      const name = vendor ? vendor.vendor_name : 'Unknown';
      if (!data[name]) data[name] = 0;
      data[name] += sub.total_cost;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [subscriptions, vendors]);

  const pieOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: '0%', left: 'center' },
    series: [
      {
        name: 'Cost by Vendor',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: { label: { show: true, fontSize: '18', fontWeight: 'bold' } },
        data: costByVendorData
      }
    ]
  };

  // Chart Data: Expiry Timeline (Simple Bar)
  // Mocking months for simplicity
  const expiryOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] },
    yAxis: { type: 'value' },
    series: [
      {
        name: 'Expiring Contracts',
        type: 'bar',
        barWidth: '60%',
        data: [1, 2, 0, 1, 3, 1], // Dummy distribution
        itemStyle: { color: '#ef4444' }
      }
    ]
  };

  return (
    <div className="container-fluid p-0">
      {/* KPI Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h6 className="text-muted text-uppercase small fw-bold mb-2">Total Annual Spend</h6>
              <h3 className="fw-bold text-primary mb-0">${totalCost.toLocaleString()}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h6 className="text-muted text-uppercase small fw-bold mb-2">Active Contracts</h6>
              <h3 className="fw-bold text-success mb-0">{activeCount}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h6 className="text-muted text-uppercase small fw-bold mb-2">Expiring (90 Days)</h6>
              <h3 className="fw-bold text-warning mb-0">{expiringCount}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h6 className="text-muted text-uppercase small fw-bold mb-2">Expired</h6>
              <h3 className="fw-bold text-danger mb-0">{expiredCount}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="row g-4">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-bottom-0 pt-4 px-4">
              <h5 className="fw-bold mb-0">Spend by Vendor</h5>
            </div>
            <div className="card-body">
              <ReactECharts option={pieOption} style={{ height: '300px' }} />
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-bottom-0 pt-4 px-4">
              <h5 className="fw-bold mb-0">Upcoming Expiries</h5>
            </div>
            <div className="card-body">
              <ReactECharts option={expiryOption} style={{ height: '300px' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. Vendor List Tab
const VendorList = ({ vendors, setVendors, onEdit }) => {
  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0 fw-bold">Vendors</h5>
        <button className="btn btn-primary btn-sm" onClick={() => onEdit(null)}>
          <i className="bi bi-plus-lg me-2"></i>Add Vendor
        </button>
      </div>
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="bg-light">
            <tr>
              <th className="border-0 ps-4">Vendor Name</th>
              <th className="border-0">Type</th>
              <th className="border-0">Contact</th>
              <th className="border-0">Support</th>
              <th className="border-0 text-end pe-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map(vendor => (
              <tr key={vendor.vendor_id}>
                <td className="ps-4">
                  <div className="fw-semibold text-dark">{vendor.vendor_name}</div>
                  <div className="small text-muted">{vendor.notes}</div>
                </td>
                <td><span className="badge bg-light text-dark border">{vendor.vendor_type}</span></td>
                <td>
                  <div className="small">{vendor.contact_name}</div>
                  <div className="small text-muted">{vendor.contact_email}</div>
                </td>
                <td>
                  <a href={vendor.support_portal_url} target="_blank" rel="noreferrer" className="btn btn-link p-0 text-decoration-none small">
                    Portal <i className="bi bi-box-arrow-up-right ms-1" style={{fontSize: '0.7rem'}}></i>
                  </a>
                </td>
                <td className="text-end pe-4">
                  <button className="btn btn-sm btn-light border me-2" onClick={() => onEdit(vendor)}><i className="bi bi-pencil"></i></button>
                  <button className="btn btn-sm btn-light border text-danger" onClick={() => {
                    if(window.confirm('Delete this vendor?')) {
                        setVendors(prev => prev.filter(v => v.vendor_id !== vendor.vendor_id));
                    }
                  }}><i className="bi bi-trash"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 3. Subscription List Tab
const SubscriptionList = ({ subscriptions, vendors, setSubscriptions, onEdit }) => {
  const getVendorName = (id) => {
    const v = vendors.find(x => x.vendor_id === id);
    return v ? v.vendor_name : id;
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Active': return 'bg-success-subtle text-success';
      case 'Expiring Soon': return 'bg-warning-subtle text-warning';
      case 'Expired': return 'bg-danger-subtle text-danger';
      default: return 'bg-secondary-subtle text-secondary';
    }
  };

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0 fw-bold">Subscriptions & Contracts</h5>
        <button className="btn btn-primary btn-sm" onClick={() => onEdit(null)}>
          <i className="bi bi-plus-lg me-2"></i>New Contract
        </button>
      </div>
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="bg-light">
            <tr>
              <th className="border-0 ps-4">Contract / Service</th>
              <th className="border-0">Vendor</th>
              <th className="border-0">Term</th>
              <th className="border-0">Cost</th>
              <th className="border-0">Status</th>
              <th className="border-0 text-end pe-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map(sub => (
              <tr key={sub.subscription_id}>
                <td className="ps-4">
                  <div className="fw-semibold text-dark">{sub.contract_name}</div>
                  <div className="small text-muted">{sub.service_name} • {sub.subscription_type}</div>
                </td>
                <td>{getVendorName(sub.vendor_id)}</td>
                <td>
                  <div className="small">{sub.contract_start_date} to</div>
                  <div className="small fw-semibold">{sub.contract_end_date}</div>
                </td>
                <td>
                  <div className="fw-bold">${sub.total_cost.toLocaleString()}</div>
                  <div className="small text-muted">{sub.billing_cycle}</div>
                </td>
                <td>
                  <span className={`badge ${getStatusBadge(sub.status)} border border-0`}>{sub.status}</span>
                </td>
                <td className="text-end pe-4">
                  <button className="btn btn-sm btn-light border me-2" title="View Details" onClick={() => onEdit(sub)}><i className="bi bi-eye"></i></button>
                  <button className="btn btn-sm btn-light border me-2" onClick={() => onEdit(sub)}><i className="bi bi-pencil"></i></button>
                  <button className="btn btn-sm btn-light border text-danger" onClick={() => {
                      if(window.confirm('Delete this subscription?')) {
                          setSubscriptions(prev => prev.filter(s => s.subscription_id !== sub.subscription_id));
                      }
                  }}><i className="bi bi-trash"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Modals ---

const VendorModal = ({ vendor, isOpen, onClose, onSave }) => {
  if (!isOpen) return null;
  
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    onSave({ ...vendor, ...data });
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{vendor ? 'Edit Vendor' : 'Add Vendor'}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Vendor Name</label>
                <input name="vendor_name" defaultValue={vendor?.vendor_name} className="form-control" required />
              </div>
              <div className="mb-3">
                <label className="form-label">Type</label>
                <select name="vendor_type" defaultValue={vendor?.vendor_type || 'SaaS'} className="form-select">
                    <option>SaaS</option>
                    <option>ISP</option>
                    <option>License</option>
                    <option>Hardware</option>
                </select>
              </div>
              <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Contact Name</label>
                    <input name="contact_name" defaultValue={vendor?.contact_name} className="form-control" />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Contact Email</label>
                    <input name="contact_email" defaultValue={vendor?.contact_email} className="form-control" />
                  </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Support Portal URL</label>
                <input name="support_portal_url" defaultValue={vendor?.support_portal_url} className="form-control" />
              </div>
              <div className="mb-3">
                <label className="form-label">Notes</label>
                <textarea name="notes" defaultValue={vendor?.notes} className="form-control" rows="2"></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Vendor</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const SubscriptionModal = ({ subscription, vendors, isOpen, onClose, onSave }) => {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    // Convert numbers
    data.total_cost = parseFloat(data.total_cost) || 0;
    data.renewal_notice_days = parseInt(data.renewal_notice_days) || 30;
    onSave({ ...subscription, ...data });
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{subscription ? 'Edit Subscription' : 'New Subscription'}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                    <label className="form-label">Contract Name</label>
                    <input name="contract_name" defaultValue={subscription?.contract_name} className="form-control" required />
                </div>
                <div className="col-md-6 mb-3">
                    <label className="form-label">Vendor</label>
                    <select name="vendor_id" defaultValue={subscription?.vendor_id} className="form-select" required>
                        <option value="">Select Vendor</option>
                        {vendors.map(v => <option key={v.vendor_id} value={v.vendor_id}>{v.vendor_name}</option>)}
                    </select>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                    <label className="form-label">Service Name</label>
                    <input name="service_name" defaultValue={subscription?.service_name} className="form-control" />
                </div>
                <div className="col-md-6 mb-3">
                    <label className="form-label">Type</label>
                    <select name="subscription_type" defaultValue={subscription?.subscription_type || 'Per User'} className="form-select">
                        <option>Per User</option>
                        <option>Site License</option>
                        <option>Usage Based</option>
                        <option>Fixed Fee</option>
                    </select>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                    <label className="form-label">Start Date</label>
                    <input type="date" name="contract_start_date" defaultValue={subscription?.contract_start_date} className="form-control" required />
                </div>
                <div className="col-md-6 mb-3">
                    <label className="form-label">End Date</label>
                    <input type="date" name="contract_end_date" defaultValue={subscription?.contract_end_date} className="form-control" required />
                </div>
              </div>
              <div className="row">
                <div className="col-md-4 mb-3">
                    <label className="form-label">Total Cost</label>
                    <input type="number" name="total_cost" defaultValue={subscription?.total_cost} className="form-control" />
                </div>
                <div className="col-md-4 mb-3">
                    <label className="form-label">Billing Cycle</label>
                    <select name="billing_cycle" defaultValue={subscription?.billing_cycle || 'Annual'} className="form-select">
                        <option>Annual</option>
                        <option>Monthly</option>
                        <option>Quarterly</option>
                    </select>
                </div>
                <div className="col-md-4 mb-3">
                    <label className="form-label">Status</label>
                    <select name="status" defaultValue={subscription?.status || 'Active'} className="form-select">
                        <option>Active</option>
                        <option>Expiring Soon</option>
                        <option>Expired</option>
                    </select>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Remarks</label>
                <textarea name="remarks" defaultValue={subscription?.remarks} className="form-control" rows="2"></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Contract</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- Main Page Component ---

function ContractManager() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [vendors, setVendors] = useState(mockVendors);
  const [subscriptions, setSubscriptions] = useState(mockSubscriptions);

  // Modal State
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  
  const [showSubModal, setShowSubModal] = useState(false);
  const [editingSub, setEditingSub] = useState(null);

  // Handlers
  const handleEditVendor = (vendor) => {
    setEditingVendor(vendor);
    setShowVendorModal(true);
  };

  const handleSaveVendor = (vendorData) => {
    if (vendorData.vendor_id) {
        setVendors(prev => prev.map(v => v.vendor_id === vendorData.vendor_id ? vendorData : v));
    } else {
        const newVendor = { ...vendorData, vendor_id: `V-${Date.now()}` };
        setVendors(prev => [...prev, newVendor]);
    }
    setShowVendorModal(false);
  };

  const handleEditSub = (sub) => {
    setEditingSub(sub);
    setShowSubModal(true);
  };

  const handleSaveSub = (subData) => {
    if (subData.subscription_id) {
        setSubscriptions(prev => prev.map(s => s.subscription_id === subData.subscription_id ? subData : s));
    } else {
        const newSub = { ...subData, subscription_id: `SUB-${Date.now()}` };
        setSubscriptions(prev => [...prev, newSub]);
    }
    setShowSubModal(false);
  };

  return (
    <div className="p-4 bg-light min-vh-100">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
            <h2 className="fw-bold text-dark mb-1">Contract Management</h2>
            <p className="text-secondary mb-0">Track IT subscriptions, renewals, and vendor relationships.</p>
        </div>
        <div className="d-flex gap-2">
            <span className="text-muted small align-self-center">Last synced: Today, 09:00 AM</span>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-pills mb-4 gap-2">
        <li className="nav-item">
          <button 
            className={`nav-link px-4 fw-semibold ${activeTab === 'dashboard' ? 'active shadow-sm' : 'bg-white text-secondary border'}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <i className="bi bi-speedometer2 me-2"></i>Overview
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link px-4 fw-semibold ${activeTab === 'subscriptions' ? 'active shadow-sm' : 'bg-white text-secondary border'}`}
            onClick={() => setActiveTab('subscriptions')}
          >
            <i className="bi bi-receipt me-2"></i>Subscriptions
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link px-4 fw-semibold ${activeTab === 'vendors' ? 'active shadow-sm' : 'bg-white text-secondary border'}`}
            onClick={() => setActiveTab('vendors')}
          >
            <i className="bi bi-building me-2"></i>Vendors
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'dashboard' && <ContractDashboard subscriptions={subscriptions} vendors={vendors} />}
        {activeTab === 'subscriptions' && (
            <SubscriptionList 
                subscriptions={subscriptions} 
                vendors={vendors} 
                setSubscriptions={setSubscriptions}
                onEdit={handleEditSub}
            />
        )}
        {activeTab === 'vendors' && (
            <VendorList 
                vendors={vendors} 
                setVendors={setVendors}
                onEdit={handleEditVendor} 
            />
        )}
      </div>

      {/* Modals */}
      <VendorModal 
        isOpen={showVendorModal} 
        vendor={editingVendor} 
        onClose={() => setShowVendorModal(false)} 
        onSave={handleSaveVendor} 
      />
      
      <SubscriptionModal 
        isOpen={showSubModal} 
        subscription={editingSub} 
        vendors={vendors}
        onClose={() => setShowSubModal(false)} 
        onSave={handleSaveSub} 
      />
    </div>
  );
}

export default ContractManager;

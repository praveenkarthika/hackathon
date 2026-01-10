import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGlobalFilters } from '../context/GlobalFilterContext.jsx';
import { updateTicketApi, fetchUsers } from '../services/api.js';

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

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES = ['Open', 'In Progress', 'Feedback Awaiting', 'Resolved', 'Closed'];
const DEPARTMENTS = ['IT', 'HR', 'Finance', 'Admin', 'Sales', 'Marketing', 'Operations']; // Added common departments

const EditTicket = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { tickets, loading: contextLoading, refreshTickets } = useGlobalFilters();
  
  const [formData, setFormData] = useState({
    ticket_id: '',
    ticket_type: '',
    category: '',
    priority: '',
    status: '',
    department: '',
    assigned_agent: '',
    sla_hours: ''
  });

  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await fetchUsers();
        console.log('Fetched users:', data); // Debug log
        if (data && data.users) {
          setUsers(data.users);
        } else if (Array.isArray(data)) {
          setUsers(data);
        } else {
          console.warn('Unexpected users API response format:', data);
        }
      } catch (err) {
        console.error('Failed to load users', err);
      }
    };
    loadUsers();
  }, []);

  useEffect(() => {
    if (!contextLoading && tickets.length > 0) {
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) {
        const data = {
          ticket_id: ticket.id,
          ticket_type: ticket.type || '',
          category: ticket.category || '',
          priority: ticket.priority || '',
          status: ticket.status || '',
          department: ticket.department || '',
          assigned_agent: ticket.assigned_agent || '',
          sla_hours: ticket.sla_hours || ''
        };
        setFormData(data);
        setInitialData(data);
      } else {
        setError('Ticket not found');
      }
    } else if (!contextLoading && tickets.length === 0) {
        // If tickets are not loaded yet or empty, we might want to wait or show error
        // assuming GlobalFilterContext loads them on mount.
        // If the list is empty after loading, then ticket is not found.
         setError('Ticket not found');
    }
  }, [ticketId, tickets, contextLoading]);

  const categories = useMemo(() => {
    const typeEntry = TICKET_TYPE_CATALOG.find(x => x.type === formData.ticket_type);
    return typeEntry ? typeEntry.categories : [];
  }, [formData.ticket_type]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when field is modified
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }

    // Reset category if type changes
    if (name === 'ticket_type') {
      setFormData(prev => ({
        ...prev,
        category: ''
      }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.ticket_id) errors.ticket_id = 'Ticket ID is required';
    if (formData.sla_hours) {
        const sla = Number(formData.sla_hours);
        if (isNaN(sla) || sla <= 0 || !Number.isInteger(sla)) {
             errors.sla_hours = 'SLA Hours must be a positive integer';
        }
    }
    return errors;
  };

  const isModified = useMemo(() => {
    if (!initialData) return false;
    return Object.keys(formData).some(key => {
        // loose comparison for numbers/strings
        return String(formData[key]) !== String(initialData[key]);
    });
  }, [formData, initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage('');

    try {
      const payload = { ticket_id: formData.ticket_id };
      let hasChanges = false;
      
      Object.keys(formData).forEach(key => {
        if (key !== 'ticket_id' && String(formData[key]) !== String(initialData[key])) {
          // Convert sla_hours to number
          if (key === 'sla_hours') {
             payload[key] = Number(formData[key]);
          } else {
             payload[key] = formData[key];
          }
          hasChanges = true;
        }
      });

      if (!hasChanges) {
          setLoading(false);
          return;
      }

      await updateTicketApi(payload);
      setSuccessMessage('Ticket updated successfully');
      if (refreshTickets) refreshTickets();
      setTimeout(() => {
        navigate('/tickets');
      }, 1500);
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403')) {
          setError('Session expired. Please login again.');
      } else if (err.message.includes('404')) {
          setError('Ticket not found');
      } else {
          setError(err.message || 'Failed to update ticket');
      }
    } finally {
      setLoading(false);
    }
  };

  if (contextLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error === 'Ticket not found') {
      return (
          <div className="container mt-4">
              <div className="alert alert-danger">Ticket not found</div>
              <button className="btn btn-secondary" onClick={() => navigate('/tickets')}>Back to List</button>
          </div>
      )
  }

  return (
    <div className="container mt-4">
      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white">
          <h4 className="mb-0">Edit Ticket</h4>
        </div>
        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}
          {successMessage && <div className="alert alert-success">{successMessage}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Ticket ID</label>
                <input 
                  type="text" 
                  className="form-control" 
                  name="ticket_id" 
                  value={formData.ticket_id} 
                  readOnly 
                  disabled 
                />
              </div>
              <div className="col-md-6">
                 <label className="form-label">Assigned Agent</label>
                 <select
                    className="form-select"
                    name="assigned_agent"
                    value={formData.assigned_agent}
                    onChange={handleChange}
                 >
                    <option value="">Select Agent</option>
                    {users.map(user => (
                      <option key={user.id || user.username} value={user.username}>
                        {user.username || user.user_email || 'Unknown Agent'}
                      </option>
                    ))}
                 </select>
              </div>
            </div>

            <div className="row mb-3">
               <div className="col-md-6">
                <label className="form-label">Ticket Type</label>
                <select 
                  className="form-select" 
                  name="ticket_type" 
                  value={formData.ticket_type} 
                  onChange={handleChange}
                >
                  <option value="">Select Type</option>
                  {TICKET_TYPE_CATALOG.map(t => (
                    <option key={t.type} value={t.type}>{t.type}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Category</label>
                <select 
                  className="form-select" 
                  name="category" 
                  value={formData.category} 
                  onChange={handleChange}
                  disabled={!formData.ticket_type}
                >
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Priority</label>
                <select 
                  className="form-select" 
                  name="priority" 
                  value={formData.priority} 
                  onChange={handleChange}
                >
                  <option value="">Select Priority</option>
                  {PRIORITIES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Department</label>
                <select 
                  className="form-select" 
                  name="department" 
                  value={formData.department} 
                  onChange={handleChange}
                >
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">SLA Hours</label>
                <input 
                  type="number" 
                  className={`form-control ${validationErrors.sla_hours ? 'is-invalid' : ''}`} 
                  name="sla_hours" 
                  value={formData.sla_hours} 
                  onChange={handleChange}
                  min="1"
                />
                {validationErrors.sla_hours && <div className="invalid-feedback">{validationErrors.sla_hours}</div>}
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => navigate('/tickets')}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading || !isModified}
              >
                {loading ? (
                    <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                    </>
                ) : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditTicket;

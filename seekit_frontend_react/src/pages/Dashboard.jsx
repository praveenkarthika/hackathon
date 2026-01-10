import React, { useState, useMemo } from 'react';
import { useGlobalFilters } from '../context/GlobalFilterContext.jsx';
import DashboardWidgets from '../components/dashboard/DashboardWidgets.jsx';

function Dashboard() {
  const { tickets, loading, error } = useGlobalFilters();
  
  // Local state for dashboard-specific filters
  const [projectFilter, setProjectFilter] = useState('All');
  const [periodFilter, setPeriodFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState('All');

  // Derive unique assignees for the dropdown
  const uniqueAssignees = useMemo(() => {
    const agents = new Set(tickets.map(t => t.assigned_agent).filter(Boolean));
    return ['All', ...Array.from(agents)];
  }, [tickets]);

  // Derive unique projects (mapped to Department) for the dropdown
  const uniqueProjects = useMemo(() => {
    const depts = new Set(tickets.map(t => t.department).filter(Boolean));
    return ['All', ...Array.from(depts)];
  }, [tickets]);

  // Filter logic
  const filteredTickets = useMemo(() => {
    let filtered = tickets;

    // Project Filter (mapped to Department)
    if (projectFilter !== 'All') {
      filtered = filtered.filter(t => t.department === projectFilter);
    }

    // Assignee Filter
    if (assigneeFilter !== 'All') {
      filtered = filtered.filter(t => t.assigned_agent === assigneeFilter);
    }

    // Period Filter
    if (periodFilter !== 'All') {
      const now = new Date();
      filtered = filtered.filter(t => {
        if (!t.createdAt) return false;
        const ticketDate = new Date(t.createdAt);
        const diffTime = Math.abs(now - ticketDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (periodFilter === 'Last 7 Days') return diffDays <= 7;
        if (periodFilter === 'Last 30 Days') return diffDays <= 30;
        return true;
      });
    }
    return filtered;
  }, [tickets, projectFilter, periodFilter, assigneeFilter]);

  // Calculate Card Metrics
  const dashboardData = useMemo(() => {
    const unassigned = filteredTickets.filter(t => !t.assigned_agent).length;
    const openWithAssignee = filteredTickets.filter(t => t.status === 'Open' && t.assigned_agent).length;
    const violatedSLA = filteredTickets.filter(t => t.slaBreached).length;
    const solved = filteredTickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;

    return { unassigned, openWithAssignee, violatedSLA, solved };
  }, [filteredTickets]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger m-3" role="alert">
        Error loading dashboard: {error}
      </div>
    );
  }

  return (
    <div className="container-fluid p-4 bg-light min-vh-100">
      {/* Header Tabs */}
      <div className="mb-4">
        <div className="btn-group" role="group">
          <button type="button" className="btn btn-primary fw-bold px-4">Operations</button>
          <button type="button" className="btn btn-light text-primary fw-bold px-4 bg-white border">Statistics</button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="row g-3 align-items-center mb-4">
        <div className="col-md-3">
          <div className="d-flex align-items-center bg-white p-2 rounded shadow-sm">
            <label className="me-2 text-muted small fw-bold text-nowrap">Project</label>
            <select 
              className="form-select form-select-sm border-0" 
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
            >
              {uniqueProjects.map(p => <option key={p} value={p}>{p === 'All' ? '--- Select ---' : p}</option>)}
            </select>
          </div>
        </div>
        <div className="col-md-3">
          <div className="d-flex align-items-center bg-white p-2 rounded shadow-sm">
            <label className="me-2 text-muted small fw-bold text-nowrap">Period</label>
            <select 
              className="form-select form-select-sm border-0"
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
            >
              <option value="All">--- Select ---</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
            </select>
          </div>
        </div>
        <div className="col-md-3">
          <div className="d-flex align-items-center bg-white p-2 rounded shadow-sm">
            <label className="me-2 text-muted small fw-bold text-nowrap">Assignee</label>
            <select 
              className="form-select form-select-sm border-0"
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
            >
              {uniqueAssignees.map(a => <option key={a} value={a}>{a === 'All' ? '--- Select ---' : a}</option>)}
            </select>
          </div>
        </div>
        <div className="col-auto">
          <button className="btn btn-outline-success d-flex align-items-center bg-white">
            <span className="me-1">✓</span> APPLY
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="row g-4">
        {/* Unassigned tickets */}
        <div className="col-md-3">
          <div className="card border-0 text-white h-100 shadow-sm" style={{ backgroundColor: '#ff8a65' }}>
            <div className="card-body p-4 d-flex flex-column justify-content-between" style={{ minHeight: '160px' }}>
              <div>
                <h6 className="card-title mb-0 text-white-50">Unassigned tickets</h6>
                <div className="display-4 fw-bold mt-2">{dashboardData.unassigned}</div>
              </div>
              <div className="small text-white-50">without assignee</div>
            </div>
          </div>
        </div>

        {/* Open tickets */}
        <div className="col-md-3">
          <div className="card border-0 text-white h-100 shadow-sm" style={{ backgroundColor: '#66bb6a' }}>
            <div className="card-body p-4 d-flex flex-column justify-content-between" style={{ minHeight: '160px' }}>
              <div>
                <h6 className="card-title mb-0 text-white-50">Open tickets</h6>
                <div className="display-4 fw-bold mt-2">{dashboardData.openWithAssignee}</div>
              </div>
              <div className="small text-white-50">with assignee</div>
            </div>
          </div>
        </div>

        {/* Violated SLA */}
        <div className="col-md-3">
          <div className="card border-0 text-white h-100 shadow-sm" style={{ backgroundColor: '#ab47bc' }}>
            <div className="card-body p-4 d-flex flex-column justify-content-between" style={{ minHeight: '160px' }}>
              <div>
                <h6 className="card-title mb-0 text-white-50">Violated SLA</h6>
                <div className="display-4 fw-bold mt-2">{dashboardData.violatedSLA}</div>
              </div>
              <div className="small text-white-50">support tickets</div>
            </div>
          </div>
        </div>

        {/* Solved tickets */}
        <div className="col-md-3">
          <div className="card border-0 text-white h-100 shadow-sm" style={{ backgroundColor: '#4fc3f7' }}>
            <div className="card-body p-4 d-flex flex-column justify-content-between" style={{ minHeight: '160px' }}>
              <div>
                <h6 className="card-title mb-0 text-white-50">Solved tickets</h6>
                <div className="display-4 fw-bold mt-2">{dashboardData.solved}</div>
              </div>
              <div className="small text-white-50">closed support tickets</div>
            </div>
          </div>
        </div>
      </div>

      {/* New Widgets */}
      <DashboardWidgets data={filteredTickets} />
    </div>
  );
}

export default Dashboard;

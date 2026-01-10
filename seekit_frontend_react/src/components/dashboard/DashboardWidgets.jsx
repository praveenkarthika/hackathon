import React, { useMemo, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const PRIORITY_COLORS = { Critical: '#d32f2f', High: '#f57c00', Medium: '#fbc02d', Low: '#388e3c' };

// --- 1. Ticket Status Distribution (Pie) ---
const StatusPieChart = ({ data }) => {
  const chartData = useMemo(() => {
    const counts = {};
    data.forEach(t => {
      const s = t.status || 'Unknown';
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [data]);

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body">
        <h6 className="card-title text-muted mb-3">Ticket Status Distribution</h6>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// --- 2. Priority-wise Tickets (Donut) ---
const PriorityDonutChart = ({ data }) => {
  const chartData = useMemo(() => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    data.forEach(t => {
      if (counts[t.priority] !== undefined) counts[t.priority]++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [data]);

  const total = data.length;

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body">
        <h6 className="card-title text-muted mb-3">Priority Breakdown</h6>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={5}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="small fw-bold">
                {total} Total
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// --- 3. Tickets by Department (Vertical Bar) ---
const DepartmentBarChart = ({ data }) => {
  const chartData = useMemo(() => {
    const counts = {};
    data.forEach(t => {
      const d = t.department || 'Unknown';
      counts[d] = (counts[d] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [data]);

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body">
        <h6 className="card-title text-muted mb-3">Tickets by Department</h6>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip cursor={{ fill: '#f8f9fa' }} />
              <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// --- 4. Ticket Category Breakdown (Horizontal Bar) ---
const CategoryBarChart = ({ data }) => {
  const chartData = useMemo(() => {
    const counts = {};
    data.forEach(t => {
      const c = t.type || 'Other'; // Using 'type' as category
      counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [data]);

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body">
        <h6 className="card-title text-muted mb-3">Category Breakdown</h6>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} />
              <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
              <Tooltip cursor={{ fill: '#f8f9fa' }} />
              <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// --- 5. SLA Breach Overview (Donut) ---
const SLABreachChart = ({ data }) => {
  const chartData = useMemo(() => {
    const breached = data.filter(t => t.slaBreached).length;
    const ok = data.length - breached;
    return [
      { name: 'Breached', value: breached },
      { name: 'Within SLA', value: ok },
    ];
  }, [data]);

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body">
        <h6 className="card-title text-muted mb-3">SLA Status</h6>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                dataKey="value"
                paddingAngle={5}
              >
                <Cell fill="#ef4444" />
                <Cell fill="#22c55e" />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// --- 6. Resolution Time Trend (Line) ---
const ResolutionTrendChart = ({ data }) => {
  const chartData = useMemo(() => {
    // Group by date (created_at)
    const groups = {};
    data.forEach(t => {
      if (!t.resolutionHours || !t.createdAt) return;
      const date = t.createdAt.split('T')[0]; // Simple date format
      if (!groups[date]) groups[date] = { date, total: 0, count: 0 };
      groups[date].total += t.resolutionHours;
      groups[date].count += 1;
    });

    return Object.values(groups)
      .map(g => ({ date: g.date, avgHours: parseFloat((g.total / g.count).toFixed(1)) }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body">
        <h6 className="card-title text-muted mb-3">Avg Resolution Time (Hrs)</h6>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="avgHours" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// --- 7. Tickets by Assigned Agent (Vertical Bar) ---
const AgentBarChart = ({ data }) => {
  const chartData = useMemo(() => {
    const counts = {};
    data.forEach(t => {
      const agent = t.assigned_agent || 'Unassigned';
      counts[agent] = (counts[agent] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [data]);

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body">
        <h6 className="card-title text-muted mb-3">Tickets by Agent</h6>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={60} />
              <YAxis allowDecimals={false} />
              <Tooltip cursor={{ fill: '#f8f9fa' }} />
              <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// --- 8. Ticket Details Table (Paginated) ---
const TicketTable = ({ data }) => {
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const totalPages = Math.ceil(data.length / pageSize);
  const pageData = data.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="card border-0 shadow-sm h-100" style={{ gridColumn: '1 / -1' }}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="card-title text-muted mb-0">Ticket Details</h6>
          <span className="badge bg-light text-dark border">{data.length} Tickets</span>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light small text-uppercase">
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Dept</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Agent</th>
                <th>SLA</th>
                <th>Res. Time</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map(t => (
                <tr key={t.id}>
                  <td><small className="fw-bold text-primary">{t.id}</small></td>
                  <td><div className="text-truncate" style={{ maxWidth: 200 }}>{t.title}</div></td>
                  <td><span className="badge bg-light text-secondary border">{t.department}</span></td>
                  <td>
                    <span className={`badge ${
                      t.priority === 'Critical' ? 'bg-danger' :
                      t.priority === 'High' ? 'bg-warning text-dark' :
                      'bg-info text-dark'
                    }`}>
                      {t.priority}
                    </span>
                  </td>
                  <td>{t.status}</td>
                  <td><small>{t.assigned_agent || '-'}</small></td>
                  <td>
                    {t.slaBreached ? 
                      <span className="badge bg-danger">Breached</span> : 
                      <span className="badge bg-success">OK</span>
                    }
                  </td>
                  <td><small>{t.resolutionHours ? `${t.resolutionHours}h` : '-'}</small></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-center gap-2 mt-3">
            <button 
              className="btn btn-sm btn-outline-secondary" 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Prev
            </button>
            <span className="d-flex align-items-center small text-muted">
              Page {page} of {totalPages}
            </span>
            <button 
              className="btn btn-sm btn-outline-secondary" 
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const DashboardWidgets = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="text-center p-5 text-muted">No data available for current filters</div>;
  }

  return (
    <div className="dashboard-widgets" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '24px',
      marginTop: '24px'
    }}>
      <StatusPieChart data={data} />
      <PriorityDonutChart data={data} />
      <DepartmentBarChart data={data} />
      <CategoryBarChart data={data} />
      <SLABreachChart data={data} />
      <ResolutionTrendChart data={data} />
      <AgentBarChart data={data} />
      <TicketTable data={data} />
    </div>
  );
};

export default DashboardWidgets;

import React, { useMemo, useState } from 'react';
import { useGlobalFilters } from '../context/GlobalFilterContext.jsx';
import ReactECharts from 'echarts-for-react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import * as echarts from 'echarts';
import { mockVendors, mockSubscriptions } from '../data/mockContractData';

const DashboardV2 = () => {
  const { tickets, loading, error } = useGlobalFilters();

  // --- FILTERS STATE ---
  const [filters, setFilters] = useState({
    department: 'All',
    period: 'All',
    category: 'All',
    assignee: 'All',
    priority: 'All'
  });

  // --- FILTER OPTIONS ---
  const filterOptions = useMemo(() => {
    if (!tickets) return { departments: [], categories: [], assignees: [] };
    return {
        departments: ['All', ...new Set(tickets.map(t => t.department).filter(Boolean))],
        categories: ['All', ...new Set(tickets.map(t => t.type).filter(Boolean))], // Using Type as 'Category' to match charts
        assignees: ['All', ...new Set(tickets.map(t => t.assigned_agent).filter(Boolean))]
    };
  }, [tickets]);

  // --- FILTER LOGIC ---
  const filteredTickets = useMemo(() => {
    if (!tickets) return [];
    return tickets.filter(t => {
        // Department
        if (filters.department !== 'All' && t.department !== filters.department) return false;
        // Category (using Type)
        if (filters.category !== 'All' && t.type !== filters.category) return false;
        // Assignee
        if (filters.assignee !== 'All' && t.assigned_agent !== filters.assignee) return false;
        // Priority
        if (filters.priority !== 'All' && t.priority !== filters.priority) return false;
        
        // Period
        if (filters.period !== 'All') {
             const created = new Date(t.createdAt || t.created_at);
             const now = new Date();
             const diffTime = Math.abs(now - created);
             const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
             
             if (filters.period === 'Last 7 Days' && diffDays > 7) return false;
             if (filters.period === 'Last 2 Weeks' && diffDays > 14) return false;
             if (filters.period === 'Current Month') {
                 if (created.getMonth() !== now.getMonth() || created.getFullYear() !== now.getFullYear()) return false;
             }
        }
        return true;
    });
  }, [tickets, filters]);

  // --- 1. DATA PROCESSING & METRICS ---
  const data = useMemo(() => {
    if (!filteredTickets) return null;
    const currentTickets = filteredTickets;

    const now = new Date();
    const oneHour = 60 * 60 * 1000;
    
    // --- Computed Metrics per Ticket ---
    const processedTickets = currentTickets.map(t => {
        const created = new Date(t.createdAt || t.created_at); // Handle varying API fields if any
        // Infer SLA Due Date: If sla_hours exists, use it. Else default to 24h for High/Critical, 48h for others
        const slaHours = t.sla_hours || (['Critical', 'High'].includes(t.priority) ? 24 : 48);
        const dueTime = new Date(created.getTime() + slaHours * oneHour);
        const timeLeft = dueTime - now;
        const isRisk = !t.slaBreached && timeLeft > 0 && timeLeft < oneHour;
        
        // Estimate Resolution Date for MTTR Trend
        let resolvedDate = null;
        if (t.resolutionHours) {
            resolvedDate = new Date(created.getTime() + t.resolutionHours * oneHour);
        }

        return {
            ...t,
            createdDate: created,
            resolvedDate,
            slaHours,
            timeLeft,
            isRisk
        };
    });

    // --- Aggregations ---
    const total = processedTickets.length;
    const openTickets = processedTickets.filter(t => ['Open', 'In Progress', 'New'].includes(t.status));
    const slaBreachedCount = processedTickets.filter(t => t.slaBreached).length;
    const riskCount = processedTickets.filter(t => t.isRisk).length;
    const criticalOpen = openTickets.filter(t => ['Critical', 'High'].includes(t.priority)).length;
    
    // SLA Compliance
    const complianceRate = total > 0 ? ((total - slaBreachedCount) / total) * 100 : 100;

    // Categories
    const categories = {};
    processedTickets.forEach(t => {
        const cat = t.type || 'Other';
        if (!categories[cat]) categories[cat] = { count: 0, breached: 0 };
        categories[cat].count++;
        if (t.slaBreached) categories[cat].breached++;
    });

    // Agent Load
    const agentLoad = {};
    processedTickets.forEach(t => {
        const agent = t.assigned_agent || 'Unassigned';
        if (!agentLoad[agent]) agentLoad[agent] = { count: 0, breached: 0 };
        agentLoad[agent].count++;
        if (t.slaBreached) agentLoad[agent].breached++;
    });

    // Lifecycle Funnel
    const funnelStatus = { 'New': 0, 'Open': 0, 'In Progress': 0, 'Resolved': 0, 'Closed': 0 };
    processedTickets.forEach(t => {
        if (funnelStatus[t.status] !== undefined) funnelStatus[t.status]++;
        else funnelStatus['Open']++; // Fallback
    });

    // Timeline (Last 7 Days) - Incident Volume & MTTR Trend
    const last7Days = {};
    for(let i=6; i>=0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        last7Days[dateStr] = { date: dateStr, count: 0, critical: 0, mttrSum: 0, resolvedCount: 0 };
    }
    
    processedTickets.forEach(t => {
        // Volume by Created Date
        const createdStr = t.createdDate.toISOString().split('T')[0];
        if (last7Days[createdStr]) {
            last7Days[createdStr].count++;
            if (t.priority === 'Critical' || t.priority === 'High') last7Days[createdStr].critical++;
        }

        // MTTR by Resolved Date
        if (t.resolvedDate && t.resolutionHours) {
            const resolvedStr = t.resolvedDate.toISOString().split('T')[0];
            if (last7Days[resolvedStr]) {
                last7Days[resolvedStr].mttrSum += t.resolutionHours;
                last7Days[resolvedStr].resolvedCount++;
            }
        }
    });

    const timelineData = Object.values(last7Days).map(d => ({
        ...d,
        avgMttr: d.resolvedCount > 0 ? (d.mttrSum / d.resolvedCount).toFixed(1) : 0
    }));

    // AI Insights Generation
    const insights = [];
    if (criticalOpen > 5) insights.push({ type: 'danger', text: `${criticalOpen} Critical/High tickets are currently open. Immediate triage required.` });
    if (riskCount > 0) insights.push({ type: 'warning', text: `${riskCount} tickets are within 1 hour of SLA breach.` });
    
    const worstCat = Object.entries(categories).sort((a,b) => (b[1].breached/b[1].count) - (a[1].breached/a[1].count))[0];
    if (worstCat) insights.push({ type: 'info', text: `Category '${worstCat[0]}' has the highest SLA breach rate (${((worstCat[1].breached/worstCat[1].count)*100).toFixed(1)}%).` });

    const overloadedAgent = Object.entries(agentLoad).sort((a,b) => b[1].count - a[1].count)[0];
    if (overloadedAgent && overloadedAgent[0] !== 'Unassigned') insights.push({ type: 'primary', text: `Agent ${overloadedAgent[0]} has the highest workload (${overloadedAgent[1].count} tickets).` });

    return {
        total,
        processedTickets,
        openTickets,
        slaBreachedCount,
        riskCount,
        criticalOpen,
        complianceRate,
        categories,
        agentLoad,
        funnelStatus,
        timelineData,
        insights
    };
  }, [filteredTickets]);

  // --- CHART OPTIONS HELPERS ---

  // 4. Category Distribution (Donut)
  const getCategoryOption = () => ({
    tooltip: { trigger: 'item' },
    legend: { bottom: '0%', left: 'center' },
    series: [{
      name: 'Category',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false, position: 'center' },
      emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
      labelLine: { show: false },
      data: Object.entries(data.categories).map(([k, v]) => ({ value: v.count, name: k }))
    }]
  });

  // 6. MTTR Trend (Area Chart) - Replaced Bar with Area
  const getMTTRTrendOption = () => ({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: data.timelineData.map(d => d.date) },
    yAxis: { type: 'value', name: 'Hours' },
    series: [{
      data: data.timelineData.map(d => d.avgMttr),
      type: 'line',
      smooth: true,
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(99, 102, 241, 0.5)' },
          { offset: 1, color: 'rgba(99, 102, 241, 0)' }
        ])
      },
      itemStyle: { color: '#6366f1' },
      name: 'Avg Resolution Time'
    }]
  });

  // 7. Funnel
  const getFunnelOption = () => ({
    tooltip: { trigger: 'item', formatter: '{a} <br/>{b} : {c}' },
    series: [{
      name: 'Ticket Lifecycle',
      type: 'funnel',
      left: '10%', top: 10, bottom: 10, width: '80%',
      min: 0, max: Math.max(...Object.values(data.funnelStatus)),
      minSize: '0%', maxSize: '100%',
      sort: 'none',
      gap: 2,
      label: { show: true, position: 'inside' },
      labelLine: { length: 10, lineStyle: { width: 1, type: 'solid' } },
      itemStyle: { borderColor: '#fff', borderWidth: 1 },
      data: [
        { value: data.funnelStatus['New'] || 0, name: 'New' },
        { value: data.funnelStatus['Open'] || 0, name: 'Open' },
        { value: data.funnelStatus['In Progress'] || 0, name: 'In Progress' },
        { value: data.funnelStatus['Resolved'] || 0, name: 'Resolved' },
        { value: data.funnelStatus['Closed'] || 0, name: 'Closed' }
      ]
    }]
  });

  // 10. Agent Workload (Horizontal Bar)
  const getAgentOption = () => {
    const agents = Object.entries(data.agentLoad).sort((a, b) => b[1].count - a[1].count).slice(0, 8); // Top 8
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'value' }, // Value axis horizontal
      yAxis: { type: 'category', data: agents.map(a => a[0]) }, // Category axis vertical
      series: [
        {
          name: 'Total Tickets',
          type: 'bar',
          stack: 'total',
          label: { show: true, position: 'insideRight' },
          data: agents.map(a => a[1].count)
        },
        {
          name: 'SLA Breached',
          type: 'bar',
          stack: 'total',
          itemStyle: { color: '#ef4444' },
          data: agents.map(a => a[1].breached)
        }
      ]
    };
  };

  // 12. Incident Volume Trend
  const getTrendOption = () => ({
    tooltip: { trigger: 'axis' },
    legend: { data: ['Total Incidents', 'Critical/High'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: data.timelineData.map(d => d.date) },
    yAxis: { type: 'value' },
    series: [
      {
        name: 'Total Incidents',
        type: 'line',
        smooth: true,
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{offset: 0, color: 'rgba(59,130,246,0.3)'}, {offset: 1, color: 'rgba(59,130,246,0)'}]) },
        data: data.timelineData.map(d => d.count)
      },
      {
        name: 'Critical/High',
        type: 'line',
        smooth: true,
        itemStyle: { color: '#ef4444' },
        data: data.timelineData.map(d => d.critical)
      }
    ]
  });

  // --- CONTRACT METRICS ---
  const contractMetrics = useMemo(() => {
    const totalCost = mockSubscriptions.reduce((sum, sub) => sum + (sub.status !== 'Expired' ? sub.total_cost : 0), 0);
    const activeCount = mockSubscriptions.filter(s => s.status === 'Active').length;
    const expiringCount = mockSubscriptions.filter(s => s.status === 'Expiring Soon').length;
    const expiredCount = mockSubscriptions.filter(s => s.status === 'Expired').length;
    
    // Spend by Vendor
    const spendByVendor = {};
    mockSubscriptions.forEach(sub => {
      const vendor = mockVendors.find(v => v.vendor_id === sub.vendor_id);
      const name = vendor ? vendor.vendor_name : 'Unknown';
      if (!spendByVendor[name]) spendByVendor[name] = 0;
      spendByVendor[name] += sub.total_cost;
    });
    const vendorChartData = Object.entries(spendByVendor).map(([name, value]) => ({ name, value }));

    return { totalCost, activeCount, expiringCount, expiredCount, vendorChartData };
  }, []);

  const vendorPieOption = {
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
        data: contractMetrics.vendorChartData
      }
    ]
  };
  
  const expiryBarOption = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] }, 
      yAxis: { type: 'value' },
      series: [
        {
          name: 'Expiring Contracts',
          type: 'bar',
          barWidth: '60%',
          data: [1, 2, 0, 1, 3, 1], 
          itemStyle: { color: '#ef4444' }
        }
      ]
  };


  if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;
  if (error || !data) return <div className="alert alert-danger m-3">{error || 'No data available'}</div>;

  return (
    <div className="container-fluid p-4 bg-light min-vh-100">
      
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h4 className="fw-bold mb-1 text-dark">Operational Intelligence</h4>
          <p className="text-muted small mb-0">Real-time enterprise service metrics • {new Date().toLocaleDateString()}</p>
        </div>
        <div className="d-flex gap-2">
            <span className="badge bg-white text-dark border shadow-sm p-2 d-flex align-items-center">
                <i className="bi bi-circle-fill text-success me-2" style={{fontSize: '8px'}}></i> Live Updates
            </span>
        </div>
      </div>

      {/* MODERN FILTER BAR */}
      <div className="bg-white p-3 rounded-3 shadow-sm mb-4 d-flex flex-wrap gap-3 align-items-center border">
          <div className="d-flex align-items-center gap-2 text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2z"/>
              </svg>
              <span className="fw-bold small tracking-wide">FILTERS</span>
          </div>
          <div className="vr mx-2 opacity-25"></div>
          
          {/* Department */}
          <select 
            className="form-select form-select-sm border-0 bg-light fw-medium text-secondary" 
            style={{width: 'auto', cursor: 'pointer'}}
            value={filters.department}
            onChange={e => setFilters({...filters, department: e.target.value})}
          >
             <option value="All">All Departments</option>
             {filterOptions.departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          {/* Period */}
           <select 
            className="form-select form-select-sm border-0 bg-light fw-medium text-secondary" 
            style={{width: 'auto', cursor: 'pointer'}}
            value={filters.period}
            onChange={e => setFilters({...filters, period: e.target.value})}
          >
             <option value="All">All Time</option>
             <option value="Last 7 Days">Last 7 Days</option>
             <option value="Last 2 Weeks">Last 2 Weeks</option>
             <option value="Current Month">Current Month</option>
          </select>

          {/* Category */}
          <select 
            className="form-select form-select-sm border-0 bg-light fw-medium text-secondary" 
            style={{width: 'auto', cursor: 'pointer'}}
            value={filters.category}
            onChange={e => setFilters({...filters, category: e.target.value})}
          >
             <option value="All">All Categories</option>
             {filterOptions.categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Assignee */}
          <select 
            className="form-select form-select-sm border-0 bg-light fw-medium text-secondary" 
            style={{width: 'auto', cursor: 'pointer'}}
            value={filters.assignee}
            onChange={e => setFilters({...filters, assignee: e.target.value})}
          >
             <option value="All">All Assignees</option>
             {filterOptions.assignees.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          {/* Priority */}
          <select 
            className="form-select form-select-sm border-0 bg-light fw-medium text-secondary" 
            style={{width: 'auto', cursor: 'pointer'}}
            value={filters.priority}
            onChange={e => setFilters({...filters, priority: e.target.value})}
          >
             <option value="All">All Priorities</option>
             {['Critical', 'High', 'Medium', 'Low'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          
          {/* Reset Button */}
           <button 
             className="btn btn-sm btn-link text-muted text-decoration-none ms-auto fw-medium"
             style={{fontSize: '0.85rem'}}
             onClick={() => setFilters({department: 'All', period: 'All', category: 'All', assignee: 'All', priority: 'All'})}
           >
             Reset
           </button>
      </div>

      {/* LAYER 1: REAL-TIME METRICS GRID (8 COLUMNS) */}
      <div className="row g-2 mb-4 row-cols-2 row-cols-md-4 row-cols-lg-8">
        
        {/* 1. SLA Health */}
        <div className="col">
            <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className={`card border-0 shadow-sm h-100 ${data.complianceRate > 90 ? 'bg-success' : data.complianceRate > 75 ? 'bg-warning' : 'bg-danger'} bg-opacity-10`}>
                <div className="card-body p-2 d-flex align-items-center">
                    <div className={`rounded-circle p-2 d-flex align-items-center justify-content-center me-2 ${data.complianceRate > 90 ? 'bg-success' : data.complianceRate > 75 ? 'bg-warning' : 'bg-danger'} bg-opacity-25`} style={{width: '36px', height: '36px', minWidth: '36px'}}>
                        <i className={`bi ${data.complianceRate > 90 ? 'bi-heart-pulse' : 'bi-activity'} fs-6 fw-bold ${data.complianceRate > 90 ? 'text-success' : data.complianceRate > 75 ? 'text-warning' : 'text-danger'}`}></i>
                    </div>
                    <div className="text-start">
                        <h5 className={`fw-bold mb-0 ${data.complianceRate > 90 ? 'text-success' : data.complianceRate > 75 ? 'text-warning' : 'text-danger'}`}>
                            <CountUp end={data.complianceRate} decimals={1} duration={2} />%
                        </h5>
                        <span className={`small fw-bold opacity-75 ${data.complianceRate > 90 ? 'text-success' : data.complianceRate > 75 ? 'text-warning' : 'text-danger'}`} style={{fontSize: '0.65rem'}}>SLA Health</span>
                    </div>
                </div>
            </motion.div>
        </div>

        {/* 2. Imminent Breach */}
        <div className="col">
            <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.05}} className="card border-0 shadow-sm h-100 bg-warning bg-opacity-10">
                <div className="card-body p-2 d-flex align-items-center">
                    <div className="rounded-circle p-2 d-flex align-items-center justify-content-center me-2 bg-warning bg-opacity-25" style={{width: '36px', height: '36px', minWidth: '36px'}}>
                        <i className="bi bi-exclamation-octagon fs-6 fw-bold text-warning"></i>
                    </div>
                    <div className="text-start">
                        <h5 className="fw-bold mb-0 text-warning"><CountUp end={data.riskCount} duration={2} /></h5>
                        <span className="small fw-bold text-warning opacity-75" style={{fontSize: '0.65rem'}}>Risk &lt; 1h</span>
                    </div>
                </div>
            </motion.div>
        </div>

        {/* 3. Critical/High */}
        <div className="col">
             <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.1}} className="card border-0 shadow-sm h-100 bg-danger bg-opacity-10">
                <div className="card-body p-2 d-flex align-items-center">
                    <div className="rounded-circle p-2 d-flex align-items-center justify-content-center me-2 bg-danger bg-opacity-25" style={{width: '36px', height: '36px', minWidth: '36px'}}>
                        <i className="bi bi-shield-exclamation fs-6 fw-bold text-danger"></i>
                    </div>
                    <div className="text-start">
                        <h5 className="fw-bold mb-0 text-danger"><CountUp end={data.criticalOpen} duration={2} /></h5>
                        <span className="small fw-bold text-danger opacity-75" style={{fontSize: '0.65rem'}}>Critical/High</span>
                    </div>
                </div>
            </motion.div>
        </div>

        {/* 4. Open Backlog */}
        <div className="col">
            <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.15}} className="card border-0 shadow-sm h-100 bg-primary bg-opacity-10">
                <div className="card-body p-2 d-flex align-items-center">
                    <div className="rounded-circle p-2 d-flex align-items-center justify-content-center me-2 bg-primary bg-opacity-25" style={{width: '36px', height: '36px', minWidth: '36px'}}>
                        <i className="bi bi-inbox fs-6 fw-bold text-primary"></i>
                    </div>
                    <div className="text-start">
                        <h5 className="fw-bold mb-0 text-primary"><CountUp end={data.openTickets.length} duration={2} /></h5>
                        <span className="small fw-bold text-primary opacity-75" style={{fontSize: '0.65rem'}}>Open</span>
                    </div>
                </div>
            </motion.div>
        </div>

        {/* 5. SLA Breached (New) */}
        <div className="col">
             <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.2}} className="card border-0 shadow-sm h-100 bg-dark bg-opacity-10">
                <div className="card-body p-2 d-flex align-items-center">
                    <div className="rounded-circle p-2 d-flex align-items-center justify-content-center me-2 bg-dark bg-opacity-25" style={{width: '36px', height: '36px', minWidth: '36px'}}>
                        <i className="bi bi-x-circle fs-6 fw-bold text-dark"></i>
                    </div>
                    <div className="text-start">
                        <h5 className="fw-bold mb-0 text-dark"><CountUp end={data.slaBreachedCount} duration={2} /></h5>
                        <span className="small fw-bold text-dark opacity-75" style={{fontSize: '0.65rem'}}>Breached</span>
                    </div>
                </div>
            </motion.div>
        </div>

        {/* 6. Unassigned (New) */}
        <div className="col">
             <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.25}} className="card border-0 shadow-sm h-100 bg-secondary bg-opacity-10">
                <div className="card-body p-2 d-flex align-items-center">
                    <div className="rounded-circle p-2 d-flex align-items-center justify-content-center me-2 bg-secondary bg-opacity-25" style={{width: '36px', height: '36px', minWidth: '36px'}}>
                        <i className="bi bi-person-dash fs-6 fw-bold text-secondary"></i>
                    </div>
                    <div className="text-start">
                        <h5 className="fw-bold mb-0 text-secondary">
                            <CountUp end={data.agentLoad['Unassigned']?.count || 0} duration={2} />
                        </h5>
                        <span className="small fw-bold text-secondary opacity-75" style={{fontSize: '0.65rem'}}>Unassigned</span>
                    </div>
                </div>
            </motion.div>
        </div>

        {/* 7. Resolved (New) */}
        <div className="col">
             <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.3}} className="card border-0 shadow-sm h-100 bg-success bg-opacity-10">
                <div className="card-body p-2 d-flex align-items-center">
                    <div className="rounded-circle p-2 d-flex align-items-center justify-content-center me-2 bg-success bg-opacity-25" style={{width: '36px', height: '36px', minWidth: '36px'}}>
                        <i className="bi bi-check-circle fs-6 fw-bold text-success"></i>
                    </div>
                    <div className="text-start">
                        <h5 className="fw-bold mb-0 text-success">
                            <CountUp end={data.funnelStatus['Resolved'] || 0} duration={2} />
                        </h5>
                        <span className="small fw-bold text-success opacity-75" style={{fontSize: '0.65rem'}}>Resolved</span>
                    </div>
                </div>
            </motion.div>
        </div>

        {/* 8. Total Volume (New) */}
        <div className="col">
             <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.35}} className="card border-0 shadow-sm h-100 bg-info bg-opacity-10">
                <div className="card-body p-2 d-flex align-items-center">
                    <div className="rounded-circle p-2 d-flex align-items-center justify-content-center me-2 bg-info bg-opacity-25" style={{width: '36px', height: '36px', minWidth: '36px'}}>
                        <i className="bi bi-layers fs-6 fw-bold text-info"></i>
                    </div>
                    <div className="text-start">
                        <h5 className="fw-bold mb-0 text-info">
                            <CountUp end={data.total} duration={2} />
                        </h5>
                        <span className="small fw-bold text-info opacity-75" style={{fontSize: '0.65rem'}}>Volume</span>
                    </div>
                </div>
            </motion.div>
        </div>

      </div>

      {/* LAYER 2 & 3: COMPOSITION & PROCESS */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0 pt-3">
                    <h6 className="card-title fw-bold small text-uppercase mb-0">Ticket Distribution</h6>
                </div>
                <div className="card-body">
                    <ReactECharts option={getCategoryOption()} style={{ height: '250px' }} />
                </div>
            </div>
        </div>
        <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0 pt-3">
                    <h6 className="card-title fw-bold small text-uppercase mb-0">Lifecycle Funnel</h6>
                </div>
                <div className="card-body">
                    <ReactECharts option={getFunnelOption()} style={{ height: '250px' }} />
                </div>
            </div>
        </div>
        <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
                 <div className="card-header bg-white border-0 pt-3">
                    <h6 className="card-title fw-bold small text-uppercase mb-0">MTTR Trend (7 Days)</h6>
                </div>
                <div className="card-body">
                    <ReactECharts option={getMTTRTrendOption()} style={{ height: '250px' }} />
                </div>
            </div>
        </div>
      </div>

      {/* LAYER 4 & 5: AGENTS & TRENDS */}
      <div className="row g-3 mb-4">
         <div className="col-md-6">
            <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0 pt-3">
                    <h6 className="card-title fw-bold small text-uppercase mb-0">Agent Workload & SLA Breaches</h6>
                </div>
                <div className="card-body">
                    <ReactECharts option={getAgentOption()} style={{ height: '300px' }} />
                </div>
            </div>
        </div>
        <div className="col-md-6">
             <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0 pt-3">
                    <h6 className="card-title fw-bold small text-uppercase mb-0">7-Day Incident Volume</h6>
                </div>
                <div className="card-body">
                    <ReactECharts option={getTrendOption()} style={{ height: '300px' }} />
                </div>
            </div>
        </div>
      </div>

      {/* LAYER 6 & 7: AI INSIGHTS & ACTIONABLE CONTEXT */}
      <div className="row g-3">
        <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0 pt-3 d-flex align-items-center">
                    <i className="bi bi-stars text-primary me-2"></i>
                    <h6 className="card-title fw-bold small text-uppercase mb-0">AI-Ops Insights</h6>
                </div>
                <div className="card-body">
                    <div className="d-flex flex-column gap-3">
                        {data.insights.length > 0 ? data.insights.map((insight, idx) => (
                            <div key={idx} className={`alert alert-${insight.type} mb-0 border-0 shadow-sm d-flex`}>
                                <i className={`bi bi-${insight.type === 'danger' ? 'exclamation-circle' : 'info-circle'}-fill me-2 mt-1`}></i>
                                <span className="small">{insight.text}</span>
                            </div>
                        )) : (
                            <div className="text-center text-muted py-4">
                                <i className="bi bi-check-circle fs-1 text-success opacity-50"></i>
                                <p className="mt-2 small">All systems nominal. No critical patterns detected.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
        
        <div className="col-md-8">
            <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0 pt-3 d-flex justify-content-between align-items-center">
                     <h6 className="card-title fw-bold small text-uppercase mb-0">High Priority / At Risk Incidents</h6>
                     <span className="badge bg-light text-dark">{data.riskCount + data.criticalOpen} Items</span>
                </div>
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th className="small text-muted border-0 ps-4">ID</th>
                                <th className="small text-muted border-0">Subject</th>
                                <th className="small text-muted border-0">Priority</th>
                                <th className="small text-muted border-0">Assignee</th>
                                <th className="small text-muted border-0">Risk Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.processedTickets
                                .filter(t => t.priority === 'Critical' || t.priority === 'High' || t.isRisk)
                                .slice(0, 5)
                                .map(t => (
                                <tr key={t.id}>
                                    <td className="ps-4 fw-bold text-primary small">{t.id}</td>
                                    <td>
                                        <div className="text-truncate small fw-medium" style={{maxWidth: '200px'}}>{t.title}</div>
                                    </td>
                                    <td>
                                        <span className={`badge rounded-pill ${t.priority === 'Critical' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                                            {t.priority}
                                        </span>
                                    </td>
                                    <td className="small">{t.assigned_agent || '-'}</td>
                                    <td>
                                        {t.isRisk ? 
                                            <span className="badge bg-danger bg-opacity-10 text-danger border border-danger">SLA Risk</span> : 
                                            <span className="badge bg-success bg-opacity-10 text-success">Stable</span>
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>

      {/* LAYER 8: CONTRACTS & SUBSCRIPTIONS */}
      <div className="row g-3 mt-2">
        <div className="col-12">
           <h5 className="fw-bold text-dark mb-3">Contracts & Subscriptions</h5>
        </div>
        {/* KPI Cards */}
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h6 className="text-muted text-uppercase small fw-bold mb-2">Total Annual Spend</h6>
              <h3 className="fw-bold text-primary mb-0">
                 <CountUp end={contractMetrics.totalCost} prefix="$" separator="," duration={2} />
              </h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h6 className="text-muted text-uppercase small fw-bold mb-2">Active Contracts</h6>
              <h3 className="fw-bold text-success mb-0">{contractMetrics.activeCount}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h6 className="text-muted text-uppercase small fw-bold mb-2">Expiring (90 Days)</h6>
              <h3 className="fw-bold text-warning mb-0">{contractMetrics.expiringCount}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h6 className="text-muted text-uppercase small fw-bold mb-2">Expired</h6>
              <h3 className="fw-bold text-danger mb-0">{contractMetrics.expiredCount}</h3>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-bottom-0 pt-4 px-4">
              <h5 className="fw-bold mb-0">Spend by Vendor</h5>
            </div>
            <div className="card-body">
              <ReactECharts option={vendorPieOption} style={{ height: '300px' }} />
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-bottom-0 pt-4 px-4">
              <h5 className="fw-bold mb-0">Upcoming Expiries</h5>
            </div>
            <div className="card-body">
              <ReactECharts option={expiryBarOption} style={{ height: '300px' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardV2;

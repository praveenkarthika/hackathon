import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { fetchTickets, updateTicketApi, resolveTicketApi, createTicketApi } from '../services/api.js';

const GlobalFilterContext = createContext(null);

export const GlobalFilterProvider = ({ children }) => {
  const [tickets, setTickets] = useState([]); // Initialize with empty array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filters, setFilters] = useState({
    department: 'All',
    ticketType: 'All',
    priority: 'All',
  });

  const loadTickets = async () => {
    try {
      setLoading(true);
      const apiData = await fetchTickets();
      console.log('Fetched tickets data:', apiData); // Debug log

      let ticketsArray = [];
      if (Array.isArray(apiData)) {
        ticketsArray = apiData;
      } else if (apiData && Array.isArray(apiData.tickets)) {
        ticketsArray = apiData.tickets;
      } else {
        console.warn('Unexpected tickets API response format:', apiData);
        ticketsArray = [];
      }

      // Map API data to internal structure
      const mappedTickets = ticketsArray.map((t, index) => {
        if (index === 0) console.log('First raw ticket object:', t);
        return {
        id: t.ticket_id,
        title: t.title,
        description: t.description,
        type: t.ticket_type,
        category: t.category,
        priority: t.priority,
        status: t.status,
        department: t.department,
        employee_name: t.employee_name,
        employee_id: t.employee_id,
        assigned_agent: t.assigned_agent,
        sla_hours: t.sla_hours,
        resolutionHours: t.resolution_hours,
        slaBreached: t.sla_breached,
        createdAt: t.created_at ? new Date(t.created_at).toISOString() : null,
        acknowledged_at: t.acknowledged_at ? new Date(t.acknowledged_at).toISOString() : null,
        resolved_at: t.resolved_at ? new Date(t.resolved_at).toISOString() : null,
        closed_at: t.closed_at ? new Date(t.closed_at).toISOString() : null,
        created_by: t.created_by,
        updated_by: t.updated_by,
        // Map comments with fallbacks for different casing/naming
        comments: t.comments || t.Comments || t.ticket_comments || [],
        // Map conversation with fallbacks
        conversation: t.conversation || t.Conversation || t.conversations || t.chat_history || [],
        day: t.created_at ? new Date(t.created_at).toLocaleDateString('en-US', { weekday: 'short' }) : '', 
      };
    });
      setTickets(mappedTickets);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };
  
  const createTicket = async (newTicketData) => {
    try {
      setLoading(true);
      // Call API
      const response = await createTicketApi(newTicketData);
      
      // Refresh tickets to get the full object (including ID and timestamps)
      await loadTickets();
      
      return response;
    } catch (err) {
      console.error("Failed to create ticket:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTicket = async (updatedTicket) => {
    try {
      // Optimistic update
      setTickets((prev) => prev.map((t) => t.id === updatedTicket.id ? updatedTicket : t));
      
      const apiPayload = {
        ticket_id: updatedTicket.id,
        title: updatedTicket.title,
        description: updatedTicket.description,
        ticket_type: updatedTicket.type,
        priority: updatedTicket.priority,
        status: updatedTicket.status,
        category: updatedTicket.category,
        department: updatedTicket.department,
        assigned_agent: updatedTicket.assigned_agent,
        // Add other fields if necessary
      };

      await updateTicketApi(apiPayload);
    } catch (err) {
      console.error("Failed to update ticket:", err);
      setError("Failed to update ticket. Please try again.");
      loadTickets(); // Reload from server to sync state
    }
  };

  const resolveTicket = async (ticketId, status, comment) => {
    try {
      setTickets((prev) => prev.map((t) => t.id === ticketId ? {
        ...t,
        status,
        resolved_at: status === 'Resolved' ? new Date().toISOString() : t.resolved_at
      } : t));

      await resolveTicketApi(ticketId, status, comment);
    } catch (err) {
      console.error("Failed to resolve ticket:", err);
      setError("Failed to resolve ticket. Please try again.");
      loadTickets();
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const depOk = filters.department === 'All' || t.department === filters.department;
      const typeOk = filters.ticketType === 'All' || t.type === filters.ticketType;
      const priOk = filters.priority === 'All' || t.priority === filters.priority;
      return depOk && typeOk && priOk;
    });
  }, [filters, tickets]);

  const groupTicketsByStatusType = (tickets) => {
    const statuses = ['Open', 'In Progress', 'Resolved'];
    const types = ['Hardware', 'Software', 'Network'];
    return statuses.map((status) => {
      const row = { status };
      types.forEach((type) => {
        row[type] = tickets.filter((t) => t.status === status && t.type === type).length;
      });
      return row;
    });
  };

  const groupTicketsByType = (tickets) => {
    const types = ['Hardware', 'Software', 'Network', 'Access', 'Security'];
    return types.map((name) => ({
      name,
      value: tickets.filter((t) => t.type === name).length,
    }));
  };

  const groupTicketsTrend = (tickets) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayCounts = days.map((d) => ({
      date: d,
      tickets: tickets.filter((t) => t.day === d).length,
    }));
    return dayCounts;
  };

  const groupTicketsByDepartment = (tickets) => {
    const departments = ['IT', 'HR', 'Finance', 'Sales'];
    return departments.map((department) => ({
      department,
      tickets: tickets.filter((t) => t.department === department).length,
    }));
  };

  const kpis = useMemo(() => {
    const total = filteredTickets.length;
    const open = filteredTickets.filter((t) => t.status === 'Open').length;
    const resolved = filteredTickets.filter((t) => t.status === 'Resolved').length;
    const slaBreached = filteredTickets.filter((t) => t.slaBreached).length;
    const resolvedTickets = filteredTickets.filter((t) => t.status === 'Resolved' && typeof t.resolutionHours === 'number');
    const avgRes = resolvedTickets.length
      ? (resolvedTickets.reduce((acc, t) => acc + t.resolutionHours, 0) / resolvedTickets.length).toFixed(1) + ' hrs'
      : '0.0 hrs';
    return [
      { label: 'Total Tickets', value: total },
      { label: 'Open Tickets', value: open },
      { label: 'Resolved Tickets', value: resolved },
      { label: 'SLA Breached', value: slaBreached },
      { label: 'Avg Resolution Time', value: avgRes },
    ];
  }, [filteredTickets]);

  const value = {
    tickets, // Expose raw tickets if needed
    loading,
    error,
    refreshTickets: loadTickets,
    filters,
    updateFilter,
    filteredTickets,
    resolveTicket,
    updateTicket,
    createTicket,
    groupTicketsByStatusType,
    groupTicketsByType,
    groupTicketsTrend,
    groupTicketsByDepartment,
    kpis,
  };

  return <GlobalFilterContext.Provider value={value}>{children}</GlobalFilterContext.Provider>;
};

export const useGlobalFilters = () => useContext(GlobalFilterContext);

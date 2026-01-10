import { useGlobalFilters } from '../../context/GlobalFilterContext.jsx';
import { departments, ticketTypes, priorities } from '../../data/mockData.js';

function GlobalFilters() {
  const { filters, updateFilter } = useGlobalFilters();
  return (
    <div className="d-flex gap-2">
      <select
        className="form-select form-select-sm"
        value={filters.department}
        onChange={(e) => updateFilter('department', e.target.value)}
        aria-label="Filter by Department"
      >
        {departments.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>
      <select
        className="form-select form-select-sm"
        value={filters.ticketType}
        onChange={(e) => updateFilter('ticketType', e.target.value)}
        aria-label="Filter by Ticket Type"
      >
        {ticketTypes.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <select
        className="form-select form-select-sm"
        value={filters.priority}
        onChange={(e) => updateFilter('priority', e.target.value)}
        aria-label="Filter by Priority"
      >
        {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
    </div>
  );
}

export default GlobalFilters;


import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useGlobalFilters } from '../../context/GlobalFilterContext.jsx';
import styles from './ChartCard.module.scss';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#4f46e5', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

function TicketsByType() {
  const { filteredTickets, groupTicketsByType } = useGlobalFilters();
  const data = groupTicketsByType(filteredTickets);
  const navigate = useNavigate();

  const onSliceClick = (slice) => {
    if (slice?.name && slice.value) {
      navigate(`/tickets?type=${encodeURIComponent(slice.name)}`);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.title}>Tickets by Type</div>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            onClick={onSliceClick}
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconType="circle"
            formatter={(value) => <span style={{ color: '#6b7280', fontSize: '12px' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TicketsByType;


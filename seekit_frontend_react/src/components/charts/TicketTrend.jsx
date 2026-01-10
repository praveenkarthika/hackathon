import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useGlobalFilters } from '../../context/GlobalFilterContext.jsx';
import styles from './ChartCard.module.scss';

function TicketTrend() {
  const { filteredTickets, groupTicketsTrend } = useGlobalFilters();
  const data = groupTicketsTrend(filteredTickets);

  return (
    <div className={styles.card}>
      <div className={styles.title}>Tickets Trend</div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            tick={{ fill: '#6b7280', fontSize: 12 }} 
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis 
            tick={{ fill: '#6b7280', fontSize: 12 }} 
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
          />
          <Line 
            type="monotone" 
            dataKey="tickets" 
            stroke="#4f46e5" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TicketTrend;


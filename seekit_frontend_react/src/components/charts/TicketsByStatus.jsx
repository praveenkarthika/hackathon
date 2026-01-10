import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useGlobalFilters } from '../../context/GlobalFilterContext.jsx';
import styles from './ChartCard.module.scss';
import { useNavigate } from 'react-router-dom';

function TicketsByStatus() {
  const { filteredTickets, groupTicketsByStatusType } = useGlobalFilters();
  const data = groupTicketsByStatusType(filteredTickets);
  const navigate = useNavigate();

  const onClickBar = (dataKey, payload) => {
    const status = payload?.status;
    const type = dataKey;
    if (status && type) {
      navigate(`/tickets?status=${encodeURIComponent(status)}&type=${encodeURIComponent(type)}`);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.title}>Tickets by Status</div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }} barSize={30}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis 
            dataKey="status" 
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
            cursor={{ fill: '#f3f4f6' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
          />
          <Legend wrapperStyle={{ paddingTop: '10px' }} />
          {['Hardware', 'Software', 'Network'].map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              stackId="status"
              fill={['#4f46e5', '#3b82f6', '#93c5fd'][i]}
              onClick={(data, index) => onClickBar(key, data.payload)}
              radius={i === 2 ? [4, 4, 0, 0] : [0, 0, 0, 0]} 
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TicketsByStatus;


import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useGlobalFilters } from '../../context/GlobalFilterContext.jsx';
import styles from './ChartCard.module.scss';

function TicketsByDepartment() {
  const { filteredTickets, groupTicketsByDepartment } = useGlobalFilters();
  const data = groupTicketsByDepartment(filteredTickets);

  return (
    <div className={styles.card}>
      <div className={styles.title}>Tickets by Department</div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }} barSize={20}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
          <XAxis type="number" hide />
          <YAxis 
            type="category" 
            dataKey="department" 
            width={100}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            cursor={{ fill: '#f3f4f6' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
          />
          <Bar dataKey="tickets" fill="#3b82f6" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TicketsByDepartment;


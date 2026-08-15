import { useEffect, useState } from 'react';
import { fetchAnalytics } from '../api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const BarList = ({ title, rows, label, value }) => <section className="card"><h3>{title}</h3>{rows?.length ? <div className="card-list">{rows.map((row, i)=><div className="card card-sm" key={`${row[label]}-${i}`}><div style={{display:'flex',justifyContent:'space-between',gap:'1rem'}}><b>{row[label]}</b><strong>{row[value]}</strong></div></div>)}</div> : <p className="muted">No data available yet.</p>}</section>;

function ReportsPage() {
  const { token, user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { if (token) fetchAnalytics(token).then(r => r.status === 'success' ? setData(r.data) : setError(r.message || 'Unable to load reports.')).catch(() => setError('Unable to load reports.')); }, [token]);
  if (!['admin','coordinator'].includes(user?.role)) return <div className="card">Reports are available to sports coordinators and administrators.</div>;
  return <div className="module-page"><section className="module-heading"><div><p className="eyebrow">Reports & analytics</p><h2>Sports activity reports</h2><p>Monitor bookings, sport popularity, ground usage, equipment usage and department participation.</p></div></section>
    {error && <div className="alert">{error}</div>}
    {!data ? <div className="card">Loading analytics…</div> : <>
      <div className="grid grid-2">
        <div className="card"><h3>Booking summary</h3><p>Total bookings: <strong>{data.summary?.total_bookings || 0}</strong></p><p>Active bookings: <strong>{data.summary?.active_bookings || 0}</strong></p><p>Cancelled: <strong>{data.summary?.cancelled_bookings || 0}</strong></p></div>
        <div className="card"><h3>Top performers</h3><p>Most popular sport: <strong>{data.popularSport?.sport || '—'}</strong></p><p>Most active student: <strong>{data.activeStudent?.name || '—'}</strong></p></div>
      </div>
      <div className="grid grid-2" style={{marginTop:'1rem'}}><BarList title="Ground usage" rows={data.groundUsage} label="ground" value="bookings" /><BarList title="Equipment usage" rows={data.equipmentUsage} label="equipment" value="reserved_quantity" /><BarList title="Department participation" rows={data.departmentParticipation} label="department" value="bookings" /><BarList title="Weekly reports" rows={data.weekly} label="week" value="bookings" /></div>
      <BarList title="Monthly reports" rows={data.monthly} label="month" value="bookings" />
    </>}
  </div>;
}
export default ReportsPage;

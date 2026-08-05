import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchGrounds } from '../api.js';

function GroundsPage() {
  const [grounds, setGrounds] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGrounds = async () => {
      setLoading(true);
      const response = await fetchGrounds({ search, status: 'approved' });
      setGrounds(response.data || []);
      setLoading(false);
    };
    loadGrounds();
  }, [search]);

  return (
    <div>
      <div className="hero">
        <h2>Available grounds</h2>
        <p>Browse campus grounds and reserve a time slot on the best fields.</p>
        <input
          type="text"
          placeholder="Search by ground, sport, or city"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card-list">
        {loading ? (
          <div className="card">Loading available grounds…</div>
        ) : grounds.length === 0 ? (
          <div className="card">No grounds found.</div>
        ) : (
          grounds.map((ground) => (
            <div key={ground.id} className="card">
              <h3>{ground.name}</h3>
              <p>{ground.description}</p>
              <p><strong>Sport:</strong> {ground.sport_name}</p>
              <p><strong>City:</strong> {ground.city}</p>
              <p><strong>Venue:</strong> {ground.venue_name || 'Campus facilities'}</p>
              <Link to={`/grounds/${ground.id}`} className="button">View ground</Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default GroundsPage;
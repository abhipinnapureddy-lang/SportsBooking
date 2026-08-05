import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function VenuesPage() {
  const [venues, setVenues] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVenues = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const response = await fetch(`/api/venues?${params.toString()}`);
      const data = await response.json();
      setVenues(data.data || []);
      setLoading(false);
    };
    fetchVenues();
  }, [search]);

  return (
    <div>
      <div className="hero">
        <h2>Available venues</h2>
        <p>Browse venues and find a court near you.</p>
        <input
          type="text"
          placeholder="Search by city, sport, or name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card-list">
        {loading ? (
          <div className="card">Loading venues…</div>
        ) : venues.length === 0 ? (
          <div className="card">No venues found.</div>
        ) : (
          venues.map((venue) => (
            <div key={venue.id} className="card">
              <h3>{venue.name}</h3>
              <p>{venue.description}</p>
              <p><strong>Sport:</strong> {venue.sport_type}</p>
              <p><strong>City:</strong> {venue.city}</p>
              <Link to={`/venues/${venue.id}`} className="button">View venue</Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default VenuesPage;

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { fetchVenueDetails, createBooking } from '../api.js';

function VenueDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [venue, setVenue] = useState(null);
  const [courts, setCourts] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchVenue = async () => {
      const data = await fetchVenueDetails(id);
      setVenue(data.data?.venue || null);
      setCourts(data.data?.courts || []);
      if (data.data?.courts?.length) {
        setSelectedCourt(data.data.courts[0].id);
      }
    };
    fetchVenue();
  }, [id]);

  const handleBooking = async (event) => {
    event.preventDefault();
    setMessage('');
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const result = await createBooking(token, {
        court_id: selectedCourt,
        venue_id: Number(id),
        start_time: startTime,
        end_time: endTime
      });
      if (result.status !== 'success') {
        setMessage(result.message || 'Booking failed');
        return;
      }
      setMessage('Booking created successfully!');
    } catch (error) {
      setMessage('Unable to create booking.');
    }
  };

  if (!venue) {
    return <div className="card">Loading venue details…</div>;
  }

  return (
    <div className="grid grid-2">
      <div className="hero">
        <h2>{venue.name}</h2>
        <p>{venue.description}</p>
        <p><strong>Sport:</strong> {venue.sport_type}</p>
        <p><strong>Location:</strong> {venue.address}, {venue.city}</p>
        <p><strong>Status:</strong> {venue.status}</p>
      </div>
      <div>
        <div className="card">
          <h3>Reserve a court</h3>
          {message && <div className="alert">{message}</div>}
          {courts.length === 0 ? (
            <p>No courts available yet.</p>
          ) : (
            <form onSubmit={handleBooking}>
              <label>Court</label>
              <select value={selectedCourt || ''} onChange={(e) => setSelectedCourt(Number(e.target.value))}>
                {courts.map((court) => (
                  <option key={court.id} value={court.id}>{court.name} — {court.court_type}</option>
                ))}
              </select>
              <label>Start time</label>
              <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              <label>End time</label>
              <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              <button type="submit" className="button">Confirm booking</button>
            </form>
          )}
        </div>
        <div className="card" style={{ marginTop: '1rem' }}>
          <h3>Court list</h3>
          {courts.map((court) => (
            <div key={court.id} className="card" style={{ marginBottom: '1rem' }}>
              <h4>{court.name}</h4>
              <p><strong>Type:</strong> {court.court_type}</p>
              <p><strong>Max players:</strong> {court.max_players}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default VenueDetailPage;

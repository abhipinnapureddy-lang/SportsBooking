import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { fetchBookings } from '../api.js';

function BookingsPage() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBookings = async () => {
      setLoading(true);
      const result = await fetchBookings(token);
      setBookings(result.data || []);
      setLoading(false);
    };
    loadBookings();
  }, [token]);

  return (
    <div className="hero">
      <h2>Your bookings</h2>
      <p>Review booked courts, status, and details.</p>
      {loading ? (
        <div className="card">Loading bookings…</div>
      ) : bookings.length === 0 ? (
        <div className="card">No bookings yet.</div>
      ) : (
        bookings.map((booking) => (
          <div key={booking.id} className="card" style={{ marginBottom: '1rem' }}>
            <h3>{booking.venue_name}</h3>
            <p><strong>Court:</strong> {booking.court_name}</p>
            <p>{new Date(booking.start_time).toLocaleString()} — {new Date(booking.end_time).toLocaleString()}</p>
            <p><strong>Status:</strong> {booking.status}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default BookingsPage;

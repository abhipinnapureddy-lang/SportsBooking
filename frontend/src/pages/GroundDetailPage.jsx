import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { fetchGroundDetails } from '../api.js';

function GroundDetailPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const [ground, setGround] = useState(null);
  const [slots, setSlots] = useState([]);
  const [bookingMessage, setBookingMessage] = useState('');

  useEffect(() => {
    const loadGround = async () => {
      const response = await fetchGroundDetails(id);
      setGround(response.data?.ground || null);
      setSlots(response.data?.slots || []);
    };
    loadGround();
  }, [id]);

  if (!ground) {
    return <div className="card">Loading ground details…</div>;
  }

  return (
    <div className="grid grid-2">
      <div className="hero">
        <h2>{ground.name}</h2>
        <p>{ground.description}</p>
        <p><strong>Sport:</strong> {ground.sport_name}</p>
        <p><strong>Location:</strong> {ground.address}, {ground.city}</p>
        <p><strong>Status:</strong> {ground.status}</p>
      </div>
      <div>
        <div className="card">
          <h3>Slot availability</h3>
          {slots.length === 0 ? (
            <p>No slots are listed yet.</p>
          ) : (
            <div className="card-list">
              {slots.map((slot) => (
                <div key={slot.id} className="card card-sm">
                  <p><strong>{new Date(slot.start_time).toLocaleString()}</strong> — {new Date(slot.end_time).toLocaleString()}</p>
                  <p>{slot.status} · ₹{slot.price_per_hour}/hr</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <h3>Booking note</h3>
          <p>Use the booking form on the venue page once a slot and a court are available. Slot reservation integration is available through the `/api/slots` endpoint.</p>
          {bookingMessage && <div className="alert">{bookingMessage}</div>}
        </div>
      </div>
    </div>
  );
}

export default GroundDetailPage;
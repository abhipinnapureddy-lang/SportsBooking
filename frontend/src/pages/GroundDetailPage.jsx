import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { fetchGroundDetails, createBooking } from '../api.js';
import SlotCard from '../components/booking/SlotCard.jsx';
import BookingSummary from '../components/booking/BookingSummary.jsx';

function GroundDetailPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const [ground, setGround] = useState(null);
  const [slots, setSlots] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState(null);

  const loadGround = async () => {
    const response = await fetchGroundDetails(id);
    setGround(response.data?.ground || null);
    setSlots(response.data?.slots || []);
  };

  useEffect(() => {
    loadGround();
  }, [id]);

  const handleBooking = async (slotId) => {
    if (!user) {
      setError('Please log in to reserve a slot.');
      return;
    }
    setMessage('');
    setError('');
    const result = await createBooking(token, { slot_id: slotId });
    if (result.status !== 'success') {
      setError(result.message || 'Unable to create booking.');
      return;
    }
    setMessage('Slot booked successfully!');
    setSelectedSlotId(null);
    loadGround();
  };

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
        <BookingSummary title="Available slots" value={slots.length} detail="Slots open for booking" />
        <div className="card">
          <h3>Slot availability</h3>
          {slots.length === 0 ? (
            <p>No slots are listed yet.</p>
          ) : (
            <div className="card-list">
              {slots.map((slot) => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  isSelected={selectedSlotId === slot.id}
                  onSelect={setSelectedSlotId}
                />
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <h3>Booking note</h3>
          <p>Choose an available slot below and confirm your reservation.</p>
          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-error">{error}</div>}
          {selectedSlotId ? (
            <button className="button button-primary" onClick={() => handleBooking(selectedSlotId)}>
              Book selected slot
            </button>
          ) : (
            <p>Select an available slot to reserve it.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default GroundDetailPage;
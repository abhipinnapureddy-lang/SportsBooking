import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { fetchGroundDetails, fetchTimetableSlots, createBooking } from '../api.js';
import SlotCard from '../components/booking/SlotCard.jsx';
import BookingSummary from '../components/booking/BookingSummary.jsx';

const today = new Date().toISOString().slice(0, 10);

function GroundDetailPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const [ground, setGround] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);

  const loadGround = async () => {
    try {
      const response = await fetchGroundDetails(id);
      if (response.status !== 'success') {
        setError(response.message || 'Unable to load ground details.');
        return;
      }
      setGround(response.data?.ground || null);
    } catch (_) {
      setError('Unable to load ground details.');
    }
  };

  const loadSlots = async () => {
    if (!token) {
      setSlots([]);
      return;
    }

    setLoadingSlots(true);
    setSelectedSlotId(null);
    try {
      const response = await fetchTimetableSlots(token, { ground_id: id, date: selectedDate });
      if (response.status !== 'success') {
        setError(response.message || 'Unable to load availability.');
        setSlots([]);
        return;
      }
      setSlots(response.data || []);
      setError('');
    } catch (_) {
      setError('Unable to load availability.');
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    loadGround();
  }, [id]);

  useEffect(() => {
    loadSlots();
  }, [id, token, selectedDate]);

  const bookableSlots = useMemo(
    () => slots.filter((slot) => slot.available_for_booking === true),
    [slots]
  );

  const handleBooking = async (slotId) => {
    if (!user || !token) {
      setError('Please log in to reserve a slot.');
      return;
    }

    const slot = slots.find((item) => item.id === slotId);
    if (!slot?.available_for_booking) {
      setError('This slot is not available for booking.');
      return;
    }

    setMessage('');
    setError('');
    setBooking(true);

    try {
      const result = await createBooking(token, { slot_id: slotId });
      if (result.status !== 'success') {
        setError(result.message || 'Unable to create booking.');
        return;
      }
      setMessage('Slot booked successfully. No payment is required.');
      setSelectedSlotId(null);
      await loadSlots();
    } catch (_) {
      setError('Unable to create booking. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  if (!ground) {
    return <div className="card">Loading ground details…</div>;
  }

  return (
    <div className="grid grid-2">
      <div className="hero">
        <p className="eyebrow">Sports ground</p>
        <h2>{ground.name}</h2>
        <p>{ground.description}</p>
        <p><strong>Sport:</strong> {ground.sport_name}</p>
        <p><strong>Location:</strong> {ground.address}, {ground.city}</p>
        <p><strong>Status:</strong> {ground.status}</p>
        <div className="card card-sm">
          <strong>Booking policy</strong>
          <p className="muted">Bookings are free and only timetable-compatible slots can be reserved.</p>
        </div>
      </div>

      <div>
        <div className="card">
          <label htmlFor="booking-date"><strong>Choose date</strong></label>
          <input
            id="booking-date"
            className="input"
            type="date"
            min={today}
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
        </div>

        <BookingSummary
          title="Bookable slots"
          value={bookableSlots.length}
          detail={token ? 'Free and compatible with your timetable' : 'Log in to check your timetable'}
        />

        <div className="card">
          <h3>Slot availability</h3>
          {!token ? (
            <p className="muted">Please log in to see timetable-aware availability and book a slot.</p>
          ) : loadingSlots ? (
            <p className="muted">Checking your timetable and available slots…</p>
          ) : slots.length === 0 ? (
            <p className="muted">No slots are listed for this date.</p>
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
          <h3>Booking confirmation</h3>
          <p className="muted">Only green/free slots can be selected. Class-time slots are blocked automatically.</p>
          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-error">{error}</div>}
          {selectedSlotId ? (
            <button
              className="button button-primary"
              disabled={booking}
              onClick={() => handleBooking(selectedSlotId)}
            >
              {booking ? 'Booking…' : 'Confirm free booking'}
            </button>
          ) : (
            <p className="muted">Select an available slot to continue.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default GroundDetailPage;

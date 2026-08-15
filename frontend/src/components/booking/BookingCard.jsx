import { formatDateTime } from '../../utils/dateHelpers.js';

function BookingCard({ booking, userRole, onConfirm, onCancel }) {
  const title = booking.ground_name || booking.venue_name || 'Campus booking';
  const subtitle = booking.ground_name ? 'Ground slot' : booking.court_name || 'Court reservation';
  const timeLabel = booking.start_time ? `${formatDateTime(booking.start_time)} — ${formatDateTime(booking.end_time)}` : 'To be scheduled';

  return (
    <div className="card booking-card" style={{ marginBottom: '1rem' }}>
      <div className="booking-card-header">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <span className={`status-pill status-${booking.status || 'pending'}`}>{booking.status || 'pending'}</span>
      </div>
      <div className="booking-card-body">
        <p><strong>When:</strong> {timeLabel}</p>
        {userRole === 'owner' && booking.customer_name && <p><strong>Customer:</strong> {booking.customer_name}</p>}
        {booking.total_amount !== undefined && <p><strong>Amount:</strong> ₹{Number(booking.total_amount).toFixed(2)}</p>}
      </div>
      <div className="booking-card-actions">
        {booking.status === 'pending' && userRole === 'owner' && (
          <button type="button" className="button button-primary" onClick={() => onConfirm(booking.id)}>
            Confirm booking
          </button>
        )}
        {booking.status !== 'cancelled' && booking.status !== 'completed' && (
          <button type="button" className="button button-secondary" onClick={() => onCancel(booking.id)}>
            Cancel booking
          </button>
        )}
      </div>
    </div>
  );
}

export default BookingCard;

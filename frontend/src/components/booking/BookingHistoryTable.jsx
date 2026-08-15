import { formatDateTime } from '../../utils/dateHelpers.js';

function BookingHistoryTable({ bookings, onCancel, userRole }) {
  const formatRange = (booking) => {
    if (!booking.start_time || !booking.end_time) {
      return 'Not scheduled';
    }
    return `${formatDateTime(booking.start_time)} − ${formatDateTime(booking.end_time)}`;
  };

  const resolveEquipment = (booking) => {
    if (booking.court_name) {
      return 'Standard court set';
    }
    if (booking.slot_id) {
      return 'Reserved slot package';
    }
    return 'N/A';
  };

  return (
    <div className="booking-history-card card">
      <div className="booking-history-table-wrapper">
        <table className="booking-history-table">
          <thead>
            <tr>
              <th>Booking</th>
              <th>Date</th>
              <th>Time</th>
              <th>Sport</th>
              <th>Ground</th>
              <th>Equipment</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td>
                  <strong>{booking.booking_reference || 'Booking #' + booking.id}</strong>
                  <div className="muted">{booking.venue_name || booking.ground_name || 'Campus facility'}</div>
                </td>
                <td>{booking.start_time ? new Date(booking.start_time).toLocaleDateString([], { dateStyle: 'medium' }) : '—'}</td>
                <td>{formatRange(booking)}</td>
                <td>{booking.sport_name || booking.venue_name || 'General'}</td>
                <td>{booking.ground_name || 'N/A'}</td>
                <td>{resolveEquipment(booking)}</td>
                <td><span className={`status-pill status-${booking.status || 'pending'}`}>{booking.status || 'pending'}</span></td>
                <td>
                  {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                    <button type="button" className="button button-secondary page-table-button" onClick={() => onCancel(booking.id)}>
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default BookingHistoryTable;

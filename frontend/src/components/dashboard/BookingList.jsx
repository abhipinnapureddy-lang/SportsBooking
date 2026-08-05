function formatBookingTime(value) {
  return value ? new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Time to be confirmed';
}

function BookingList({ title, bookings, emptyMessage, compact = false }) {
  return (
    <section className="dashboard-section card">
      <div className="section-heading">
        <h2>{title}</h2>
        <span className="count-badge">{bookings.length}</span>
      </div>
      {bookings.length === 0 ? (
        <p className="muted">{emptyMessage}</p>
      ) : (
        <div className="booking-list">
          {bookings.map((booking) => (
            <article className="booking-item" key={booking.id}>
              <div>
                <h3>{booking.venue_name || 'Campus ground'}</h3>
                <p>{booking.court_name || 'Court assignment pending'}</p>
                {!compact && <small>Booked on {formatBookingTime(booking.created_at)}</small>}
              </div>
              <div className="booking-meta">
                <span className={`status-pill status-${booking.status || 'pending'}`}>{booking.status || 'pending'}</span>
                <time>{formatBookingTime(booking.start_time)}</time>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default BookingList;

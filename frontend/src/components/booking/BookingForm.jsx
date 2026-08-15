import { useState } from 'react';

function BookingForm({ courts, selectedCourt, onCourtChange, startTime, endTime, onStartChange, onEndChange, onSubmit, message, error }) {
  return (
    <div className="card booking-form-card">
      <h3>Reserve a court</h3>
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}
      {courts.length === 0 ? (
        <p>No courts available yet.</p>
      ) : (
        <form onSubmit={onSubmit}>
          <label>Court</label>
          <select value={selectedCourt || ''} onChange={(e) => onCourtChange(Number(e.target.value))}>
            {courts.map((court) => (
              <option key={court.id} value={court.id}>{court.name} — {court.court_type}</option>
            ))}
          </select>
          <label>Start time</label>
          <input type="datetime-local" value={startTime} onChange={(e) => onStartChange(e.target.value)} />
          <label>End time</label>
          <input type="datetime-local" value={endTime} onChange={(e) => onEndChange(e.target.value)} />
          <button type="submit" className="button button-primary">Confirm booking</button>
        </form>
      )}
    </div>
  );
}

export default BookingForm;

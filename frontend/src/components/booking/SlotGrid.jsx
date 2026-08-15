function SlotGrid({ slots, selectedSlotId, onSelect }) {
  return (
    <div className="slot-grid">
      {slots.map((slot) => (
        <div key={slot.id} className="slot-grid-item">
          {onSelect ? (
            <button type="button" className="slot-grid-button" onClick={() => onSelect(slot.id)} disabled={slot.status !== 'available'}>
              <div>
                <strong>{slot.status === 'available' ? 'Available' : 'Unavailable'}</strong>
                <p>{new Date(slot.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} — {new Date(slot.end_time).toLocaleString([], { timeStyle: 'short' })}</p>
                <p>₹{slot.price_per_hour}/hr</p>
              </div>
              {selectedSlotId === slot.id && <span className="slot-selected">Selected</span>}
            </button>
          ) : (
            <div className="slot-grid-display">
              <div>
                <strong>{slot.status === 'available' ? 'Available' : 'Unavailable'}</strong>
                <p>{new Date(slot.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} — {new Date(slot.end_time).toLocaleString([], { timeStyle: 'short' })}</p>
                <p>₹{slot.price_per_hour}/hr</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default SlotGrid;

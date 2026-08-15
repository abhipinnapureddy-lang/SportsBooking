import { formatDateTime } from '../../utils/dateHelpers.js';

function SlotCard({ slot, isSelected, onSelect }) {
  return (
    <div className={`card card-sm slot-card ${slot.status !== 'available' ? 'slot-unavailable' : ''}`}>
      <div>
        <p><strong>{formatDateTime(slot.start_time)}</strong> — {formatDateTime(slot.end_time)}</p>
        <p>{slot.status} · ₹{slot.price_per_hour}/hr</p>
      </div>
      <div>
        {slot.status === 'available' ? (
          <button type="button" className={`button ${isSelected ? 'button-primary' : 'button-secondary'}`} onClick={() => onSelect(slot.id)}>
            {isSelected ? 'Selected' : 'Select slot'}
          </button>
        ) : (
          <span className="muted">Unavailable</span>
        )}
      </div>
    </div>
  );
}

export default SlotCard;

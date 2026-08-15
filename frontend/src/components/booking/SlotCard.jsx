import { formatDateTime } from '../../utils/dateHelpers.js';

function SlotCard({ slot, isSelected, onSelect }) {
  const classConflict = slot.is_class_conflict === true;
  const isBookable = slot.available_for_booking === true || (!Object.prototype.hasOwnProperty.call(slot, 'available_for_booking') && slot.status === 'available');
  const statusLabel = classConflict
    ? 'Busy — class period'
    : isBookable
      ? 'Free'
      : slot.status === 'booked'
        ? 'Booked'
        : 'Unavailable';

  return (
    <div className={`card card-sm slot-card ${isBookable ? '' : 'slot-unavailable'}`}>
      <div>
        <p><strong>{formatDateTime(slot.start_time)}</strong> — {formatDateTime(slot.end_time)}</p>
        <p>{statusLabel} · Free campus booking</p>
      </div>
      <div>
        {isBookable ? (
          <button
            type="button"
            className={`button ${isSelected ? 'button-primary' : 'button-secondary'}`}
            onClick={() => onSelect(slot.id)}
          >
            {isSelected ? 'Selected' : 'Select free slot'}
          </button>
        ) : (
          <span className="muted">{classConflict ? 'Class time' : 'Not available'}</span>
        )}
      </div>
    </div>
  );
}

export default SlotCard;

function BookingHistoryFilters({ search, status, fromDate, toDate, historyType, onSearchChange, onStatusChange, onFromDateChange, onToDateChange, onHistoryTypeChange, onReset }) {
  return (
    <div className="history-toolbar">
      <div className="history-tablist" role="tablist" aria-label="Booking history view tabs">
        <button type="button" className={`history-tab ${historyType === 'current' ? 'active' : ''}`} onClick={() => onHistoryTypeChange('current')} role="tab" aria-selected={historyType === 'current'}>
          Current bookings
        </button>
        <button type="button" className={`history-tab ${historyType === 'previous' ? 'active' : ''}`} onClick={() => onHistoryTypeChange('previous')} role="tab" aria-selected={historyType === 'previous'}>
          Previous bookings
        </button>
      </div>

      <div className="history-filter-group">
        <label className="history-filter">
          Search
          <input type="search" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search by sport, venue, booking ref" />
        </label>

        <label className="history-filter">
          Status
          <select value={status} onChange={(event) => onStatusChange(event.target.value)}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>

        <label className="history-filter">
          From date
          <input type="date" value={fromDate} onChange={(event) => onFromDateChange(event.target.value)} />
        </label>

        <label className="history-filter">
          To date
          <input type="date" value={toDate} onChange={(event) => onToDateChange(event.target.value)} />
        </label>

        <button type="button" className="button button-secondary history-reset-button" onClick={onReset}>
          Reset filters
        </button>
      </div>
    </div>
  );
}

export default BookingHistoryFilters;

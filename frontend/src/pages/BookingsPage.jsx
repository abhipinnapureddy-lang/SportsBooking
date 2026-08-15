import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { fetchBookings, cancelBooking } from '../api.js';
import BookingHistoryFilters from '../components/booking/BookingHistoryFilters.jsx';
import BookingHistoryTable from '../components/booking/BookingHistoryTable.jsx';
import Pagination from '../components/ui/Pagination.jsx';

function BookingsPage() {
  const { token, user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [historyType, setHistoryType] = useState('current');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const loadBookings = async (currentPage = 1) => {
    setLoading(true);
    setMessage('');
    setError('');

    const query = {
      search,
      status,
      from_date: fromDate,
      to_date: toDate,
      history_type: historyType,
      page: currentPage,
      limit: pageSize
    };

    const result = await fetchBookings(token, query);
    if (result.status === 'success') {
      setBookings(result.data || []);
      setTotalPages(Math.max(1, Math.ceil((result.meta?.total || 0) / pageSize)));
      setPage(result.meta?.page || currentPage);
    } else {
      setError(result.message || 'Unable to load booking history.');
      setBookings([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadBookings(1);
  }, [token, search, status, fromDate, toDate, historyType]);

  const handleCancel = async (id) => {
    setMessage('');
    setError('');
    const result = await cancelBooking(token, id);
    if (result.status === 'success') {
      setMessage('Booking cancelled successfully.');
      loadBookings(page);
    } else {
      setError(result.message || 'Unable to cancel booking.');
    }
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    loadBookings(nextPage);
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setFromDate('');
    setToDate('');
    setHistoryType('current');
  };

  const title = user?.role === 'owner' ? 'Managed booking history' : 'My booking history';
  const description = user?.role === 'owner'
    ? 'Review current and previous venue reservations for your managed facilities.'
    : 'Search and filter your current and past sports bookings.';

  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">Booking history</p>
        <h2>{title}</h2>
        <p className="muted">{description}</p>
      </div>

      {message && <div className="alert">{message}</div>}
      {error && <div className="alert">{error}</div>}

      <BookingHistoryFilters
        search={search}
        status={status}
        fromDate={fromDate}
        toDate={toDate}
        historyType={historyType}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        onHistoryTypeChange={setHistoryType}
        onReset={handleResetFilters}
      />

      {loading ? (
        <div className="card">Loading booking history…</div>
      ) : bookings.length === 0 ? (
        <div className="card">No bookings match your filters.</div>
      ) : (
        <>
          <BookingHistoryTable bookings={bookings} onCancel={handleCancel} userRole={user?.role} />
          <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </>
      )}
    </div>
  );
}

export default BookingsPage;

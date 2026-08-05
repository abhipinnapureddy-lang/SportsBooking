import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchBookings, fetchVenues } from '../api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import BookingList from '../components/dashboard/BookingList.jsx';
import NotificationList from '../components/dashboard/NotificationList.jsx';
import ResourceCard from '../components/dashboard/ResourceCard.jsx';
import StatCard from '../components/dashboard/StatCard.jsx';

const sports = [
  { name: 'Cricket', icon: '🏏' }, { name: 'Football', icon: '⚽' },
  { name: 'Basketball', icon: '🏀' }, { name: 'Badminton', icon: '🏸' },
  { name: 'Volleyball', icon: '🏐' }, { name: 'Table Tennis', icon: '🏓' }
];

const placeholderEquipment = [
  { id: 'rackets', title: 'Badminton rackets', subtitle: 'Sports equipment desk', availability: '12 available', icon: '🏸' },
  { id: 'balls', title: 'Training balls', subtitle: 'Football and basketball', availability: '18 available', icon: '⚽' },
  { id: 'kits', title: 'Practice kits', subtitle: 'Cricket equipment room', availability: '8 available', icon: '🏏' }
];

const placeholderNotifications = [
  { id: 'welcome', type: 'info', title: 'Welcome to Smart Campus Sports', message: 'Explore grounds and reserve a slot during your free period.' },
  { id: 'timetable', type: 'success', title: 'Timetable check', message: 'Free-period validation will be applied when timetable integration is enabled.' }
];

function DashboardPage() {
  const { user, token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const loadDashboard = async () => {
      setLoading(true);
      setError('');
      try {
        const [bookingResult, venueResult] = await Promise.all([fetchBookings(token), fetchVenues()]);
        if (!active) return;
        setBookings(bookingResult.data || []);
        setVenues(venueResult.data || []);
        if (bookingResult.status !== 'success' || venueResult.status !== 'success') {
          setError('Some dashboard information could not be refreshed.');
        }
      } catch {
        if (active) setError('We could not load the latest dashboard information.');
      } finally {
        if (active) setLoading(false);
      }
    };
    if (token) loadDashboard();
    return () => { active = false; };
  }, [token]);

  const { upcoming, history } = useMemo(() => {
    const now = new Date();
    const activeBookings = bookings.filter((booking) => ['pending', 'confirmed'].includes(booking.status));
    return {
      upcoming: activeBookings.filter((booking) => new Date(booking.end_time) >= now).sort((a, b) => new Date(a.start_time) - new Date(b.start_time)),
      history: bookings.filter((booking) => !activeBookings.includes(booking) || new Date(booking.end_time) < now).sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
    };
  }, [bookings]);

  const availableGrounds = venues.filter((venue) => venue.status === 'approved').slice(0, 3);
  const firstName = user?.name?.trim().split(' ')[0] || 'Student';

  return (
    <div className="student-dashboard">
      <section className="dashboard-welcome">
        <div>
          <p className="eyebrow">Student dashboard</p>
          <h2>Welcome back, {firstName}.</h2>
          <p>Plan your next game, manage your reservations, and stay active on campus.</p>
        </div>
        <Link className="button" to="/venues">Book a ground</Link>
      </section>

      {error && <div className="alert" role="alert">{error}</div>}

      <section className="stats-grid" aria-label="Booking statistics">
        <StatCard label="Upcoming bookings" value={loading ? '—' : upcoming.length} detail="Reserved sports slots" />
        <StatCard label="Booking history" value={loading ? '—' : history.length} detail="Past and cancelled bookings" tone="purple" />
        <StatCard label="Available grounds" value={loading ? '—' : availableGrounds.length} detail="Currently listed facilities" tone="green" />
        <StatCard label="Equipment ready" value="38" detail="Placeholder inventory count" tone="orange" />
      </section>

      <section className="profile-summary card">
        <div className="profile-avatar" aria-hidden="true">{firstName.charAt(0).toUpperCase()}</div>
        <div>
          <p className="eyebrow">Your profile</p>
          <h2>{user?.name || 'Student profile'}</h2>
          <p>{user?.email || 'Email not available'} · {user?.phone || 'Phone not added'}</p>
        </div>
        <div className="profile-fields">
          <span><b>Role</b>{user?.role || 'Student'}</span>
          <span><b>Department</b>Not added yet</span>
          <span><b>Semester</b>Not added yet</span>
        </div>
        <Link className="text-link" to="/profile">View profile</Link>
      </section>

      <div className="dashboard-two-column">
        <BookingList title="Upcoming bookings" bookings={upcoming.slice(0, 3)} emptyMessage={loading ? 'Loading your reservations…' : 'No upcoming bookings. Find a ground and reserve your next slot.'} />
        <NotificationList notifications={placeholderNotifications} />
      </div>

      <section className="dashboard-section">
        <div className="section-heading"><h2>Sports quick access</h2><Link className="text-link" to="/venues">Explore all</Link></div>
        <div className="sports-grid">
          {sports.map((sport) => <Link className="sport-link" key={sport.name} to={`/venues?search=${encodeURIComponent(sport.name)}`}><span>{sport.icon}</span>{sport.name}</Link>)}
        </div>
      </section>

      <div className="dashboard-two-column">
        <section className="dashboard-section card">
          <div className="section-heading"><h2>Available grounds</h2><Link className="text-link" to="/venues">View all</Link></div>
          {loading ? <p className="muted">Loading grounds…</p> : availableGrounds.length ? <div className="resource-list">{availableGrounds.map((venue) => <ResourceCard key={venue.id} title={venue.name} subtitle={`${venue.sport_type} · ${venue.city}`} icon="📍" availability="Available to book" to={`/venues/${venue.id}`} label="View" />)}</div> : <p className="muted">No available grounds are listed right now.</p>}
        </section>
        <section className="dashboard-section card">
          <div className="section-heading"><h2>Available equipment</h2><span className="coming-soon">Coming soon</span></div>
          <div className="resource-list">{placeholderEquipment.map((item) => <ResourceCard key={item.id} {...item} label="Details" />)}</div>
          <p className="placeholder-note">Inventory availability is placeholder data until the equipment API is implemented.</p>
        </section>
      </div>

      <BookingList title="Booking history" bookings={history.slice(0, 5)} compact emptyMessage={loading ? 'Loading your booking history…' : 'Your completed and cancelled bookings will appear here.'} />
    </div>
  );
}

export default DashboardPage;

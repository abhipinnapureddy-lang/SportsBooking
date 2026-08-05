import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div className="hero">
      <h1>Reserve campus sports facilities with ease.</h1>
      <p>Find courts, fields, and facilities on campus and manage your bookings from one simple platform.</p>
      <div className="grid grid-2">
        <div className="card">
          <h3>Campus-ready booking backend</h3>
          <p>Register, login, reserve facilities, and manage venue details with secure authentication.</p>
        </div>
        <div className="card">
          <h3>Student-focused experience</h3>
          <p>Browse venues, view facility details, and see your upcoming campus reservations.</p>
        </div>
      </div>
      <div style={{ marginTop: '1.5rem' }}>
        <Link to="/venues" className="button">Browse venues</Link>
      </div>
    </div>
  );
}

export default HomePage;

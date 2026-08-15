function BookingSummary({ title, value, detail }) {
  return (
    <div className="stat-card booking-summary-card">
      <div className="stat-card-header">
        <h4>{title}</h4>
      </div>
      <div className="stat-card-body">
        <p className="stat-value">{value}</p>
        <p className="stat-detail">{detail}</p>
      </div>
    </div>
  );
}

export default BookingSummary;

function NotificationList({ notifications }) {
  return (
    <section className="dashboard-section card">
      <div className="section-heading">
        <h2>Notifications</h2>
        <span className="count-badge">{notifications.length}</span>
      </div>
      <div className="notification-list">
        {notifications.map((notification) => (
          <article className="notification-item" key={notification.id}>
            <span className={`notification-dot notification-${notification.type}`} aria-hidden="true" />
            <div>
              <h3>{notification.title}</h3>
              <p>{notification.message}</p>
            </div>
          </article>
        ))}
      </div>
      <p className="placeholder-note">Live notifications will appear here when the notifications API is available.</p>
    </section>
  );
}

export default NotificationList;

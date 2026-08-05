import { Link } from 'react-router-dom';

function ResourceCard({ title, subtitle, label, to = '/venues', icon, availability }) {
  return (
    <article className="resource-card">
      <span className="resource-icon" aria-hidden="true">{icon}</span>
      <div>
        <h3>{title}</h3>
        <p>{subtitle}</p>
        {availability && <span className="availability-tag">{availability}</span>}
      </div>
      <Link className="resource-link" to={to}>{label}</Link>
    </article>
  );
}

export default ResourceCard;

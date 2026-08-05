import { Link } from 'react-router-dom';

function AuthPageLayout({ eyebrow, title, description, visualTitle, children, footer }) {
  return <div className="login-page auth-page">
    <section className="login-visual" aria-label="Campus sports portal">
      <div className="login-brand"><span className="login-brand-mark">SC</span><span>Smart Campus Sports</span></div>
      <div className="login-visual-content"><p className="eyebrow">Campus sports portal</p><h1>{visualTitle}</h1><p>Everything you need to stay active on campus: facilities, equipment, bookings, and sports updates.</p><div className="login-highlights"><span><b>Free</b> campus reservations</span><span><b>Simple</b> account access</span><span><b>One</b> student sports portal</span></div></div>
      <div className="login-sport-orb orb-one">🏀</div><div className="login-sport-orb orb-two">🏸</div>
    </section>
    <section className="login-panel"><div className="login-form-wrap"><Link className="login-mobile-brand" to="/">Smart Campus Sports</Link><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p className="login-intro">{description}</p>{children}{footer && <p className="login-register">{footer}</p>}</div></section>
  </div>;
}
export default AuthPageLayout;

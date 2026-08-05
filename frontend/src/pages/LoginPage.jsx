import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { loginUser } from '../api.js';

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter both your email and password.');
      return;
    }

    setLoading(true);
    try {
      const result = await loginUser({ email: email.trim(), password });
      if (result.status !== 'success') {
        setError(result.message || 'Login failed');
        return;
      }

      login(result.data.user, result.data.token, rememberMe);
      navigate('/dashboard');
    } catch (err) {
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-visual" aria-label="Campus sports highlights">
        <div className="login-brand">
          <span className="login-brand-mark" aria-hidden="true">SC</span>
          <span>Smart Campus Sports</span>
        </div>
        <div className="login-visual-content">
          <p className="eyebrow">Campus sports portal</p>
          <h1>Make time for the game.</h1>
          <p>Reserve campus grounds, keep track of your activities, and discover your next sport in one place.</p>
          <div className="login-highlights">
            <span><b>Free</b> campus reservations</span>
            <span><b>Easy</b> slot management</span>
            <span><b>Smart</b> sports access</span>
          </div>
        </div>
        <div className="login-sport-orb orb-one" aria-hidden="true">🏀</div>
        <div className="login-sport-orb orb-two" aria-hidden="true">🏸</div>
      </section>

      <section className="login-panel">
        <div className="login-form-wrap">
          <Link className="login-mobile-brand" to="/">Smart Campus Sports</Link>
          <p className="eyebrow">Student sign in</p>
          <h2>Welcome back</h2>
          <p className="login-intro">Enter your campus account details to continue.</p>

          {error && <div className="alert" role="alert">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <label htmlFor="login-email">Campus email
              <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@campus.edu" required autoComplete="email" />
            </label>
            <label htmlFor="login-password">Password
              <input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required autoComplete="current-password" />
            </label>
            <div className="login-options">
              <label className="remember-choice"><input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} /> Remember me</label>
              <Link to="/forgot-password">Forgot password?</Link>
            </div>
            <button type="submit" className="button login-submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in to dashboard'}</button>
          </form>
          <p className="login-register">New to campus sports? <Link to="/register">Create your account</Link></p>
        </div>
      </section>
    </div>
  );
}

export default LoginPage;

import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthPageLayout from '../components/auth/AuthPageLayout.jsx';
function ForgotPasswordPage() {
  const [email, setEmail] = useState(''); const [loading, setLoading] = useState(false); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  const handleSubmit = async (event) => { event.preventDefault(); setError(''); setMessage(''); if (!email.trim()) return setError('Please enter your email address.'); setLoading(true); try { const response = await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim() }) }); const result = await response.json(); result.status === 'success' ? setMessage(result.message || 'Password reset instructions have been sent to your email.') : setError(result.message || 'Unable to send reset instructions.'); } catch { setError('Unable to connect to server. Please try again.'); } finally { setLoading(false); } };
  return <AuthPageLayout eyebrow="Account recovery" title="Reset your password" description="Enter your campus email and we will send reset instructions." visualTitle="We’ll get you back in." footer={<>Remembered it? <Link to="/login">Sign in</Link></>}>
    {message && <div className="alert auth-success">{message}</div>}{error && <div className="alert">{error}</div>}<form onSubmit={handleSubmit} className="login-form"><label htmlFor="forgot-email">Campus email<input id="forgot-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@campus.edu" required autoComplete="email" /></label><button type="submit" className="button login-submit" disabled={loading}>{loading ? 'Sending link…' : 'Send reset link'}</button></form>
  </AuthPageLayout>;
}
export default ForgotPasswordPage;

import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyEmail } from '../api.js';
import AuthPageLayout from '../components/auth/AuthPageLayout.jsx';

function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      if (!token) { setError('Verification token is missing.'); setLoading(false); return; }
      try {
        const result = await verifyEmail(token);
        result.status === 'success' ? setMessage(result.message || 'Your email has been verified. You can now sign in.') : setError(result.message || 'Verification failed.');
      } catch { setError('Unable to connect to the server. Please try again.'); } finally { setLoading(false); }
    };
    verify();
  }, [token]);

  return <AuthPageLayout eyebrow="Account verification" title="Verify your email" description="We are confirming your campus account." visualTitle="Almost ready to play." footer={<>Proceed to <Link to="/login">Sign in</Link></>}>
    {loading && <p className="muted">Verifying your email…</p>}
    {message && <div className="alert auth-success" role="status">{message}</div>}
    {error && <div className="alert" role="alert">{error}</div>}
  </AuthPageLayout>;
}
export default VerifyEmailPage;

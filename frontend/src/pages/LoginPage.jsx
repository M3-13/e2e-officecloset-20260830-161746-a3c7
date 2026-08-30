import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/auth.css';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function validate() {
    if (!email.trim()) {
      return 'Bitte gib deine E-Mail-Adresse ein.';
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      return 'Bitte gib eine gültige E-Mail-Adresse ein.';
    }
    if (!password) {
      return 'Bitte gib dein Passwort ein.';
    }
    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/wardrobe', { replace: true });
    } catch (err) {
      if (err && err.status === 401) {
        setError('E-Mail oder Passwort ist falsch.');
      } else {
        setError(
          (err && err.message) || 'Anmeldung fehlgeschlagen. Bitte versuche es erneut.',
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page">
      <h1 className="page-heading">Anmeldung</h1>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label className="auth-label" htmlFor="login-email">
            E-Mail-Adresse
          </label>
          <input
            id="login-email"
            className={`auth-input${error && !email.trim() ? ' auth-input--error' : ''}`}
            type="email"
            autoComplete="email"
            placeholder="name@beispiel.de"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="auth-field">
          <label className="auth-label" htmlFor="login-password">
            Passwort
          </label>
          <input
            id="login-password"
            className={`auth-input${error && !password ? ' auth-input--error' : ''}`}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Anmelden …' : 'Anmelden'}
        </button>
        <p className="auth-links">
          Noch kein Konto? <Link to="/register">Jetzt registrieren</Link>
        </p>
      </form>
    </section>
  );
}

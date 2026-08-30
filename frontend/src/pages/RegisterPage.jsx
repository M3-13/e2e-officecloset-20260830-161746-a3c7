import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/auth.css';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
      return 'Bitte wähle ein Passwort.';
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return `Das Passwort muss mindestens ${MIN_PASSWORD_LENGTH} Zeichen lang sein.`;
    }
    if (password !== confirmPassword) {
      return 'Die Passwörter stimmen nicht überein.';
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
      await register(email.trim(), password);
      navigate('/wardrobe', { replace: true });
    } catch (err) {
      if (err && err.status === 409) {
        setError('Mit dieser E-Mail-Adresse existiert bereits ein Konto.');
      } else {
        setError(
          (err && err.message) ||
            'Registrierung fehlgeschlagen. Bitte versuche es erneut.',
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page">
      <h1 className="page-heading">Registrierung</h1>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label className="auth-label" htmlFor="register-email">
            E-Mail-Adresse
          </label>
          <input
            id="register-email"
            className={`auth-input${error && !email.trim() ? ' auth-input--error' : ''}`}
            type="email"
            autoComplete="email"
            placeholder="name@beispiel.de"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="auth-field">
          <label className="auth-label" htmlFor="register-password">
            Passwort
          </label>
          <input
            id="register-password"
            className={`auth-input${error && !password ? ' auth-input--error' : ''}`}
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="auth-field">
          <label className="auth-label" htmlFor="register-confirm-password">
            Passwort wiederholen
          </label>
          <input
            id="register-confirm-password"
            className={`auth-input${
              error && password !== confirmPassword ? ' auth-input--error' : ''
            }`}
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Konto wird erstellt …' : 'Konto erstellen'}
        </button>
        <p className="auth-links">
          Bereits ein Konto? <Link to="/login">Jetzt anmelden</Link>
        </p>
      </form>
    </section>
  );
}

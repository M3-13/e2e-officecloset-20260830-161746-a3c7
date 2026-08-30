import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import request from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

const dangerColor = '#B4433A';
const dangerHover = '#9A372F';

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.72)',
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'var(--space-3)',
  zIndex: 100,
};

const dialogStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-4)',
  maxWidth: 480,
  width: 'calc(100% - 32px)',
};

const dangerButtonStyle = {
  background: dangerColor,
  color: 'var(--color-fg)',
  border: 'none',
};

export default function AccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await request('DELETE', '/api/account');
      logout();
      navigate('/');
    } catch (err) {
      setError(err.message || 'Das Konto konnte nicht gelöscht werden.');
      setDeleting(false);
    }
  }

  return (
    <section className="page">
      <h1 className="page-heading">Konto</h1>

      <div className="card">
        <p>
          Angemeldet als:{' '}
          <strong>{user && user.email ? user.email : 'Ihr Konto'}</strong>
        </p>

        <h2>Konto löschen</h2>
        <p>
          Wenn Sie Ihr Konto löschen, werden alle zugehörigen Daten – Ihre Garderobe,
          Ihre Outfits und Ihre hochgeladenen Bilder – unwiderruflich entfernt. Dieser
          Vorgang kann nicht rückgängig gemacht werden.
        </p>

        {error && (
          <p style={{ color: dangerColor }} role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          className="btn"
          style={dangerButtonStyle}
          onClick={() => setConfirmOpen(true)}
        >
          Konto löschen
        </button>
      </div>

      {confirmOpen && (
        <div style={overlayStyle} role="presentation">
          <div
            style={dialogStyle}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
          >
            <h2 id="delete-account-title" style={{ marginTop: 0 }}>
              Konto wirklich löschen?
            </h2>
            <p>
              Diese Aktion entfernt Ihr Konto und alle zugehörigen Daten endgültig.
              Sie können sich danach nicht mehr anmelden.
            </p>
            <div
              style={{
                display: 'flex',
                gap: 'var(--space-2)',
                justifyContent: 'flex-end',
                marginTop: 'var(--space-4)',
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmOpen(false)}
                disabled={deleting}
              >
                Abbrechen
              </button>
              <button
                type="button"
                className="btn"
                style={dangerButtonStyle}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Wird gelöscht…' : 'Endgültig löschen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

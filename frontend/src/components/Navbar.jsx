import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          OfficeCloset
        </Link>
        <nav className="navbar-links">
          <Link to="/wardrobe">Garderobe</Link>
          <Link to="/outfits">Outfits</Link>
          <Link to="/account">Konto</Link>
        </nav>
        <div className="navbar-auth">
          {token ? (
            <button type="button" className="btn btn-secondary" onClick={handleLogout}>
              Abmelden
            </button>
          ) : (
            <Link to="/login" className="btn btn-secondary">
              Anmelden
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

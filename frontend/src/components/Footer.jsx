import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <nav className="footer-links">
          <Link to="/impressum">Impressum</Link>
          <Link to="/datenschutz">Datenschutz</Link>
          <Link to="/account">Konto</Link>
        </nav>
        <p className="footer-note">© {new Date().getFullYear()} OfficeCloset</p>
      </div>
    </footer>
  );
}

import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg bg-tp-green py-3">
      <div className="container">
        <Link className="navbar-brand text-white fw-bold" to="/">
          🏔️ TO PATAGONIA
        </Link>
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className="nav-link text-white" to="/">Catálogo (Turistas)</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-white fw-bold" to="/reservas">Gestión Reservas (Operador)</Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
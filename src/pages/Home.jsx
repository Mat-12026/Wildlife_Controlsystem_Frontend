import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <>
      {/* 1. HERO SECTION */}
      <section className="hero-full d-flex align-items-center" style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.75)), url('https://images.unsplash.com/photo-1527004013197-933c4bb611b3?auto=format&fit=crop&w=1600&q=80')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '85vh'
      }}>
        <div className="container text-center text-light py-5">
          <p className="text-uppercase mb-2" style={{ color: 'var(--tp-gold)', fontWeight: '700', letterSpacing: '4px', fontSize: '0.9rem' }}>
            WILDLIFE ADVENTURE
          </p>
          <h1 className="display-3 fw-bold mb-3 text-uppercase" style={{ letterSpacing: '2px' }}>
            Patagonia. Every Route Mastered.
          </h1>
          <p className="lead mb-4 mx-auto style-italic" style={{ maxWidth: '700px', color: '#d0d0d0' }}>
            Every Journey Considered. Connecting the most remote destinations across Chile and Argentina.
          </p>
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <Link to="/catalogo" className="btn rounded-0 px-4 py-3 text-uppercase fw-bold" style={{ backgroundColor: 'var(--tp-gold)', color: '#000', border: 'none', letterSpacing: '1px' }}>
              Book Your Connection
            </Link>
            <a href="#adventures" className="btn btn-outline-light rounded-0 px-4 py-3 text-uppercase fw-bold" style={{ letterSpacing: '1px' }}>
              Explore Adventures
            </a>
          </div>
        </div>
      </section>

      {/* 2. ABOUT US SECTION */}
      <section className="section-about py-5" style={{ backgroundColor: '#121212' }}>
        <div className="container py-4">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-4 mb-lg-0 pe-lg-5">
              <h6 className="text-uppercase mb-2" style={{ color: 'var(--tp-gold)', fontWeight: '700', letterSpacing: '3px' }}>
                Shaped by the Land, Guided by Experience
              </h6>
              <h2 className="display-6 fw-bold mb-4 text-white text-uppercase" style={{ letterSpacing: '1px' }}>
                20+ Years Connecting Patagonia
              </h2>
              <p className="lead mb-4" style={{ color: '#b0b0b0' }}>
                Born on the rugged roads threading through Patagonia, Wildlife Adventure is the trusted connection partner for leading hotels and international travelers.
              </p>
              <p className="mb-4" style={{ color: '#8e8e8e', lineHeight: '1.7' }}>
                We operate year-round across Chile and Argentina. From complex border crossings to remote trailheads, we handle every detail so you can travel with absolute ease and confidence.
              </p>

              {/* Feature Highlights */}
              <div className="row g-3 mb-4">
                <div className="col-sm-6">
                  <div className="p-3 rounded-0 border border-secondary bg-dark h-100">
                    <h6 className="fw-bold text-uppercase mb-2" style={{ color: 'var(--tp-gold)', letterSpacing: '1px' }}>
                      01. Cross-Border
                    </h6>
                    <p className="small mb-0 text-light opacity-75">
                      Seamless international connections between Argentina and Chile.
                    </p>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="p-3 rounded-0 border border-secondary bg-dark h-100">
                    <h6 className="fw-bold text-uppercase mb-2" style={{ color: 'var(--tp-gold)', letterSpacing: '1px' }}>
                      02. Every Point Covered
                    </h6>
                    <p className="small mb-0 text-light opacity-75">
                      Airports, lodges, estancias, and remote wilderness trailheads.
                    </p>
                  </div>
                </div>
              </div>

              <a href="#contacto" className="btn btn-light rounded-0 px-4 py-3 text-uppercase fw-bold" style={{ letterSpacing: '1px' }}>
                Contact Our Team
              </a>
            </div>

            <div className="col-lg-6">
              <div className="position-relative">
                <img 
                  src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80" 
                  alt="Patagonian Shuttle Fleet" 
                  className="img-fluid rounded-0 border border-secondary shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. ADVENTURES & DAY TOURS (Con fotos exactas de Torres del Paine y Perito Moreno) */}
      <section id="adventures" className="py-5" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="container py-4">
          <div className="text-center mb-5">
            <h6 className="text-uppercase mb-2" style={{ color: 'var(--tp-gold)', fontWeight: '700', letterSpacing: '3px' }}>
              Where the Road Becomes the Experience
            </h6>
            <h2 className="display-6 fw-bold text-white text-uppercase" style={{ letterSpacing: '1px' }}>
              Featured Expeditions
            </h2>
          </div>

          <div className="row g-4">
            {/* 1. Paine Adventure */}
            <div className="col-md-4">
              <div className="card h-100 bg-dark text-light border border-secondary rounded-0 shadow-sm d-flex flex-column">
                <div className="overflow-hidden" style={{ maxHeight: '240px' }}>
                  <img 
                    src="https://images.unsplash.com/photo-1527004013197-933c4bb611b3?auto=format&fit=crop&w=800&q=80" 
                    alt="Torres del Paine Tour" 
                    className="card-img-top rounded-0"
                    style={{ objectFit: 'cover', height: '240px', width: '100%' }}
                  />
                </div>
                <div className="card-body d-flex flex-column p-4">
                  <span className="badge bg-outline-warning border border-warning text-warning mb-2 align-self-start rounded-0 text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>
                    Full-Day Excursion
                  </span>
                  <h4 className="card-title fw-bold text-uppercase text-white mb-3" style={{ letterSpacing: '1px' }}>
                    Paine Adventure
                  </h4>
                  <p className="card-text small mb-4" style={{ color: '#b0b0b0', lineHeight: '1.6' }}>
                    A single-day expedition starting right at your hotel door into the heart of Torres del Paine National Park. Guided by local experts through iconic viewpoints and wild trails.
                  </p>
                  <div className="mt-auto">
                    <Link to="/catalogo" className="btn btn-outline-light w-100 rounded-0 text-uppercase fw-bold py-2" style={{ letterSpacing: '1px', fontSize: '0.85rem' }}>
                      Discover Paine
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Moreno Adventure */}
            <div className="col-md-4">
              <div className="card h-100 bg-dark text-light border border-secondary rounded-0 shadow-sm d-flex flex-column">
                <div className="overflow-hidden" style={{ maxHeight: '240px' }}>
                  <img 
                    src="https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=800&q=80" 
                    alt="Glaciar Perito Moreno Tour" 
                    className="card-img-top rounded-0"
                    style={{ objectFit: 'cover', height: '240px', width: '100%' }}
                  />
                </div>
                <div className="card-body d-flex flex-column p-4">
                  <span className="badge bg-outline-warning border border-warning text-warning mb-2 align-self-start rounded-0 text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>
                    Glacier Expedition
                  </span>
                  <h4 className="card-title fw-bold text-uppercase text-white mb-3" style={{ letterSpacing: '1px' }}>
                    Moreno Adventure
                  </h4>
                  <p className="card-text small mb-4" style={{ color: '#b0b0b0', lineHeight: '1.6' }}>
                    Designed for travelers seeking to discover the world-renowned Perito Moreno Glacier via lesser-known paths, connecting authentically with Patagonia's glacial wonders.
                  </p>
                  <div className="mt-auto">
                    <Link to="/catalogo" className="btn btn-outline-light w-100 rounded-0 text-uppercase fw-bold py-2" style={{ letterSpacing: '1px', fontSize: '0.85rem' }}>
                      Discover Moreno
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Cross-Border Shuttles */}
            <div className="col-md-4">
              <div className="card h-100 bg-dark text-light border border-secondary rounded-0 shadow-sm d-flex flex-column">
                <div className="overflow-hidden" style={{ maxHeight: '240px' }}>
                  <img 
                    src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80" 
                    alt="Patagonian Highway & Border Connection" 
                    className="card-img-top rounded-0"
                    style={{ objectFit: 'cover', height: '240px', width: '100%' }}
                  />
                </div>
                <div className="card-body d-flex flex-column p-4">
                  <span className="badge bg-outline-warning border border-warning text-warning mb-2 align-self-start rounded-0 text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>
                    Transfers & Logistics
                  </span>
                  <h4 className="card-title fw-bold text-uppercase text-white mb-3" style={{ letterSpacing: '1px' }}>
                    Cross-Border Connections
                  </h4>
                  <p className="card-text small mb-4" style={{ color: '#b0b0b0', lineHeight: '1.6' }}>
                    Private and semi-private links connecting Punta Arenas, Puerto Natales, Torres del Paine, El Calafate, and El Chaltén with full customs support.
                  </p>
                  <div className="mt-auto">
                    <Link to="/catalogo" className="btn btn-outline-light w-100 rounded-0 text-uppercase fw-bold py-2" style={{ letterSpacing: '1px', fontSize: '0.85rem' }}>
                      View All Routes
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FLEET SECTION */}
      <section className="py-5" style={{ backgroundColor: '#121212' }}>
        <div className="container py-4">
          <div className="text-center mb-5">
            <h6 className="text-uppercase mb-2" style={{ color: 'var(--tp-gold)', fontWeight: '700', letterSpacing: '3px' }}>
              Ready for Every Road, Year-Round
            </h6>
            <h2 className="display-6 fw-bold text-white text-uppercase" style={{ letterSpacing: '1px' }}>
              Fleet Built for Patagonia
            </h2>
          </div>

          <div className="row g-4 text-center">
            <div className="col-6 col-lg-3">
              <div className="p-4 rounded-0 bg-dark border border-secondary h-100">
                <i className="bi bi-truck fs-1 mb-3" style={{ color: 'var(--tp-gold)' }}></i>
                <h5 className="fw-bold text-white text-uppercase mb-2" style={{ fontSize: '1rem', letterSpacing: '1px' }}>Adventure Truck</h5>
                <p className="small mb-0" style={{ color: '#8e8e8e' }}>Heavy-duty off-road capability for extreme terrain</p>
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <div className="p-4 rounded-0 bg-dark border border-secondary h-100">
                <i className="bi bi-car-front fs-1 mb-3" style={{ color: 'var(--tp-gold)' }}></i>
                <h5 className="fw-bold text-white text-uppercase mb-2" style={{ fontSize: '1rem', letterSpacing: '1px' }}>SUV & Toyota 4x4</h5>
                <p className="small mb-0" style={{ color: '#8e8e8e' }}>Comfort & versatility for small private groups</p>
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <div className="p-4 rounded-0 bg-dark border border-secondary h-100">
                <i className="bi bi-bus-front fs-1 mb-3" style={{ color: 'var(--tp-gold)' }}></i>
                <h5 className="fw-bold text-white text-uppercase mb-2" style={{ fontSize: '1rem', letterSpacing: '1px' }}>Executive Vans</h5>
                <p className="small mb-0" style={{ color: '#8e8e8e' }}>Elegance and space for medium-sized groups</p>
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <div className="p-4 rounded-0 bg-dark border border-secondary h-100">
                <i className="bi bi-shield-check fs-1 mb-3" style={{ color: 'var(--tp-gold)' }}></i>
                <h5 className="fw-bold text-white text-uppercase mb-2" style={{ fontSize: '1rem', letterSpacing: '1px' }}>Minibus & Bus</h5>
                <p className="small mb-0" style={{ color: '#8e8e8e' }}>Maximum capacity for corporate & large tours</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer id="contacto" className="footer-tp py-5 border-top border-secondary" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="container">
          <div className="row mb-4">
            <div className="col-lg-4 mb-4 mb-lg-0">
              <h3 className="h5 fw-bold text-uppercase text-white mb-3" style={{ letterSpacing: '2px' }}>Wildlife Adventure</h3>
              <p className="pe-lg-4 small" style={{ color: '#8e8e8e', lineHeight: '1.7' }}>
                Delivering seamless, safe, and memorable travel experiences across Southern Patagonia, Chile, and Argentina.
              </p>
            </div>
            <div className="col-lg-4 mb-4 mb-lg-0">
              <h4 className="h6 fw-bold text-uppercase text-white mb-3" style={{ letterSpacing: '2px' }}>Contact Us</h4>
              <ul className="list-unstyled small">
                <li className="mb-2 text-light opacity-75">
                  <i className="bi bi-geo-alt me-2" style={{ color: 'var(--tp-gold)' }}></i> Punta Arenas, Magallanes & Chilean Antarctica
                </li>
                <li className="mb-2 text-light opacity-75">
                  <i className="bi bi-telephone me-2" style={{ color: 'var(--tp-gold)' }}></i> +56 9 1234 5678 / +54 9 2966 275068
                </li>
                <li className="mb-2 text-light opacity-75">
                  <i className="bi bi-envelope me-2" style={{ color: 'var(--tp-gold)' }}></i> info@topatagonia.com
                </li>
              </ul>
            </div>
            <div className="col-lg-4">
              <h4 className="h6 fw-bold text-uppercase text-white mb-3" style={{ letterSpacing: '2px' }}>Quick Navigation</h4>
              <ul className="list-unstyled small">
                <li className="mb-2"><Link to="/catalogo" className="text-light text-decoration-none opacity-75">Tour & Transfer Catalog</Link></li>
                <li className="mb-2"><Link to="/login" className="text-light text-decoration-none opacity-75">Operator Access</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-top border-secondary pt-4 text-center">
            <small style={{ color: '#6c757d' }}>
              &copy; {new Date().getFullYear()} Wildlife Adventure - To Patagonia. All rights reserved.
            </small>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Home;
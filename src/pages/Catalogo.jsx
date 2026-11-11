import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Catalogo = () => {
  const navigate = useNavigate();
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroActivo, setFiltroActivo] = useState('All');
  const [busqueda, setBusqueda] = useState('');

  // 1. Cargar servicios desde PostgreSQL (Django REST Framework)
  useEffect(() => {
    const fetchServicios = async () => {
      try {
        const response = await fetch('https://both-smirk-entrust.ngrok-free.dev/api/servicios/', {
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        });

        if (!response.ok) {
          throw new Error('Server connection failed');
        }

        const data = await response.json();

        // Mapear los campos devueltos por el modelo Tarifa de Django
        const dataMapeada = data.map(item => {
          // Normalizar categoría de Django (TRASLADO/EXCURSION) a la vista en Inglés (Transfer/Tour)
          let cat = item.categoria;
          if (cat === 'TRASLADO') cat = 'Transfer';
          else if (cat === 'EXCURSION') cat = 'Tour';
          else if (!cat) cat = 'Transfer';

          return {
            id: item.id,
            titulo: item.servicio || item.titulo || 'Patagonian Service',
            categoria: cat,
            origen: item.origen || 'Patagonia',
            descripcion: item.descripcion || 'Professional passenger transport and excursion service in Southern Patagonia.',
            imagen: item.imagen || 'https://images.unsplash.com/photo-1527004013197-933c4bb611b3?auto=format&fit=crop&w=600&q=80',
            precios: {
              pax2: item.pax_2 || item.pax2 || 0,
              pax4: item.pax_4 || item.pax4 || 0,
              pax10: item.pax_10 || item.pax10 || 0
            }
          };
        });

        setServicios(dataMapeada);
      } catch (err) {
        console.error("Error loading services from database:", err);
        setError("Unable to connect to the rate database. Please verify backend service.");
      } finally {
        setLoading(false);
      }
    };

    fetchServicios();
  }, []);

  // 2. Lógica de Filtros Combinados (Búsqueda + Categoría)
  const serviciosFiltrados = servicios.filter(s => {
    const coincideCategoria = 
      filtroActivo === 'All' || 
      s.categoria.toLowerCase() === filtroActivo.toLowerCase() ||
      (filtroActivo === 'Transfer' && s.categoria === 'TRASLADO') ||
      (filtroActivo === 'Tour' && s.categoria === 'EXCURSION');

    const coincideBusqueda = 
      s.titulo.toLowerCase().includes(busqueda.toLowerCase()) || 
      s.origen.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.descripcion.toLowerCase().includes(busqueda.toLowerCase());

    return coincideCategoria && coincideBusqueda;
  });

  // 3. Redirección al formulario de reserva con el estado del servicio seleccionado
  const irAReservar = (servicio) => {
    navigate('/reservar', { state: { servicio } });
  };

  return (
    <div style={{ backgroundColor: '#121212', minHeight: '100vh', paddingBottom: '80px' }}>
      
      {/* HEADER & SEARCH / FILTER SECTION */}
      <div className="py-5 text-center border-bottom border-secondary" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="container mt-4">
          <p className="text-uppercase mb-2" style={{ color: 'var(--tp-gold)', fontWeight: '700', letterSpacing: '3px', fontSize: '0.85rem' }}>
            OFFICIAL RATE CATALOG 2026-2027
          </p>
          <h1 className="display-4 fw-bold mb-4 text-white text-uppercase" style={{ letterSpacing: '2px' }}>
            Services & Connections
          </h1>
          
          <div className="row justify-content-center mt-4">
            <div className="col-md-8">
              {/* Search Bar */}
              <div className="input-group mb-4 shadow-sm">
                <span className="input-group-text bg-dark border-secondary text-white rounded-0">
                  <i className="bi bi-search"></i>
                </span>
                <input 
                  type="text" 
                  className="form-control bg-dark text-white border-secondary rounded-0" 
                  placeholder="Search destination, glacier, route or tour..." 
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  style={{ color: 'white' }}
                />
              </div>

              {/* Filter Buttons */}
              <div className="btn-group shadow-sm w-100" role="group">
                {['All', 'Transfer', 'Tour'].map(filtro => (
                  <button 
                    key={filtro}
                    type="button" 
                    className={`btn rounded-0 text-uppercase fw-bold py-2 ${filtroActivo === filtro ? 'btn-gold' : 'btn-outline-light text-white'}`}
                    style={{ 
                      borderWidth: '1px', 
                      borderColor: filtroActivo === filtro ? 'var(--tp-gold)' : '#444',
                      letterSpacing: '1px',
                      fontSize: '0.85rem',
                      backgroundColor: filtroActivo === filtro ? 'var(--tp-gold)' : 'transparent',
                      color: filtroActivo === filtro ? '#000' : '#fff'
                    }}
                    onClick={() => setFiltroActivo(filtro)}
                  >
                    {filtro === 'All' ? 'Show All' : `${filtro}s Only`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* POLICY NOTICE BANNER */}
      <div className="container mt-4">
        <div className="alert border-secondary text-light d-flex align-items-center rounded-0 p-3" style={{ backgroundColor: '#1a1a1a' }} role="alert">
          <i className="bi bi-info-circle-fill fs-4 me-3" style={{ color: 'var(--tp-gold)' }}></i>
          <div className="small" style={{ lineHeight: '1.5' }}>
            <strong className="text-uppercase" style={{ color: 'var(--tp-gold)', letterSpacing: '1px' }}>Important Notice: </strong> 
            Published vehicle rates are final and include VAT. International transfers do NOT include park entrance fees, customs/immigration taxes, or ferry tickets.
          </div>
        </div>
      </div>

      {/* SERVICE CARDS GRID */}
      <div className="container py-4">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" role="status" style={{ color: 'var(--tp-gold)' }}></div>
            <p className="mt-3 text-light opacity-75 text-uppercase" style={{ letterSpacing: '1px' }}>
              Connecting to PostgreSQL Database...
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-5">
            <div className="p-4 border border-danger bg-dark d-inline-block text-start">
              <h5 className="text-danger fw-bold mb-2">Database Connection Error</h5>
              <p className="text-light small mb-0">{error}</p>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {serviciosFiltrados.length > 0 ? serviciosFiltrados.map(servicio => (
              <div className="col-md-6 col-lg-4" key={servicio.id}>
                <div className="card h-100 d-flex flex-column bg-dark text-light border border-secondary rounded-0 shadow-sm" style={{ overflow: 'hidden' }}>
                  
                  {/* Image and Badges */}
                  <div className="position-relative overflow-hidden" style={{ height: '220px' }}>
                    <span className="position-absolute top-0 start-0 m-3 badge rounded-0 text-uppercase fw-bold" style={{ backgroundColor: 'var(--tp-gold)', color: '#000', fontSize: '0.7rem', letterSpacing: '1px', zIndex: 2 }}>
                      {servicio.categoria}
                    </span>
                    <span className="position-absolute top-0 end-0 m-3 badge bg-black bg-opacity-75 border border-secondary rounded-0" style={{ fontSize: '0.75rem', zIndex: 2 }}>
                      <i className="bi bi-geo-alt me-1" style={{ color: 'var(--tp-gold)' }}></i>{servicio.origen}
                    </span>
                    <img 
                      src={servicio.imagen} 
                      className="w-100 h-100 object-fit-cover rounded-0" 
                      alt={servicio.titulo} 
                    />
                  </div>
                  
                  {/* Card Content */}
                  <div className="card-body d-flex flex-column p-4">
                    <h5 className="fw-bold mb-2 text-white text-uppercase" style={{ fontSize: '1.05rem', letterSpacing: '0.5px' }}>
                      {servicio.titulo}
                    </h5>
                    <p className="text-light mb-4 small opacity-75" style={{ lineHeight: '1.6' }}>
                      {servicio.descripcion}
                    </p>
                    
                    {/* Pricing Matrix */}
                    <div className="mt-auto">
                      <div className="mb-2 text-uppercase fw-bold" style={{ fontSize: '0.7rem', color: 'var(--tp-gold)', letterSpacing: '1px' }}>
                        Rates in USD per Vehicle
                      </div>
                      <table className="table table-dark table-bordered table-sm text-center mb-4 rounded-0" style={{ fontSize: '0.8rem', borderColor: '#333' }}>
                        <thead>
                          <tr>
                            <th className="fw-normal text-light bg-transparent opacity-75">Up to 2 Pax</th>
                            <th className="fw-normal text-light bg-transparent opacity-75">Up to 4 Pax</th>
                            <th className="fw-normal text-light bg-transparent opacity-75">Up to 10 Pax</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="fw-bold text-white bg-transparent">${servicio.precios.pax2}</td>
                            <td className="fw-bold text-white bg-transparent">${servicio.precios.pax4}</td>
                            <td className="fw-bold text-white bg-transparent">${servicio.precios.pax10}</td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Action Button */}
                      <button 
                        onClick={() => irAReservar(servicio)} 
                        className="btn w-100 fw-bold text-uppercase rounded-0 py-3" 
                        style={{ backgroundColor: 'var(--tp-gold)', color: '#000', letterSpacing: '1px', fontSize: '0.85rem' }}
                      >
                        <i className="bi bi-calendar-check me-2"></i> Request Booking
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-12 text-center py-5">
                <h4 className="text-light opacity-50 text-uppercase" style={{ letterSpacing: '1px' }}>
                  No services found matching your criteria.
                </h4>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Catalogo;
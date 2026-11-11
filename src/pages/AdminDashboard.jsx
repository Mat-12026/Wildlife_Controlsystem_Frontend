import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [vistaActiva, setVistaActiva] = useState('asignaciones');
  const [dataReservas, setDataReservas] = useState([]);
  const [dataVehiculos, setDataVehiculos] = useState([]);
  const [dataConductores, setDataConductores] = useState([]);
  const [dataAsignaciones, setDataAsignaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const operatorUser = localStorage.getItem('operator_user') || 'Operator';

  const handleLogout = () => {
    localStorage.removeItem('operator_user');
    navigate('/login');
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const headers = { 'ngrok-skip-browser-warning': 'true' };

        const [resReservas, resVehiculos, resConductores, resAsignaciones] = await Promise.all([
          fetch('https://both-smirk-entrust.ngrok-free.dev/api/dashboard/reservas/', { headers }),
          fetch('https://both-smirk-entrust.ngrok-free.dev/api/dashboard/vehiculos/', { headers }),
          fetch('https://both-smirk-entrust.ngrok-free.dev/api/dashboard/conductores/', { headers }),
          fetch('https://both-smirk-entrust.ngrok-free.dev/api/dashboard/asignaciones/', { headers })
        ]);

        if (resReservas.ok) setDataReservas(await resReservas.json());
        if (resVehiculos.ok) setDataVehiculos(await resVehiculos.json());
        if (resConductores.ok) setDataConductores(await resConductores.json());
        if (resAsignaciones.ok) setDataAsignaciones(await resAsignaciones.json());
      } catch (err) {
        console.error("Error fetching dashboard content from database:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const renderVista = () => {
    if (loading) {
      return (
        <div className="text-center py-5">
          <div className="spinner-border" role="status" style={{ color: 'var(--tp-gold)' }}></div>
          <p className="mt-3 text-light opacity-75 text-uppercase" style={{ letterSpacing: '1px' }}>
            Loading live operational data from PostgreSQL...
          </p>
        </div>
      );
    }

    switch(vistaActiva) {
      case 'reservas':
        return (
          <div>
            <h3 className="mb-4 fw-bold text-uppercase text-white" style={{ letterSpacing: '1px' }}>
              Client Bookings & Requests
            </h3>
            <div className="table-responsive">
              <table className="table table-dark table-bordered border-secondary rounded-0 align-middle">
                <thead>
                  <tr className="text-uppercase small" style={{ color: 'var(--tp-gold)' }}>
                    <th>ID</th>
                    <th>Client Name</th>
                    <th>Service</th>
                    <th>Travel Date</th>
                    <th>Pax</th>
                    <th>Total (USD)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dataReservas.length > 0 ? dataReservas.map(r => (
                    <tr key={r.id}>
                      <td className="fw-bold">#{r.id}</td>
                      <td>{r.cliente_detalles?.nombre || 'Direct Client'}</td>
                      <td>{r.tipo_servicio} - {r.destino}</td>
                      <td>{r.fecha_viaje}</td>
                      <td>{r.cantidad_pasajeros} Pax</td>
                      <td className="fw-bold">${r.costo_total}</td>
                      <td>
                        <span className="badge rounded-0 bg-success text-uppercase">
                          {r.estado_reserva}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="7" className="text-center py-4 opacity-50">No booking requests found in database.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'vehiculos':
        return (
          <div>
            <h3 className="mb-4 fw-bold text-uppercase text-white" style={{ letterSpacing: '1px' }}>
              Fleet Operations Management
            </h3>
            <div className="table-responsive">
              <table className="table table-dark table-bordered border-secondary rounded-0 align-middle">
                <thead>
                  <tr className="text-uppercase small" style={{ color: 'var(--tp-gold)' }}>
                    <th>License Plate</th>
                    <th>Vehicle Type</th>
                    <th>Capacity</th>
                    <th>Current Driver</th>
                    <th>Technical Inspection</th>
                  </tr>
                </thead>
                <tbody>
                  {dataVehiculos.length > 0 ? dataVehiculos.map(v => (
                    <tr key={v.id}>
                      <td className="fw-bold">{v.patente}</td>
                      <td>{v.tipo_vehiculo}</td>
                      <td>{v.capacidad_pax} Passengers</td>
                      <td>{v.conductor_nombre || 'Unassigned'}</td>
                      <td>{v.fecha_revision_tecnica}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan="5" className="text-center py-4 opacity-50">No fleet vehicles registered in database.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'conductores':
        return (
          <div>
            <h3 className="mb-4 fw-bold text-uppercase text-white" style={{ letterSpacing: '1px' }}>
              Driver Staff Directory
            </h3>
            <div className="table-responsive">
              <table className="table table-dark table-bordered border-secondary rounded-0 align-middle">
                <thead>
                  <tr className="text-uppercase small" style={{ color: 'var(--tp-gold)' }}>
                    <th>DNI / RUT</th>
                    <th>Full Name</th>
                    <th>Phone</th>
                    <th>License Expiry</th>
                    <th>Availability</th>
                  </tr>
                </thead>
                <tbody>
                  {dataConductores.length > 0 ? dataConductores.map(c => (
                    <tr key={c.id}>
                      <td>{c.rut_dni}</td>
                      <td className="fw-bold">{c.nombre}</td>
                      <td>{c.telefono}</td>
                      <td>{c.vencimiento_licencia}</td>
                      <td>
                        <span className={`badge rounded-0 text-uppercase ${c.disponibilidad === 'DISPONIBLE' ? 'bg-success' : 'bg-warning text-dark'}`}>
                          {c.disponibilidad}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="5" className="text-center py-4 opacity-50">No drivers registered in database.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'asignaciones':
      default:
        return (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="fw-bold text-uppercase text-white mb-0" style={{ letterSpacing: '1px' }}>
                Dispatch & Route Assignments
              </h3>
            </div>
            <div className="table-responsive">
              <table className="table table-dark table-bordered border-secondary rounded-0 align-middle">
                <thead>
                  <tr className="text-uppercase small" style={{ color: 'var(--tp-gold)' }}>
                    <th>Op ID</th>
                    <th>Booking Ref</th>
                    <th>Assigned Vehicle</th>
                    <th>Assigned Driver</th>
                    <th>Payment Balance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dataAsignaciones.length > 0 ? dataAsignaciones.map(a => (
                    <tr key={a.id}>
                      <td className="fw-bold">#OP-{a.id}</td>
                      <td>Reserva #{a.solicitud}</td>
                      <td>{a.vehiculo_patente || 'Pending Vehicle'}</td>
                      <td>{a.conductor_nombre || 'Pending Driver'}</td>
                      <td>
                        <span className="badge rounded-0 bg-warning text-dark text-uppercase">
                          {a.estado_pago_90}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="5" className="text-center py-4 opacity-50">No operational assignments dispatched.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#121212' }}>
      {/* Sidebar */}
      <div className="d-flex flex-column p-4 border-end border-secondary" style={{ width: '280px', backgroundColor: '#0a0a0a' }}>
        <a href="/" className="d-flex align-items-center mb-4 text-white text-decoration-none">
          <span className="fs-5 fw-bold text-uppercase" style={{ color: 'var(--tp-gold)', letterSpacing: '2px' }}>
            Wildlife Admin
          </span>
        </a>

        <div className="mb-4 p-3 bg-dark border border-secondary rounded-0">
          <small className="text-uppercase opacity-75 d-block" style={{ fontSize: '0.65rem', color: 'var(--tp-gold)', letterSpacing: '1px' }}>
            Logged In As
          </small>
          <span className="fw-bold text-white small">{operatorUser}</span>
        </div>

        <ul className="nav nav-pills flex-column mb-auto">
          <li className="nav-item mb-2">
            <button 
              onClick={() => setVistaActiva('asignaciones')} 
              className={`nav-link w-100 text-start rounded-0 text-uppercase fw-bold py-3 ${vistaActiva === 'asignaciones' ? 'bg-gold text-dark' : 'text-white'}`}
              style={{ 
                backgroundColor: vistaActiva === 'asignaciones' ? 'var(--tp-gold)' : 'transparent',
                letterSpacing: '1px',
                fontSize: '0.85rem'
              }}
            >
              <i className="bi bi-calendar-check me-3"></i> Dispatch
            </button>
          </li>
          <li className="nav-item mb-2">
            <button 
              onClick={() => setVistaActiva('reservas')} 
              className={`nav-link w-100 text-start rounded-0 text-uppercase fw-bold py-3 ${vistaActiva === 'reservas' ? 'bg-gold text-dark' : 'text-white'}`}
              style={{ 
                backgroundColor: vistaActiva === 'reservas' ? 'var(--tp-gold)' : 'transparent',
                letterSpacing: '1px',
                fontSize: '0.85rem'
              }}
            >
              <i className="bi bi-journal-text me-3"></i> Bookings
            </button>
          </li>
          <li className="nav-item mb-2">
            <button 
              onClick={() => setVistaActiva('vehiculos')} 
              className={`nav-link w-100 text-start rounded-0 text-uppercase fw-bold py-3 ${vistaActiva === 'vehiculos' ? 'bg-gold text-dark' : 'text-white'}`}
              style={{ 
                backgroundColor: vistaActiva === 'vehiculos' ? 'var(--tp-gold)' : 'transparent',
                letterSpacing: '1px',
                fontSize: '0.85rem'
              }}
            >
              <i className="bi bi-truck me-3"></i> Fleet
            </button>
          </li>
          <li className="nav-item mb-2">
            <button 
              onClick={() => setVistaActiva('conductores')} 
              className={`nav-link w-100 text-start rounded-0 text-uppercase fw-bold py-3 ${vistaActiva === 'conductores' ? 'bg-gold text-dark' : 'text-white'}`}
              style={{ 
                backgroundColor: vistaActiva === 'conductores' ? 'var(--tp-gold)' : 'transparent',
                letterSpacing: '1px',
                fontSize: '0.85rem'
              }}
            >
              <i className="bi bi-person-badge me-3"></i> Drivers
            </button>
          </li>
        </ul>

        <hr className="border-secondary" />

        <button 
          onClick={handleLogout} 
          className="btn btn-outline-danger w-100 rounded-0 text-uppercase fw-bold py-2"
          style={{ letterSpacing: '1px', fontSize: '0.8rem' }}
        >
          <i className="bi bi-box-arrow-right me-2"></i> Log Out
        </button>
      </div>

      {/* Main Panel Content */}
      <div className="flex-grow-1 p-5 text-light">
        {renderVista()}
      </div>
    </div>
  );
};

export default AdminDashboard;
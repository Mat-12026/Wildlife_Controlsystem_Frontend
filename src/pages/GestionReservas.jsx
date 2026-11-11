import React, { useState } from 'react';

export default function GestionReservas() {
  // Estado inicial simulando la Base de Datos
  const [reservas, setReservas] = useState([
    { id: 101, cliente: 'Juan Pérez', tour: 'Torres del Paine', fecha: '2026-11-15', estado: 'Abonada' },
    { id: 102, cliente: 'Agencia Latam', tour: 'Cueva del Milodón', fecha: '2026-11-18', estado: 'Confirmada' }
  ]);

  const [nuevaReserva, setNuevaReserva] = useState({ cliente: '', tour: '', fecha: '', estado: 'Pendiente' });

  // Función Crear (C de CRUD)
  const handleCrear = (e) => {
    e.preventDefault();
    const idGenerado = Math.floor(Math.random() * 1000) + 200;
    setReservas([...reservas, { id: idGenerado, ...nuevaReserva }]);
    setNuevaReserva({ cliente: '', tour: '', fecha: '', estado: 'Pendiente' });
  };

  // Función Borrar (D de CRUD)
  const handleBorrar = (id) => {
    setReservas(reservas.filter(r => r.id !== id));
  };

  return (
    <div className="container py-5">
      <h2 className="mb-4" style={{ color: 'var(--tp-green)' }}>Gestión de Reservas (Operador)</h2>
      
      {/* Formulario de Creación */}
      <div className="card shadow-sm border-0 mb-4 rounded-3">
        <div className="card-body p-4">
          <form onSubmit={handleCrear} className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label">Cliente / Agencia</label>
              <input type="text" className="form-control" required 
                value={nuevaReserva.cliente} onChange={e => setNuevaReserva({...nuevaReserva, cliente: e.target.value})} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Servicio</label>
              <input type="text" className="form-control" required 
                value={nuevaReserva.tour} onChange={e => setNuevaReserva({...nuevaReserva, tour: e.target.value})} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Fecha</label>
              <input type="date" className="form-control" required 
                value={nuevaReserva.fecha} onChange={e => setNuevaReserva({...nuevaReserva, fecha: e.target.value})} />
            </div>
            <div className="col-md-3">
              <button type="submit" className="btn btn-success w-100 bg-tp-green">Registrar Reserva</button>
            </div>
          </form>
        </div>
      </div>

      {/* Tabla de Lectura y Borrado */}
      <div className="card shadow-sm border-0 rounded-3 overflow-hidden">
        <table className="table table-hover mb-0">
          <thead className="bg-light">
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Servicio</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reservas.map(r => (
              <tr key={r.id}>
                <td>#{r.id}</td>
                <td className="fw-bold">{r.cliente}</td>
                <td>{r.tour}</td>
                <td>{r.fecha}</td>
                <td>
                  <span className={`badge ${r.estado === 'Confirmada' ? 'bg-success' : 'bg-warning text-dark'}`}>
                    {r.estado}
                  </span>
                </td>
                <td>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleBorrar(r.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
            {reservas.length === 0 && (
              <tr><td colSpan="6" className="text-center py-3 text-muted">No hay reservas registradas.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const RAW_API = (import.meta.env.VITE_API_URL || 'https://wildlife-controlsystem-backend.onrender.com/api').replace(/\/+$/, '');
const API_BASE = RAW_API.endsWith('/api') ? RAW_API : `${RAW_API}/api`;

const AdminDashboard = () => {
  const [vistaActiva, setVistaActiva] = useState('asignaciones');
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorConexion, setErrorConexion] = useState('');

  // Datos desde PostgreSQL
  const [asignaciones, setAsignaciones] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [tarifas, setTarifas] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);

  // Estado del formulario CRUD dinámico (Crear / Editar)
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({});

  const navigate = useNavigate();
  const operatorUser = localStorage.getItem('operator_user') || 'Usuario';
  const storedRole = localStorage.getItem('operator_role');
  const role = storedRole || (operatorUser.toLowerCase() === 'admin' ? 'admin' : 'operator');
  const isAdmin = role === 'admin';

  // Matriz de permisos: Admin todo; Operador solo Clientes, Reservas y Despacho
  const puedeEditarTabla = (tabla) => {
    if (isAdmin) return true;
    return ['clientes', 'reservas', 'asignaciones'].includes(tabla);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const cargarTodo = async () => {
    setLoading(true);
    setErrorConexion('');
    try {
      const [rAsig, rRes, rCli, rTar, rVeh, rCond, rNotif] = await Promise.all([
        fetch(`${API_BASE}/manage/asignaciones/`),
        fetch(`${API_BASE}/manage/reservas/`),
        fetch(`${API_BASE}/manage/clientes/`),
        fetch(`${API_BASE}/manage/tarifas/`),
        fetch(`${API_BASE}/manage/vehiculos/`),
        fetch(`${API_BASE}/manage/conductores/`),
        fetch(`${API_BASE}/dashboard/notificaciones/`)
      ]);

      if (!rAsig.ok && !rRes.ok && !rCli.ok) {
        throw new Error(`El servidor respondió con estado ${rRes.status}`);
      }

      if (rAsig.ok) setAsignaciones(await rAsig.json());
      if (rRes.ok) setReservas(await rRes.json());
      if (rCli.ok) setClientes(await rCli.json());
      if (rTar.ok) setTarifas(await rTar.json());
      if (rVeh.ok) setVehiculos(await rVeh.json());
      if (rCond.ok) setConductores(await rCond.json());
      if (rNotif.ok) setNotificaciones(await rNotif.json());
    } catch (err) {
      console.error('Error cargando datos desde PostgreSQL:', err);
      setErrorConexion('No se pudieron cargar los datos desde el servidor. Verifica que Render esté activo e intenta recargar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTodo();
  }, []);

  const cambiarTab = (nuevaVista) => {
    setVistaActiva(nuevaVista);
    setBusqueda('');
    setMostrarForm(false);
    setEditId(null);
    setFormData({});
  };

  // --- OPERACIONES CRUD GENÉRICAS ---
  const abrirCrear = (valoresIniciales = {}) => {
    setEditId(null);
    setFormData(valoresIniciales);
    setMostrarForm(true);
  };

  const abrirEditar = (item) => {
    setEditId(item.id);
    setFormData({ ...item });
    setMostrarForm(true);
  };

  const guardarRegistro = async (e, endpoint) => {
    e.preventDefault();
    const url = editId ? `${API_BASE}/manage/${endpoint}/${editId}/` : `${API_BASE}/manage/${endpoint}/`;
    const method = editId ? 'PATCH' : 'POST';

    // Limpiar campos de solo lectura y convertir cadenas vacías en null para evitar errores 400 en DRF
    const payload = { ...formData };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;
    delete payload.monto_abono_10;
    delete payload.saldo_pendiente_90;
    delete payload.cliente_detalles;
    delete payload.solicitud_detalles;
    delete payload.conductor_nombre;
    delete payload.vehiculo_patente;
    delete payload.foto_documento;

    const camposNulables = [
      'pax_2', 'pax_4', 'pax_10', 'pax_19', 'pax_24', 'pax_46',
      'fecha_soap', 'fecha_permiso_circulacion', 'conductor_actual',
      'dieta', 'imagen', 'descripcion'
    ];
    camposNulables.forEach((campo) => {
      if (payload[campo] === '') {
        payload[campo] = null;
      }
    });

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setMostrarForm(false);
        setEditId(null);
        setFormData({});
        cargarTodo();
      } else {
        const err = await res.json();
        alert('Error de validación: ' + JSON.stringify(err));
      }
    } catch (error) {
      console.error('Error guardando registro:', error);
      alert('Error de conexión con el servidor al guardar.');
    }
  };

  const eliminarRegistro = async (endpoint, id) => {
    if (!window.confirm(`¿Estás seguro de eliminar el registro #${id} de PostgreSQL?`)) return;
    try {
      const res = await fetch(`${API_BASE}/manage/${endpoint}/${id}/`, {
        method: 'DELETE'
      });
      if (res.ok) cargarTodo();
    } catch (error) {
      console.error('Error eliminando registro:', error);
    }
  };

  const actualizarAsignacionRapida = async (opId, campo, valor) => {
    try {
      const res = await fetch(`${API_BASE}/manage/asignaciones/${opId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ [campo]: valor || null })
      });
      if (res.ok) cargarTodo();
    } catch (error) {
      console.error('Error actualizando despacho:', error);
    }
  };

  // --- RENDERIZADO DE FORMULARIOS CRUD ---
  const renderFormularioCRUD = () => {
    if (!mostrarForm || !puedeEditarTabla(vistaActiva)) return null;

    return (
      <div className="p-4 mb-4 border border-warning rounded-0 shadow" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-secondary">
          <h5 className="mb-0 text-uppercase fw-bold" style={{ color: 'var(--tp-gold)', letterSpacing: '1px' }}>
            {editId ? `Editar Registro #${editId}` : 'Nuevo Registro en PostgreSQL'}
          </h5>
          <button type="button" className="btn btn-sm btn-outline-secondary rounded-0" onClick={() => setMostrarForm(false)}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* FORMULARIO CLIENTES */}
        {vistaActiva === 'clientes' && (
          <form onSubmit={(e) => guardarRegistro(e, 'clientes')}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="small text-uppercase text-light opacity-75">Nombre Completo</label>
                <input type="text" className="form-control bg-black text-white border-secondary rounded-0" value={formData.nombre || ''} onChange={e => setFormData({ ...formData, nombre: e.target.value })} required />
              </div>
              <div className="col-md-4">
                <label className="small text-uppercase text-light opacity-75">Correo Electrónico</label>
                <input type="email" className="form-control bg-black text-white border-secondary rounded-0" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
              </div>
              <div className="col-md-4">
                <label className="small text-uppercase text-light opacity-75">Teléfono</label>
                <input type="text" className="form-control bg-black text-white border-secondary rounded-0" value={formData.telefono || ''} onChange={e => setFormData({ ...formData, telefono: e.target.value })} required />
              </div>
              <div className="col-md-3">
                <label className="small text-uppercase text-light opacity-75">Nacionalidad</label>
                <input type="text" className="form-control bg-black text-white border-secondary rounded-0" value={formData.nacionalidad || ''} onChange={e => setFormData({ ...formData, nacionalidad: e.target.value })} required />
              </div>
              <div className="col-md-3">
                <label className="small text-uppercase text-light opacity-75">Edad</label>
                <input type="number" className="form-control bg-black text-white border-secondary rounded-0" value={formData.edad || ''} onChange={e => setFormData({ ...formData, edad: e.target.value })} required />
              </div>
              <div className="col-md-3">
                <label className="small text-uppercase text-light opacity-75">Origen</label>
                <select className="form-select bg-black text-white border-secondary rounded-0" value={formData.origen || 'Directo'} onChange={e => setFormData({ ...formData, origen: e.target.value })}>
                  <option value="Directo">Directo</option>
                  <option value="Agencia">Agencia</option>
                  <option value="Empresa">Empresa</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="small text-uppercase text-light opacity-75">Dieta / Alergias</label>
                <input type="text" className="form-control bg-black text-white border-secondary rounded-0" value={formData.dieta || ''} onChange={e => setFormData({ ...formData, dieta: e.target.value })} />
              </div>
            </div>
            <button type="submit" className="btn rounded-0 fw-bold text-uppercase mt-3 px-4" style={{ backgroundColor: 'var(--tp-gold)', color: '#000' }}>
              Guardar Cliente
            </button>
          </form>
        )}

        {/* FORMULARIO RESERVAS */}
        {vistaActiva === 'reservas' && (
          <form onSubmit={(e) => guardarRegistro(e, 'reservas')}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="small text-uppercase text-light opacity-75">Cliente Titular</label>
                <select className="form-select bg-black text-white border-secondary rounded-0" value={formData.cliente || ''} onChange={e => setFormData({ ...formData, cliente: e.target.value })} required>
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.email})</option>)}
                </select>
              </div>
              <div className="col-md-4">
                <label className="small text-uppercase text-light opacity-75">Fecha de Viaje</label>
                <input type="date" className="form-control bg-black text-white border-secondary rounded-0" value={formData.fecha_viaje || ''} onChange={e => setFormData({ ...formData, fecha_viaje: e.target.value })} required />
              </div>
              <div className="col-md-4">
                <label className="small text-uppercase text-light opacity-75">Punto Pick-up</label>
                <input type="text" className="form-control bg-black text-white border-secondary rounded-0" value={formData.punto_pickup || ''} onChange={e => setFormData({ ...formData, punto_pickup: e.target.value })} required />
              </div>
              <div className="col-md-4">
                <label className="small text-uppercase text-light opacity-75">Servicio / Destino</label>
                <input type="text" className="form-control bg-black text-white border-secondary rounded-0" value={formData.destino || ''} onChange={e => setFormData({ ...formData, destino: e.target.value })} required />
              </div>
              <div className="col-md-2">
                <label className="small text-uppercase text-light opacity-75">Tipo</label>
                <input type="text" className="form-control bg-black text-white border-secondary rounded-0" placeholder="Transfer / Tour" value={formData.tipo_servicio || 'Transfer'} onChange={e => setFormData({ ...formData, tipo_servicio: e.target.value })} required />
              </div>
              <div className="col-md-2">
                <label className="small text-uppercase text-light opacity-75">Pasajeros</label>
                <input type="number" className="form-control bg-black text-white border-secondary rounded-0" value={formData.cantidad_pasajeros || 1} onChange={e => setFormData({ ...formData, cantidad_pasajeros: e.target.value })} required />
              </div>
              <div className="col-md-2">
                <label className="small text-uppercase text-light opacity-75">Costo Total (USD)</label>
                <input type="number" step="0.01" className="form-control bg-black text-white border-secondary rounded-0" value={formData.costo_total || 0} onChange={e => setFormData({ ...formData, costo_total: e.target.value })} required />
              </div>
              <div className="col-md-2">
                <label className="small text-uppercase text-light opacity-75">Estado</label>
                <select className="form-select bg-black text-white border-secondary rounded-0" value={formData.estado_reserva || 'RESERVADO'} onChange={e => setFormData({ ...formData, estado_reserva: e.target.value })}>
                  <option value="RESERVADO">Reservado</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn rounded-0 fw-bold text-uppercase mt-3 px-4" style={{ backgroundColor: 'var(--tp-gold)', color: '#000' }}>
              Guardar Reserva
            </button>
          </form>
        )}

        {/* FORMULARIO TARIFAS (SOLO ADMIN) */}
        {vistaActiva === 'tarifas' && isAdmin && (
          <form onSubmit={(e) => guardarRegistro(e, 'tarifas')}>
            <div className="row g-3">
              <div className="col-md-5">
                <label className="small text-uppercase text-light opacity-75">Nombre del Servicio</label>
                <input type="text" className="form-control bg-black text-white border-secondary rounded-0" value={formData.servicio || ''} onChange={e => setFormData({ ...formData, servicio: e.target.value })} required />
              </div>
              <div className="col-md-3">
                <label className="small text-uppercase text-light opacity-75">Categoría</label>
                <select className="form-select bg-black text-white border-secondary rounded-0" value={formData.categoria || 'TRASLADO'} onChange={e => setFormData({ ...formData, categoria: e.target.value })}>
                  <option value="TRASLADO">Traslado</option>
                  <option value="EXCURSION">Excursión</option>
                  <option value="HOTEL">Hotel / Estancia</option>
                  <option value="CHALTEN">Chaltén</option>
                  <option value="CHILE">Chile</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="small text-uppercase text-light opacity-75">Origen</label>
                <input type="text" className="form-control bg-black text-white border-secondary rounded-0" value={formData.origen || 'El Calafate'} onChange={e => setFormData({ ...formData, origen: e.target.value })} required />
              </div>
              <div className="col-md-2">
                <label className="small text-uppercase text-light opacity-75">USD 2 Pax</label>
                <input type="number" step="0.01" className="form-control bg-black text-white border-secondary rounded-0" value={formData.pax_2 || ''} onChange={e => setFormData({ ...formData, pax_2: e.target.value })} />
              </div>
              <div className="col-md-2">
                <label className="small text-uppercase text-light opacity-75">USD 4 Pax</label>
                <input type="number" step="0.01" className="form-control bg-black text-white border-secondary rounded-0" value={formData.pax_4 || ''} onChange={e => setFormData({ ...formData, pax_4: e.target.value })} />
              </div>
              <div className="col-md-2">
                <label className="small text-uppercase text-light opacity-75">USD 10 Pax</label>
                <input type="number" step="0.01" className="form-control bg-black text-white border-secondary rounded-0" value={formData.pax_10 || ''} onChange={e => setFormData({ ...formData, pax_10: e.target.value })} />
              </div>
              <div className="col-md-6">
                <label className="small text-uppercase text-light opacity-75">URL Imagen</label>
                <input type="url" className="form-control bg-black text-white border-secondary rounded-0" value={formData.imagen || ''} onChange={e => setFormData({ ...formData, imagen: e.target.value })} />
              </div>
              <div className="col-12">
                <label className="small text-uppercase text-light opacity-75">Descripción</label>
                <input type="text" className="form-control bg-black text-white border-secondary rounded-0" value={formData.descripcion || ''} onChange={e => setFormData({ ...formData, descripcion: e.target.value })} />
              </div>
            </div>
            <button type="submit" className="btn rounded-0 fw-bold text-uppercase mt-3 px-4" style={{ backgroundColor: 'var(--tp-gold)', color: '#000' }}>
              Guardar Tarifa
            </button>
          </form>
        )}

        {/* FORMULARIO VEHÍCULOS (SOLO ADMIN) */}
        {vistaActiva === 'vehiculos' && isAdmin && (
          <form onSubmit={(e) => guardarRegistro(e, 'vehiculos')}>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="small text-uppercase text-light opacity-75">Patente</label>
                <input type="text" className="form-control bg-black text-white border-secondary rounded-0" value={formData.patente || ''} onChange={e => setFormData({ ...formData, patente: e.target.value })} required />
              </div>
              <div className="col-md-4">
                <label className="small text-uppercase text-light opacity-75">Tipo de Vehículo</label>
                <select className="form-select bg-black text-white border-secondary rounded-0" value={formData.tipo_vehiculo || 'VAN'} onChange={e => setFormData({ ...formData, tipo_vehiculo: e.target.value })}>
                  <option value="AUTO">Automóvil / SUV (H/2 Pax)</option>
                  <option value="VAN">Van Corta (H/4 Pax)</option>
                  <option value="MINIVAN">Minivan (H/10 Pax)</option>
                  <option value="MINIBUS_19">Minibús (H/19 Pax)</option>
                  <option value="MINIBUS_24">Minibús (H/24 Pax)</option>
                  <option value="BUS_46">Bus (H/46 Pax)</option>
                </select>
              </div>
              <div className="col-md-2">
                <label className="small text-uppercase text-light opacity-75">Capacidad Pax</label>
                <input type="number" className="form-control bg-black text-white border-secondary rounded-0" value={formData.capacidad_pax || 4} onChange={e => setFormData({ ...formData, capacidad_pax: e.target.value })} required />
              </div>
              <div className="col-md-3">
                <label className="small text-uppercase text-light opacity-75">Chofer Asignado</label>
                <select className="form-select bg-black text-white border-secondary rounded-0" value={formData.conductor_actual || ''} onChange={e => setFormData({ ...formData, conductor_actual: e.target.value || null })}>
                  <option value="">Sin asignar</option>
                  {conductores.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="col-md-4">
                <label className="small text-uppercase text-light opacity-75">Venc. Revisión Técnica</label>
                <input type="date" className="form-control bg-black text-white border-secondary rounded-0" value={formData.fecha_revision_tecnica || ''} onChange={e => setFormData({ ...formData, fecha_revision_tecnica: e.target.value })} required />
              </div>
              <div className="col-md-4">
                <label className="small text-uppercase text-light opacity-75">Venc. SOAP</label>
                <input type="date" className="form-control bg-black text-white border-secondary rounded-0" value={formData.fecha_soap || ''} onChange={e => setFormData({ ...formData, fecha_soap: e.target.value })} />
              </div>
              <div className="col-md-4">
                <label className="small text-uppercase text-light opacity-75">Venc. Permiso Circulación</label>
                <input type="date" className="form-control bg-black text-white border-secondary rounded-0" value={formData.fecha_permiso_circulacion || ''} onChange={e => setFormData({ ...formData, fecha_permiso_circulacion: e.target.value })} />
              </div>
            </div>
            <button type="submit" className="btn rounded-0 fw-bold text-uppercase mt-3 px-4" style={{ backgroundColor: 'var(--tp-gold)', color: '#000' }}>
              Guardar Vehículo
            </button>
          </form>
        )}

        {/* FORMULARIO CONDUCTORES (SOLO ADMIN) */}
        {vistaActiva === 'conductores' && isAdmin && (
          <form onSubmit={(e) => guardarRegistro(e, 'conductores')}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="small text-uppercase text-light opacity-75">Nombre Completo</label>
                <input type="text" className="form-control bg-black text-white border-secondary rounded-0" value={formData.nombre || ''} onChange={e => setFormData({ ...formData, nombre: e.target.value })} required />
              </div>
              <div className="col-md-3">
                <label className="small text-uppercase text-light opacity-75">RUT / DNI</label>
                <input type="text" className="form-control bg-black text-white border-secondary rounded-0" value={formData.rut_dni || ''} onChange={e => setFormData({ ...formData, rut_dni: e.target.value })} required />
              </div>
              <div className="col-md-3">
                <label className="small text-uppercase text-light opacity-75">Teléfono</label>
                <input type="text" className="form-control bg-black text-white border-secondary rounded-0" value={formData.telefono || ''} onChange={e => setFormData({ ...formData, telefono: e.target.value })} required />
              </div>
              <div className="col-md-2">
                <label className="small text-uppercase text-light opacity-75">Disponibilidad</label>
                <select className="form-select bg-black text-white border-secondary rounded-0" value={formData.disponibilidad || 'DISPONIBLE'} onChange={e => setFormData({ ...formData, disponibilidad: e.target.value })}>
                  <option value="DISPONIBLE">Disponible</option>
                  <option value="EN_RUTA">En Ruta</option>
                  <option value="LICENCIA">De Licencia</option>
                  <option value="NO_DISPONIBLE">No Disponible</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="small text-uppercase text-light opacity-75">Vencimiento Licencia</label>
                <input type="date" className="form-control bg-black text-white border-secondary rounded-0" value={formData.vencimiento_licencia || ''} onChange={e => setFormData({ ...formData, vencimiento_licencia: e.target.value })} required />
              </div>
            </div>
            <button type="submit" className="btn rounded-0 fw-bold text-uppercase mt-3 px-4" style={{ backgroundColor: 'var(--tp-gold)', color: '#000' }}>
              Guardar Conductor
            </button>
          </form>
        )}
      </div>
    );
  };

  // --- RENDERIZADO DE TABLAS ---
  const renderContenidoTabla = () => {
    if (loading) {
      return (
        <div className="text-center py-5">
          <div className="spinner-border" role="status" style={{ color: 'var(--tp-gold)' }}></div>
          <p className="mt-3 text-light opacity-75 text-uppercase" style={{ letterSpacing: '1px' }}>Sincronizando con PostgreSQL...</p>
        </div>
      );
    }

    const q = busqueda.toLowerCase();

    switch (vistaActiva) {
      case 'notificaciones':
        return (
          <div className="p-3 row g-3">
            {notificaciones.length > 0 ? notificaciones.map((n, idx) => (
              <div key={idx} className="col-12">
                <div className={`p-3 border rounded-0 bg-dark d-flex align-items-center justify-content-between border-${n.tipo}`}>
                  <div className="d-flex align-items-center">
                    <i className={`bi bi-exclamation-triangle-fill fs-3 me-3 text-${n.tipo}`}></i>
                    <div>
                      <span className={`badge rounded-0 bg-${n.tipo} text-uppercase mb-1`}>{n.categoria}</span>
                      <h6 className="mb-1 fw-bold text-white">{n.titulo}</h6>
                      <p className="mb-0 small text-light opacity-75">{n.mensaje}</p>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-12 text-center py-5 text-muted">No hay alertas activas en este momento.</div>
            )}
          </div>
        );

      case 'asignaciones': {
        const asigFiltradas = asignaciones.filter(a =>
          `#${a.solicitud}`.includes(q) ||
          (a.vehiculo_patente || '').toLowerCase().includes(q) ||
          (a.conductor_nombre || '').toLowerCase().includes(q)
        );
        return (
          <div className="table-responsive">
            <table className="table table-dark table-hover table-bordered border-secondary rounded-0 align-middle mb-0">
              <thead style={{ backgroundColor: '#0a0a0a' }}>
                <tr className="text-uppercase small" style={{ color: 'var(--tp-gold)', letterSpacing: '1px' }}>
                  <th>Op ID</th>
                  <th>Reserva Ref.</th>
                  <th>Destino / Fecha</th>
                  <th>Vehículo Asignado</th>
                  <th>Conductor Asignado</th>
                  <th>Pago Saldo (90%)</th>
                </tr>
              </thead>
              <tbody>
                {asigFiltradas.length > 0 ? asigFiltradas.map(a => (
                  <tr key={a.id}>
                    <td className="fw-bold">#OP-{a.id}</td>
                    <td>Reserva #{a.solicitud}</td>
                    <td className="small">
                      <span className="d-block text-white fw-semibold">{a.solicitud_detalles?.destino || 'Servicio'}</span>
                      <span className="text-muted">{a.solicitud_detalles?.fecha_viaje}</span>
                    </td>
                    <td>
                      <select
                        className="form-select form-select-sm bg-black text-white border-secondary rounded-0"
                        value={a.vehiculo || ''}
                        onChange={(e) => actualizarAsignacionRapida(a.id, 'vehiculo', e.target.value)}
                      >
                        <option value="">-- Sin Vehículo --</option>
                        {vehiculos.map(v => <option key={v.id} value={v.id}>{v.patente} ({v.tipo_vehiculo})</option>)}
                      </select>
                    </td>
                    <td>
                      <select
                        className="form-select form-select-sm bg-black text-white border-secondary rounded-0"
                        value={a.conductor || ''}
                        onChange={(e) => actualizarAsignacionRapida(a.id, 'conductor', e.target.value)}
                      >
                        <option value="">-- Sin Chofer --</option>
                        {conductores.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                      </select>
                    </td>
                    <td>
                      <select
                        className={`form-select form-select-sm rounded-0 fw-bold ${a.estado_pago_90 === 'PAGADO' ? 'bg-success text-white border-success' : 'bg-black text-warning border-warning'}`}
                        value={a.estado_pago_90}
                        onChange={(e) => actualizarAsignacionRapida(a.id, 'estado_pago_90', e.target.value)}
                      >
                        <option value="EN_ESPERA">EN ESPERA (90%)</option>
                        <option value="PAGADO">PAGADO (100%)</option>
                      </select>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="6" className="text-center py-4 opacity-50">No hay asignaciones operativas registradas.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        );
      }

      case 'reservas': {
        const resFiltradas = reservas.filter(r =>
          (r.cliente_detalles?.nombre || '').toLowerCase().includes(q) ||
          (r.destino || '').toLowerCase().includes(q)
        );
        return (
          <div className="table-responsive">
            <table className="table table-dark table-hover table-bordered border-secondary rounded-0 align-middle mb-0">
              <thead style={{ backgroundColor: '#0a0a0a' }}>
                <tr className="text-uppercase small" style={{ color: 'var(--tp-gold)', letterSpacing: '1px' }}>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Servicio / Destino</th>
                  <th>Fecha Viaje</th>
                  <th>Pax</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {resFiltradas.length > 0 ? resFiltradas.map(r => (
                  <tr key={r.id}>
                    <td className="fw-bold">#{r.id}</td>
                    <td>{r.cliente_detalles?.nombre || `Cliente #${r.cliente}`}</td>
                    <td>{r.tipo_servicio} - {r.destino}</td>
                    <td>{r.fecha_viaje}</td>
                    <td>{r.cantidad_pasajeros}</td>
                    <td className="fw-bold">${r.costo_total}</td>
                    <td>
                      <span className={`badge rounded-0 ${r.estado_reserva === 'RESERVADO' ? 'bg-success' : 'bg-danger'}`}>
                        {r.estado_reserva}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-outline-warning rounded-0 me-1" onClick={() => abrirEditar(r)} title="Editar">
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-danger rounded-0" onClick={() => eliminarRegistro('reservas', r.id)} title="Eliminar">
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="8" className="text-center py-4 opacity-50">No hay reservas registradas.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        );
      }

      case 'clientes': {
        const cliFiltrados = clientes.filter(c =>
          (c.nombre || '').toLowerCase().includes(q) ||
          (c.email || '').toLowerCase().includes(q) ||
          (c.nacionalidad || '').toLowerCase().includes(q)
        );
        return (
          <div className="table-responsive">
            <table className="table table-dark table-hover table-bordered border-secondary rounded-0 align-middle mb-0">
              <thead style={{ backgroundColor: '#0a0a0a' }}>
                <tr className="text-uppercase small" style={{ color: 'var(--tp-gold)', letterSpacing: '1px' }}>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Email / Teléfono</th>
                  <th>Nacionalidad</th>
                  <th>Edad</th>
                  <th>Origen</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cliFiltrados.length > 0 ? cliFiltrados.map(c => (
                  <tr key={c.id}>
                    <td className="fw-bold">#{c.id}</td>
                    <td className="fw-semibold text-white">{c.nombre}</td>
                    <td className="small">
                      <span className="d-block">{c.email}</span>
                      <span className="text-muted">{c.telefono}</span>
                    </td>
                    <td>{c.nacionalidad}</td>
                    <td>{c.edad}</td>
                    <td><span className="badge bg-secondary rounded-0">{c.origen}</span></td>
                    <td>
                      <button className="btn btn-sm btn-outline-warning rounded-0 me-1" onClick={() => abrirEditar(c)} title="Editar">
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-danger rounded-0" onClick={() => eliminarRegistro('clientes', c.id)} title="Eliminar">
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="7" className="text-center py-4 opacity-50">No hay clientes registrados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        );
      }

      case 'tarifas': {
        const tarFiltradas = tarifas.filter(t =>
          (t.servicio || '').toLowerCase().includes(q) ||
          (t.origen || '').toLowerCase().includes(q)
        );
        return (
          <div className="table-responsive">
            <table className="table table-dark table-hover table-bordered border-secondary rounded-0 align-middle mb-0">
              <thead style={{ backgroundColor: '#0a0a0a' }}>
                <tr className="text-uppercase small" style={{ color: 'var(--tp-gold)', letterSpacing: '1px' }}>
                  <th>ID</th>
                  <th>Servicio</th>
                  <th>Categoría</th>
                  <th>Origen</th>
                  <th>2 Pax</th>
                  <th>4 Pax</th>
                  <th>10 Pax</th>
                  {isAdmin && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {tarFiltradas.length > 0 ? tarFiltradas.map(t => (
                  <tr key={t.id}>
                    <td className="fw-bold">#{t.id}</td>
                    <td className="fw-semibold text-white">{t.servicio}</td>
                    <td><span className="badge bg-dark border border-secondary rounded-0">{t.categoria}</span></td>
                    <td>{t.origen}</td>
                    <td>{t.pax_2 ? `$${t.pax_2}` : '-'}</td>
                    <td>{t.pax_4 ? `$${t.pax_4}` : '-'}</td>
                    <td>{t.pax_10 ? `$${t.pax_10}` : '-'}</td>
                    {isAdmin && (
                      <td>
                        <button className="btn btn-sm btn-outline-warning rounded-0 me-1" onClick={() => abrirEditar(t)}><i className="bi bi-pencil"></i></button>
                        <button className="btn btn-sm btn-outline-danger rounded-0" onClick={() => eliminarRegistro('tarifas', t.id)}><i className="bi bi-trash"></i></button>
                      </td>
                    )}
                  </tr>
                )) : (
                  <tr><td colSpan={isAdmin ? 8 : 7} className="text-center py-4 opacity-50">No hay tarifas registradas.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        );
      }

      case 'vehiculos': {
        const vehFiltrados = vehiculos.filter(v =>
          (v.patente || '').toLowerCase().includes(q) ||
          (v.tipo_vehiculo || '').toLowerCase().includes(q)
        );
        return (
          <div className="table-responsive">
            <table className="table table-dark table-hover table-bordered border-secondary rounded-0 align-middle mb-0">
              <thead style={{ backgroundColor: '#0a0a0a' }}>
                <tr className="text-uppercase small" style={{ color: 'var(--tp-gold)', letterSpacing: '1px' }}>
                  <th>Patente</th>
                  <th>Tipo</th>
                  <th>Capacidad</th>
                  <th>Rev. Técnica</th>
                  <th>SOAP</th>
                  <th>Permiso Circulación</th>
                  {isAdmin && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {vehFiltrados.length > 0 ? vehFiltrados.map(v => (
                  <tr key={v.id}>
                    <td className="fw-bold text-white">{v.patente}</td>
                    <td>{v.tipo_vehiculo}</td>
                    <td>{v.capacidad_pax} Pax</td>
                    <td>{v.fecha_revision_tecnica}</td>
                    <td>{v.fecha_soap || 'N/R'}</td>
                    <td>{v.fecha_permiso_circulacion || 'N/R'}</td>
                    {isAdmin && (
                      <td>
                        <button className="btn btn-sm btn-outline-warning rounded-0 me-1" onClick={() => abrirEditar(v)}><i className="bi bi-pencil"></i></button>
                        <button className="btn btn-sm btn-outline-danger rounded-0" onClick={() => eliminarRegistro('vehiculos', v.id)}><i className="bi bi-trash"></i></button>
                      </td>
                    )}
                  </tr>
                )) : (
                  <tr><td colSpan={isAdmin ? 7 : 6} className="text-center py-4 opacity-50">No hay vehículos registrados en la flota.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        );
      }

      case 'conductores': {
        const condFiltrados = conductores.filter(c =>
          (c.nombre || '').toLowerCase().includes(q) ||
          (c.rut_dni || '').toLowerCase().includes(q)
        );
        return (
          <div className="table-responsive">
            <table className="table table-dark table-hover table-bordered border-secondary rounded-0 align-middle mb-0">
              <thead style={{ backgroundColor: '#0a0a0a' }}>
                <tr className="text-uppercase small" style={{ color: 'var(--tp-gold)', letterSpacing: '1px' }}>
                  <th>RUT / DNI</th>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Venc. Licencia</th>
                  <th>Estado</th>
                  {isAdmin && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {condFiltrados.length > 0 ? condFiltrados.map(c => (
                  <tr key={c.id}>
                    <td>{c.rut_dni}</td>
                    <td className="fw-bold text-white">{c.nombre}</td>
                    <td>{c.telefono}</td>
                    <td>{c.vencimiento_licencia}</td>
                    <td>
                      <span className={`badge rounded-0 ${c.disponibilidad === 'DISPONIBLE' ? 'bg-success' : 'bg-warning text-dark'}`}>
                        {c.disponibilidad}
                      </span>
                    </td>
                    {isAdmin && (
                      <td>
                        <button className="btn btn-sm btn-outline-warning rounded-0 me-1" onClick={() => abrirEditar(c)}><i className="bi bi-pencil"></i></button>
                        <button className="btn btn-sm btn-outline-danger rounded-0" onClick={() => eliminarRegistro('conductores', c.id)}><i className="bi bi-trash"></i></button>
                      </td>
                    )}
                  </tr>
                )) : (
                  <tr><td colSpan={isAdmin ? 6 : 5} className="text-center py-4 opacity-50">No hay conductores registrados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        );
      }

      default:
        return null;
    }
  };

  // --- CONFIGURACIÓN VISUAL DEL MENÚ LATERAL ---
  const menuOperaciones = [
    { id: 'asignaciones', label: 'Despacho & Rutas', icon: 'bi-signpost-split', editable: true },
    { id: 'reservas', label: 'Reservas', icon: 'bi-journal-bookmark', editable: true },
    { id: 'clientes', label: 'Clientes', icon: 'bi-people', editable: true },
    { id: 'notificaciones', label: 'Centro de Alertas', icon: 'bi-bell', badge: notificaciones.length, editable: false }
  ];

  const menuCatalogoFlota = [
    { id: 'tarifas', label: 'Tarifas & Servicios', icon: 'bi-tags', editable: isAdmin },
    { id: 'vehiculos', label: 'Flota de Vehículos', icon: 'bi-truck', editable: isAdmin },
    { id: 'conductores', label: 'Conductores', icon: 'bi-person-vcard', editable: isAdmin }
  ];

  const titulosVista = {
    asignaciones: 'Despacho y Asignación Operativa',
    reservas: 'Gestión de Solicitudes de Reserva',
    clientes: 'Directorio de Clientes',
    notificaciones: 'Centro de Notificaciones y Vencimientos',
    tarifas: 'Tarifario Oficial de Servicios',
    vehiculos: 'Control de Flota Vehicular',
    conductores: 'Plantilla de Conductores'
  };

  return (
    <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#121212' }}>
      
      {/* SIDEBAR REDISEÑADO */}
      <aside className="d-flex flex-column border-end border-secondary" style={{ width: '280px', backgroundColor: '#0a0a0a', flexShrink: 0 }}>
        {/* Logo & Brand */}
        <div className="p-4 border-bottom border-secondary">
          <a href="/" className="text-decoration-none d-block">
            <span className="d-block small text-uppercase fw-bold" style={{ color: 'var(--tp-gold)', letterSpacing: '3px', fontSize: '0.65rem' }}>
              WILDLIFE ADVENTURE
            </span>
            <span className="fs-5 fw-bold text-white text-uppercase" style={{ letterSpacing: '1.5px' }}>
              Control System
            </span>
          </a>
        </div>

        {/* Tarjeta de Perfil & Rol */}
        <div className="p-3 mx-3 mt-3 border border-secondary" style={{ backgroundColor: '#141414' }}>
          <div className="d-flex align-items-center justify-content-between mb-1">
            <span className="small text-white fw-bold text-truncate">{operatorUser}</span>
            <span className={`badge rounded-0 text-uppercase ${isAdmin ? 'text-dark' : 'bg-info text-dark'}`} style={{ backgroundColor: isAdmin ? 'var(--tp-gold)' : undefined, fontSize: '0.65rem' }}>
              {isAdmin ? 'Admin' : 'Operador'}
            </span>
          </div>
          <small className="text-muted d-block" style={{ fontSize: '0.72rem' }}>
            {isAdmin ? 'Acceso CRUD total habilitado' : 'CRUD en Clientes y Reservas'}
          </small>
        </div>

        {/* Navegación Agrupada */}
        <div className="px-3 py-4 flex-grow-1 overflow-auto">
          <div className="text-uppercase fw-bold px-2 mb-2" style={{ fontSize: '0.68rem', color: '#6c757d', letterSpacing: '1.5px' }}>
            Operaciones Diarias
          </div>
          <ul className="nav flex-column mb-4">
            {menuOperaciones.map(item => {
              const activo = vistaActiva === item.id;
              return (
                <li className="nav-item mb-1" key={item.id}>
                  <button
                    onClick={() => cambiarTab(item.id)}
                    className="btn w-100 text-start rounded-0 d-flex align-items-center justify-content-between py-2 px-3"
                    style={{
                      backgroundColor: activo ? '#1c1c1c' : 'transparent',
                      color: activo ? 'var(--tp-gold)' : '#d0d0d0',
                      borderLeft: activo ? '3px solid var(--tp-gold)' : '3px solid transparent',
                      fontWeight: activo ? '700' : '500',
                      fontSize: '0.88rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span><i className={`bi ${item.icon} me-3`}></i>{item.label}</span>
                    {item.badge > 0 && (
                      <span className="badge rounded-pill bg-danger" style={{ fontSize: '0.7rem' }}>{item.badge}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="text-uppercase fw-bold px-2 mb-2" style={{ fontSize: '0.68rem', color: '#6c757d', letterSpacing: '1.5px' }}>
            Catálogo & Recursos
          </div>
          <ul className="nav flex-column">
            {menuCatalogoFlota.map(item => {
              const activo = vistaActiva === item.id;
              return (
                <li className="nav-item mb-1" key={item.id}>
                  <button
                    onClick={() => cambiarTab(item.id)}
                    className="btn w-100 text-start rounded-0 d-flex align-items-center justify-content-between py-2 px-3"
                    style={{
                      backgroundColor: activo ? '#1c1c1c' : 'transparent',
                      color: activo ? 'var(--tp-gold)' : '#d0d0d0',
                      borderLeft: activo ? '3px solid var(--tp-gold)' : '3px solid transparent',
                      fontWeight: activo ? '700' : '500',
                      fontSize: '0.88rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span><i className={`bi ${item.icon} me-3`}></i>{item.label}</span>
                    {!item.editable && (
                      <i className="bi bi-lock-fill text-secondary small" title="Solo lectura para Operador"></i>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Botón Cerrar Sesión */}
        <div className="p-3 border-top border-secondary">
          <button
            onClick={handleLogout}
            className="btn btn-outline-danger w-100 rounded-0 text-uppercase fw-bold py-2"
            style={{ fontSize: '0.78rem', letterSpacing: '1px' }}
          >
            <i className="bi bi-box-arrow-right me-2"></i>Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      <main className="flex-grow-1 p-4 p-lg-5 text-light overflow-auto">

        {errorConexion && (
          <div className="alert alert-danger rounded-0 d-flex justify-content-between align-items-center mb-4" role="alert">
            <span><i className="bi bi-wifi-off me-2"></i>{errorConexion}</span>
            <button type="button" className="btn btn-sm btn-outline-light rounded-0" onClick={cargarTodo}>
              Reintentar
            </button>
          </div>
        )}
        
        {/* Tarjetas KPI Superiores */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-xl-3">
            <div className="p-3 border border-secondary" style={{ backgroundColor: '#181818' }}>
              <small className="text-uppercase text-muted d-block" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Reservas Totales</small>
              <span className="fs-3 fw-bold text-white">{reservas.length}</span>
            </div>
          </div>
          <div className="col-6 col-xl-3">
            <div className="p-3 border border-secondary" style={{ backgroundColor: '#181818' }}>
              <small className="text-uppercase text-muted d-block" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Alertas Activas</small>
              <span className="fs-3 fw-bold text-danger">{notificaciones.length}</span>
            </div>
          </div>
          <div className="col-6 col-xl-3">
            <div className="p-3 border border-secondary" style={{ backgroundColor: '#181818' }}>
              <small className="text-uppercase text-muted d-block" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Vehículos en Flota</small>
              <span className="fs-3 fw-bold" style={{ color: 'var(--tp-gold)' }}>{vehiculos.length}</span>
            </div>
          </div>
          <div className="col-6 col-xl-3">
            <div className="p-3 border border-secondary" style={{ backgroundColor: '#181818' }}>
              <small className="text-uppercase text-muted d-block" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Conductores</small>
              <span className="fs-3 fw-bold text-success">{conductores.length}</span>
            </div>
          </div>
        </div>

        {/* Cabecera de Tabla + Buscador + Botón Crear */}
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4 pb-3 border-bottom border-secondary">
          <div>
            <h3 className="fw-bold text-uppercase text-white mb-1" style={{ letterSpacing: '1px' }}>
              {titulosVista[vistaActiva]}
            </h3>
            {!puedeEditarTabla(vistaActiva) && vistaActiva !== 'notificaciones' && (
              <span className="badge bg-secondary rounded-0 text-uppercase" style={{ fontSize: '0.68rem' }}>
                <i className="bi bi-eye me-1"></i>Vista de Solo Lectura (Rol Operador)
              </span>
            )}
          </div>

          <div className="d-flex gap-2 flex-wrap">
            {vistaActiva !== 'notificaciones' && (
              <input
                type="text"
                className="form-control form-control-sm bg-black text-white border-secondary rounded-0"
                style={{ width: '240px' }}
                placeholder="Filtrar registros..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            )}

            {/* Botón "+ Nuevo" habilitado según permisos de la tabla */}
            {['clientes', 'reservas', 'tarifas', 'vehiculos', 'conductores'].includes(vistaActiva) && puedeEditarTabla(vistaActiva) && (
              <button
                className="btn btn-sm rounded-0 fw-bold text-uppercase px-3"
                style={{ backgroundColor: 'var(--tp-gold)', color: '#000', letterSpacing: '0.5px' }}
                onClick={() => abrirCrear()}
              >
                <i className="bi bi-plus-lg me-1"></i>Nuevo Registro
              </button>
            )}
          </div>
        </div>

        {/* Formulario dinámico de Creación / Edición */}
        {renderFormularioCRUD()}

        {/* Tabla Activa */}
        <div className="border border-secondary" style={{ backgroundColor: '#181818' }}>
          {renderContenidoTabla()}
        </div>

      </main>
    </div>
  );
};

export default AdminDashboard;
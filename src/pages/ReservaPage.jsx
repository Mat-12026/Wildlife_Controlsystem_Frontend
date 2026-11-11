import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ReservaPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const servicio = location.state?.servicio;

  // Si alguien entra a esta URL sin elegir un tour, lo devolvemos al catálogo
  useEffect(() => {
    if (!servicio) navigate('/catalogo');
  }, [servicio, navigate]);

  // Cálculo de la fecha mínima (Hoy + 30 días)
  const fechaMinimaViaje = new Date();
  fechaMinimaViaje.setDate(fechaMinimaViaje.getDate() + 30);
  const minDateString = fechaMinimaViaje.toISOString().split('T')[0];

  // Estado general del viaje
  const [datosViaje, setDatosViaje] = useState({
    fecha_viaje: '',
    punto_pickup: ''
  });

  // Estado dinámico para los pasajeros (Inicia con 1 pasajero titular)
  const [pasajeros, setPasajeros] = useState([
    { id: 1, nombre: '', telefono: '', email: '', dieta: '', nacionalidad: '', fecha_nacimiento: '', rut: '', documento: null }
  ]);

  const agregarPasajero = () => {
    const nuevoId = pasajeros.length + 1;
    setPasajeros([...pasajeros, { id: nuevoId, nombre: '', telefono: '', email: '', dieta: '', nacionalidad: '', fecha_nacimiento: '', rut: '', documento: null }]);
  };

  const eliminarPasajero = (id) => {
    if (pasajeros.length > 1) {
      setPasajeros(pasajeros.filter(p => p.id !== id));
    }
  };

  const manejarCambioPasajero = (id, campo, valor) => {
    const nuevosPasajeros = pasajeros.map(p =>
      p.id === id ? { ...p, [campo]: valor } : p
    );
    setPasajeros(nuevosPasajeros);
  };

  const enviarFormulario = async (e) => {
    e.preventDefault();

    // 1. Calculamos la edad a partir de la fecha de nacimiento del pasajero 1
    const titular = pasajeros[0];
    const hoy = new Date();
    const fechaNac = new Date(titular.fecha_nacimiento);
    let edadCalculada = hoy.getFullYear() - fechaNac.getFullYear();
    const m = hoy.getMonth() - fechaNac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < fechaNac.getDate())) {
      edadCalculada--;
    }

    // 2. Calculamos el costo total estimado
    const cantidadPax = pasajeros.length;
    let costoEstimado = 0;
    if (cantidadPax <= 2) costoEstimado = servicio.precios.pax2;
    else if (cantidadPax <= 4) costoEstimado = servicio.precios.pax4;
    else costoEstimado = servicio.precios.pax10;

    // 3. Construimos el JSON (Payload) con la estructura exacta del Backend (UML)
    const payload = new FormData();

    // Datos de la reserva
    payload.append('fecha_viaje', datosViaje.fecha_viaje);
    payload.append('punto_pickup', datosViaje.punto_pickup);
    payload.append('destino', servicio.titulo);
    payload.append('cantidad_pasajeros', cantidadPax);
    payload.append('costo_total', costoEstimado);
    payload.append('tipo_servicio', servicio.categoria);

    // Datos del cliente titular
    payload.append('nombre', titular.nombre);
    payload.append('rut', titular.rut);
    payload.append('telefono', titular.telefono);
    payload.append('email', titular.email);
    payload.append('dieta', titular.dieta || 'Ninguna');
    payload.append('nacionalidad', titular.nacionalidad);
    payload.append('edad', edadCalculada);
    payload.append('origen', 'Directo');

    // Capturamos el archivo real
    if (titular.documento) {
      payload.append('foto_documento', titular.documento);
    }

    // 4. Enviamos los datos a Django
    try {
      const response = await fetch('https://both-smirk-entrust.ngrok-free.dev/api/clientes/nuevo/', {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        },
        method: 'POST',
        body: payload
      });

      if (response.ok) {
        const data = await response.json();
        alert(`¡Registro guardado en base de datos con éxito!\nID asignado: ${data.id}`);
        navigate('/catalogo');
      } else {
        const errorData = await response.json();
        console.error("Errores de validación Django:", errorData);
        alert('Error al guardar en la base de datos. Revisa la consola para más detalles.');
      }
    } catch (error) {
      console.error("Error de red:", error);
      alert('Error de conexión. Asegúrate de que el servidor Django esté corriendo en el puerto 8000.');
    }
  };

  if (!servicio) return null;

  return (
    <div style={{ backgroundColor: '#000000', minHeight: '100vh', color: '#ffffff', paddingBottom: '80px' }}>

      {/* Cabecera del Checkout */}
      <div className="py-4" style={{ backgroundColor: '#111111', borderBottom: '1px solid #333' }}>
        <div className="container d-flex align-items-center">
          <button onClick={() => navigate(-1)} className="btn btn-outline-light me-4 rounded-circle"><i className="bi bi-arrow-left"></i></button>
          <div>
            <h2 className="mb-0 fw-bold" style={{ color: 'var(--tp-gold)' }}>Completar Reserva</h2>
            <p className="mb-0 text-muted">Estás a un paso de tu aventura en la Patagonia</p>
          </div>
        </div>
      </div>

      <div className="container py-5">
        <form onSubmit={enviarFormulario}>
          <div className="row g-5">

            {/* COLUMNA IZQUIERDA: FORMULARIOS */}
            <div className="col-lg-7">

              {/* Bloque 1: Datos Logísticos (Fechas y Pickup) */}
              <div className="p-4 mb-4 shadow-sm" style={{ backgroundColor: '#1a1a1a', borderRadius: '12px', border: '1px solid #333' }}>
                <h4 className="fw-bold mb-4 border-bottom border-secondary pb-2"><i className="bi bi-geo-alt me-2" style={{ color: 'var(--tp-gold)' }}></i>Logística del Viaje</h4>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label text-white fw-semibold">Fecha del Viaje <span className="text-muted fw-normal">(Mín. 30 días)</span></label>
                    <input type="date" className="form-control border-secondary text-white" style={{ backgroundColor: '#2d2d2d' }}
                      min={minDateString}
                      value={datosViaje.fecha_viaje}
                      onChange={(e) => setDatosViaje({ ...datosViaje, fecha_viaje: e.target.value })} required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-white fw-semibold">Punto de Pick-up</label>
                    <input type="text" className="form-control border-secondary text-white" style={{ backgroundColor: '#2d2d2d' }}
                      placeholder="Ej: Hotel Costaustralis..."
                      value={datosViaje.punto_pickup}
                      onChange={(e) => setDatosViaje({ ...datosViaje, punto_pickup: e.target.value })} required
                    />
                  </div>
                </div>
              </div>

              {/* Bloque 2: Pasajeros Dinámicos */}
              {pasajeros.map((pax, index) => (
                <div key={pax.id} className="p-4 mb-4 shadow-sm position-relative" style={{ backgroundColor: '#1a1a1a', borderRadius: '12px', border: '1px solid #333' }}>

                  <div className="d-flex justify-content-between align-items-center mb-3 border-bottom border-secondary pb-2">
                    <h5 className="fw-bold mb-0 text-white">
                      <i className="bi bi-person-fill me-2" style={{ color: 'var(--tp-gold)' }}></i>
                      {index === 0 ? 'Pasajero 1 (Titular)' : `Pasajero ${index + 1}`}
                    </h5>
                    {index > 0 && (
                      <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => eliminarPasajero(pax.id)}>
                        <i className="bi bi-trash"></i> Eliminar
                      </button>
                    )}
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label text-white fw-semibold">Nombre Completo</label>
                      <input type="text" className="form-control border-secondary text-white" style={{ backgroundColor: '#2d2d2d' }} value={pax.nombre} onChange={(e) => manejarCambioPasajero(pax.id, 'nombre', e.target.value)} required />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label text-white fw-semibold">Nacionalidad</label>
                      <select
                        className="form-select border-secondary text-white"
                        style={{ backgroundColor: '#2d2d2d' }}
                        value={pax.nacionalidad}
                        onChange={(e) => manejarCambioPasajero(pax.id, 'nacionalidad', e.target.value)}
                        required>
                        <option value="">Selecciona una nacionalidad...</option>
                        <option value="Argentina">Argentina</option>
                        <option value="Bolivia">Bolivia</option>
                        <option value="Brasil">Brasil</option>
                        <option value="Chile">Chile</option>
                        <option value="Colombia">Colombia</option>
                        <option value="Ecuador">Ecuador</option>
                        <option value="España">España</option>
                        <option value="México">México</option>
                        <option value="Perú">Perú</option>
                        <option value="Uruguay">Uruguay</option>
                        <option value="Venezuela">Venezuela</option>
                      </select>
                    </div>

                    {/* Solo pedimos Teléfono y Email al Titular (Pasajero 1) para no ser redundantes */}
                    {index === 0 && (
                      <>
                        <div className="col-md-6">
                          <label className="form-label text-white fw-semibold">Correo Electrónico</label>
                          <input type="email" className="form-control border-secondary text-white" style={{ backgroundColor: '#2d2d2d' }} value={pax.email} onChange={(e) => manejarCambioPasajero(pax.id, 'email', e.target.value)} required />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label text-white fw-semibold">Teléfono / WhatsApp</label>
                          <input type="tel" className="form-control border-secondary text-white" style={{ backgroundColor: '#2d2d2d' }} value={pax.telefono} onChange={(e) => manejarCambioPasajero(pax.id, 'telefono', e.target.value)} required />
                        </div>
                      </>
                    )}

                    <div className="col-md-6">
                      <label className="form-label text-white fw-semibold">Fecha de Nacimiento</label>
                      <input type="date" className="form-control border-secondary text-white" style={{ backgroundColor: '#2d2d2d' }} value={pax.fecha_nacimiento} onChange={(e) => manejarCambioPasajero(pax.id, 'fecha_nacimiento', e.target.value)} required />
                    </div>

                    {/* Documento / Pasaporte */}
                    <div className="col-md-6">
                      <label className="form-label text-white fw-semibold">Documento / Pasaporte</label>
                      <input
                        type="text"
                        className="form-control border-secondary text-white"
                        style={{ backgroundColor: '#2d2d2d' }}
                        value={pax.rut}
                        onChange={(e) => manejarCambioPasajero(pax.id, 'rut', e.target.value)}
                        placeholder="Ej: 12.345.678-9 o Pasaporte A1234567"
                        required
                      />
                    </div>

                                        {/* INPUT PARA SUBIR LA FOTO DEL DOCUMENTO */}
                    <div className="col-12 mt-2">
                      <label className="form-label text-white fw-semibold">Foto del Documento</label>
                      <input 
                        type="file" 
                        className="form-control border-secondary text-white bg-dark" 
                        style={{ backgroundColor: '#2d2d2d' }} 
                        accept="image/*"
                        onChange={(e) => {
                          const archivo = e.target.files[0];
                          manejarCambioPasajero(pax.id, 'documento', archivo);
                        }} 
                        required 
                      />
                      <div className="form-text" style={{ fontSize: '0.8rem', color: '#aaaaaa' }}>
                        Sube una foto clara de tu documento (JPG, PNG).
                      </div>
                    </div>

                  </div> {/* Cierra el row g-3 */}
                </div> /* Cierra la tarjeta del pasajero */
              ))}

              <button type="button" onClick={agregarPasajero} className="btn btn-outline-light w-100 py-3 rounded-3 border-dashed mt-2" style={{ borderStyle: 'dashed' }}>
                <i className="bi bi-plus-circle me-2"></i> Añadir otro pasajero
              </button>

            </div>

            {/* COLUMNA DERECHA: RESUMEN Y MAPA */}
            <div className="col-lg-5">
              <div className="position-sticky" style={{ top: '20px' }}>

                {/* Tarjeta de Resumen del Servicio */}
                <div className="card bg-dark border-secondary shadow-lg mb-4">
                  <img src={servicio.img || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=600&q=80"} className="card-img-top" alt="Tour" style={{ height: '200px', objectFit: 'cover' }} />
                  <div className="card-body p-4">
                    <span className="badge mb-2" style={{ backgroundColor: 'var(--tp-green)' }}>{servicio.categoria}</span>
                    <h4 className="card-title text-white fw-bold">{servicio.titulo}</h4>
                    <p className="card-text text-light" style={{ opacity: 0.8, fontSize: '0.9rem' }}>{servicio.descripcion}</p>

                    <hr className="border-secondary" />
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-white">Cantidad de Pasajeros:</span>
                      <span className="fw-bold fs-5 text-white">{pasajeros.length} Pax</span>
                    </div>
                    {/* Lógica simple de precio según cantidad */}
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-white">Precio Estimado (USD):</span>
                      <span className="fw-bold fs-3" style={{ color: 'var(--tp-gold)' }}>
                        ${pasajeros.length <= 2 ? servicio.precios.pax2 : (pasajeros.length <= 4 ? servicio.precios.pax4 : servicio.precios.pax10)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mapa Embebido */}
                <div className="card bg-dark border-secondary shadow-lg mb-4">
                  <div className="card-header border-secondary bg-transparent py-3">
                    <h6 className="mb-0 text-white fw-bold"><i className="bi bi-map me-2" style={{ color: 'var(--tp-gold)' }}></i>Referencia de Ubicación</h6>
                  </div>
                  <div className="card-body p-0">
                    <iframe
                      title="Mapa Patagonia"
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d143169.61058226068!2d-72.63004381273934!3d-51.72899478440078!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xbdb2630062a4d95b%3A0xcda8d01150495d43!2sPuerto%20Natales%2C%20Natales%2C%20Magallanes%20y%20la%20Ant%C3%A1rtica%20Chilena!5e0!3m2!1ses!2scl!4v1700000000000!5m2!1ses!2scl"
                      width="100%"
                      height="250"
                      style={{ border: 0, borderBottomLeftRadius: 'calc(.25rem - 1px)', borderBottomRightRadius: 'calc(.25rem - 1px)' }}
                      allowFullScreen=""
                      loading="lazy">
                    </iframe>
                  </div>
                </div>

                <button type="submit" className="btn btn-gold w-100 py-3 fw-bold fs-5 shadow">
                  Confirmar Reserva
                </button>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};

export default ReservaPage;
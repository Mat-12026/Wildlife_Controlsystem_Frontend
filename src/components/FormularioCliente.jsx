import React, { useState } from 'react';

const FormularioCliente = () => {
  // 1. Definir el estado inicial. Los nombres de las propiedades deben coincidir EXACTAMENTE con tu modelo en Django.
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    edad: '',
    rut:'',
    nacionalidad: '',
    foto_documento: null
  });

  // 2. Actualizar el estado conforme el usuario escribe
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // 3. Manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault(); // Evita que la página se recargue

    try {
      const response = await fetch('http://localhost:8000/api/clientes/nuevo/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Indicamos que enviamos JSON
        },
        body: JSON.stringify(formData) // Convertimos el objeto a cadena JSON
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Guardado en base de datos:', data);
        alert('Registro exitoso');
        // Opcional: Limpiar el formulario tras el éxito
        setFormData({ nombre: '', email: '', telefono: '' });
      } else {
        const errors = await response.json();
        console.error('Errores de validación de Django:', errors);
        alert('Revisa los datos del formulario');
      }
    } catch (error) {
      console.error('Error de red al conectar con Django:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Nombre:</label>
        <input 
          type="text" 
          name="nombre" 
          value={formData.nombre} 
          onChange={handleChange} 
          required 
        />
      </div>
      <div>
        <label>Email:</label>
        <input 
          type="email" 
          name="email" 
          value={formData.email} 
          onChange={handleChange} 
          required 
        />
      </div>
      <div>
        <label>Teléfono:</label>
        <input 
          type="text" 
          name="telefono" 
          value={formData.telefono} 
          onChange={handleChange} 
        />
      </div>
      <div>
        <label>Teléfono:</label>
        <input 
          type="text" 
          name="telefono" 
          value={formData.telefono} 
          onChange={handleChange} 
        />
      </div>
      <button type="submit">Guardar Registro</button>
    </form>
  );
};

export default FormularioCliente;
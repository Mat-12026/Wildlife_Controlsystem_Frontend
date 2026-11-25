import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const RAW_API = (import.meta.env.VITE_API_URL || 'https://wildlife-controlsystem-backend.onrender.com/api').replace(/\/+$/, '');
const API_BASE = RAW_API.endsWith('/api') ? RAW_API : `${RAW_API}/api`;

// Diccionario de nacionalidades y palabras clave esperadas en documentos oficiales
const NATIONALITY_RULES = {
  Argentina: ['ARGENTINA', 'ARG', 'DNI', 'MERCOSUR', 'NACIONAL DE IDENTIDAD'],
  Australia: ['AUSTRALIA', 'AUS', 'PASSPORT'],
  Bolivia: ['BOLIVIA', 'BOL', 'PLURINACIONAL'],
  Brazil: ['BRASIL', 'BRAZIL', 'BRA', 'FEDERATIVA', 'CPF', 'IDENTIDADE'],
  Canada: ['CANADA', 'CAN', 'PASSPORT', 'PASSEPORT'],
  Chile: ['CHILE', 'CHILENA', 'CHL', 'RUN', 'RUT', 'REGISTRO CIVIL', 'IDENTIDAD'],
  Colombia: ['COLOMBIA', 'COL', 'CIUDADANIA'],
  Ecuador: ['ECUADOR', 'ECU'],
  France: ['FRANCE', 'FRA', 'FRANCAISE', 'PASSEPORT', 'IDENTITE'],
  Germany: ['DEUTSCHLAND', 'GERMANY', 'DEU', 'REISEPASS', 'PERSONALAUSWEIS'],
  Italy: ['ITALIA', 'ITALY', 'ITA', 'PASSAPORTO', 'IDENTITA'],
  Mexico: ['MEXICO', 'MEX', 'ESTADOS UNIDOS MEXICANOS'],
  Peru: ['PERU', 'PER', 'REPUBLICA DEL PERU'],
  Spain: ['ESPANA', 'SPAIN', 'ESP', 'DNI', 'PASAPORTE'],
  'United Kingdom': ['UNITED KINGDOM', 'GBR', 'BRITISH', 'PASSPORT'],
  'United States': ['UNITED STATES', 'USA', 'PASSPORT', 'DRIVER'],
  Uruguay: ['URUGUAY', 'URY', 'ORIENTAL DEL URUGUAY'],
  Venezuela: ['VENEZUELA', 'VEN', 'BOLIVARIANA'],
};

const normalizeText = (str) =>
  (str || '')
    .replace(/ñ/gi, 'N')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();

// Normaliza confusiones típicas de OCR en nombres y palabras
const normalizeOcrLetters = (str) =>
  normalizeText(str)
    .replace(/0/g, 'O')
    .replace(/[1|!]/g, 'I')
    .replace(/2/g, 'Z')
    .replace(/3/g, 'E')
    .replace(/[4@]/g, 'A')
    .replace(/[5$]/g, 'S')
    .replace(/6/g, 'G')
    .replace(/7/g, 'T')
    .replace(/8/g, 'B')
    .replace(/[^A-Z\s]/g, ' ');

// Normaliza confusiones típicas de OCR en números de documento / RUN / RUT
const normalizeOcrDigits = (str) =>
  normalizeText(str)
    .replace(/O/g, '0')
    .replace(/[IL|!]/g, '1')
    .replace(/Z/g, '2')
    .replace(/S/g, '5')
    .replace(/G/g, '6')
    .replace(/B/g, '8')
    .replace(/[^A-Z0-9]/g, '');

// Distancia de Levenshtein para tolerar caracteres alterados por marcas de agua
const levenshteinDistance = (a, b) => {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
};

// Busca un token en todo el texto OCR usando ventana deslizante (tolera espacios internos y 1-3 errores)
const fuzzySubstringMatch = (token, fullCleanDoc) => {
  if (!token || !fullCleanDoc) return false;
  if (fullCleanDoc.includes(token)) return true;

  const maxAllowedErrors = token.length >= 9 ? 3 : token.length >= 6 ? 2 : token.length >= 4 ? 1 : 0;
  if (maxAllowedErrors === 0) return false;

  const minLen = Math.max(3, token.length - 1);
  const maxLen = token.length + 1;

  for (let winLen = minLen; winLen <= maxLen; winLen++) {
    if (fullCleanDoc.length < winLen) continue;
    for (let i = 0; i <= fullCleanDoc.length - winLen; i++) {
      const slice = fullCleanDoc.slice(i, i + winLen);
      if (levenshteinDistance(token, slice) <= maxAllowedErrors) {
        return true;
      }
    }
  }
  return false;
};

// Elimina el patrón claro de seguridad del fondo y conserva la tinta oscura del texto
const cleanDocumentBackground = (file) =>
  new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const targetWidth = Math.max(img.width, 1600);
      const scale = targetWidth / img.width;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        // Los patrones de seguridad son gris/celeste claro (>128); la tinta del texto es oscura (<128)
        const val = gray > 128 ? 255 : Math.max(0, gray * 0.75);
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
      }

      ctx.putImageData(imageData, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });

const formatLocalDate = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const calculateExactAge = (dobString) => {
  if (!dobString) return null;
  const today = new Date();
  const birthDate = new Date(`${dobString}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return null;

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const getInitialCoords = (originText) => {
  const origin = (originText || '').toLowerCase();
  if (origin.includes('natales') || origin.includes('paine')) {
    return [-51.7299, -72.5060]; // Puerto Natales
  }
  if (origin.includes('calafate') || origin.includes('chalten')) {
    return [-50.3379, -72.2648]; // El Calafate
  }
  return [-53.1638, -70.9171]; // Punta Arenas
};

const loadLeafletAssets = () =>
  new Promise((resolve, reject) => {
    if (window.L) {
      resolve(window.L);
      return;
    }
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    const existingScript = document.getElementById('leaflet-js');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.L));
      return;
    }
    const script = document.createElement('script');
    script.id = 'leaflet-js';
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.body.appendChild(script);
  });

const loadTesseract = () =>
  new Promise((resolve, reject) => {
    if (window.Tesseract) {
      resolve(window.Tesseract);
      return;
    }
    const existing = document.getElementById('tesseract-js');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Tesseract));
      return;
    }
    const script = document.createElement('script');
    script.id = 'tesseract-js';
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    script.async = true;
    script.onload = () => resolve(window.Tesseract);
    script.onerror = reject;
    document.body.appendChild(script);
  });

const ReservaPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const servicio = location.state?.servicio;

  useEffect(() => {
    if (!servicio) navigate('/catalogo');
  }, [servicio, navigate]);

  // Fecha mínima de viaje: Hoy + 30 días
  const today = new Date();
  const minTripDateObj = new Date(today);
  minTripDateObj.setDate(minTripDateObj.getDate() + 30);
  const minDateString = formatLocalDate(minTripDateObj);

  // Límites de fecha de nacimiento (entre 2 y 100 años)
  const minDobString = formatLocalDate(
    new Date(today.getFullYear() - 100, today.getMonth(), today.getDate())
  );
  const maxDobString = formatLocalDate(
    new Date(today.getFullYear() - 2, today.getMonth(), today.getDate())
  );

  // Estado de logística y mapa interactivo
  const initialCoords = getInitialCoords(servicio?.origen);
  const [datosViaje, setDatosViaje] = useState({
    fecha_viaje: '',
    punto_pickup: '',
    lat: null,
    lng: null,
  });
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [mapStatusMsg, setMapStatusMsg] = useState('Click on the map, drag the pin, or use GPS to select your exact pick-up spot.');
  const [locatingGps, setLocatingGps] = useState(false);
  const [searchingPlace, setSearchingPlace] = useState(false);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const createEmptyPassenger = (id) => ({
    id,
    nombre: '',
    nacionalidad: '',
    fecha_nacimiento: '',
    telefono: '',
    email: '',
    dieta: '',
    tipo_documento: 'PASSPORT',
    numero_documento: '',
    documento: null,
    docPreview: null,
    docStatus: 'idle', // 'idle' | 'verifying' | 'valid' | 'invalid'
    docMessage: '',
  });

  const [pasajeros, setPasajeros] = useState([createEmptyPassenger(1)]);
  const [submitting, setSubmitting] = useState(false);

  // --- GEOCODIFICACIÓN INVERSA Y ACTUALIZACIÓN DEL PIN EN EL MAPA ---
  const updatePickupFromCoords = async (lat, lng, customLabel = null) => {
    const roundedLat = Number(lat).toFixed(6);
    const roundedLng = Number(lng).toFixed(6);

    if (customLabel) {
      setDatosViaje((prev) => ({
        ...prev,
        lat: roundedLat,
        lng: roundedLng,
        punto_pickup: `${customLabel} (${roundedLat}, ${roundedLng})`,
      }));
      setMapStatusMsg('Exact pick-up coordinates locked on map.');
      return;
    }

    setMapStatusMsg('Resolving exact street / hotel address...');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${roundedLat}&lon=${roundedLng}`
      );
      const data = await res.json();
      const addressLabel = data.display_name
        ? data.display_name.split(',').slice(0, 3).join(',').trim()
        : 'Pinned Patagonia Location';

      setDatosViaje((prev) => ({
        ...prev,
        lat: roundedLat,
        lng: roundedLng,
        punto_pickup: `${addressLabel} (${roundedLat}, ${roundedLng})`,
      }));
      setMapStatusMsg('Pick-up location confirmed on map.');
    } catch {
      setDatosViaje((prev) => ({
        ...prev,
        lat: roundedLat,
        lng: roundedLng,
        punto_pickup: `GPS Pin (${roundedLat}, ${roundedLng})`,
      }));
      setMapStatusMsg('GPS coordinates locked.');
    }
  };

  // --- INICIALIZAR MAPA INTERACTIVO LEAFLET ---
  useEffect(() => {
    if (!servicio || !mapContainerRef.current) return;
    let isMounted = true;

    loadLeafletAssets()
      .then((L) => {
        if (!isMounted || mapInstanceRef.current) return;

        const map = L.map(mapContainerRef.current).setView(initialCoords, 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        const pinIcon = L.divIcon({
          className: 'custom-pickup-pin',
          html: `<div style="background:#d4af37;border:3px solid #000;width:22px;height:22px;border-radius:50%;box-shadow:0 0 12px rgba(0,0,0,0.9);"></div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const marker = L.marker(initialCoords, { draggable: true, icon: pinIcon }).addTo(map);

        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          updatePickupFromCoords(pos.lat, pos.lng);
        });

        map.on('click', (e) => {
          marker.setLatLng(e.latlng);
          updatePickupFromCoords(e.latlng.lat, e.latlng.lng);
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;
      })
      .catch((err) => {
        console.error('Map initialization error:', err);
        setMapStatusMsg('Unable to load interactive map. Check your internet connection.');
      });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [servicio]);

  // --- USAR UBICACIÓN EXACTA DEL USUARIO (GPS NAVEGADOR) ---
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMapStatusMsg('Geolocation is not supported by your browser.');
      return;
    }

    setLocatingGps(true);
    setMapStatusMsg('Detecting your exact GPS location...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 16);
          markerRef.current.setLatLng([latitude, longitude]);
        }
        updatePickupFromCoords(latitude, longitude);
        setLocatingGps(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setMapStatusMsg('Location permission denied or unavailable. Click directly on the map to place your pin.');
        setLocatingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // --- BUSCAR HOTEL / DIRECCIÓN EN EL MAPA ---
  const handleSearchOnMap = async () => {
    if (!mapSearchQuery.trim()) return;
    setSearchingPlace(true);
    setMapStatusMsg(`Searching "${mapSearchQuery}" on map...`);

    try {
      const query = encodeURIComponent(`${mapSearchQuery}, Patagonia`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${query}`);
      const results = await res.json();

      if (results && results.length > 0) {
        const place = results[0];
        const lat = parseFloat(place.lat);
        const lon = parseFloat(place.lon);
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([lat, lon], 16);
          markerRef.current.setLatLng([lat, lon]);
        }
        const shortName = place.display_name.split(',').slice(0, 3).join(',').trim();
        await updatePickupFromCoords(lat, lon, shortName);
      } else {
        setMapStatusMsg('Place not found. Try adding the city (e.g. "Hotel Costaustralis Puerto Natales") or click the map.');
      }
    } catch {
      setMapStatusMsg('Error searching location. Click directly on the map to set your pick-up pin.');
    } finally {
      setSearchingPlace(false);
    }
  };

  // --- EVALUACIÓN DE TEXTO OCR CONTRA DATOS DEL PASAJERO ---
  const evaluateOcrAgainstPassenger = (rawOcrText, paxData) => {
    const extractedText = normalizeText(rawOcrText);
    const letterNormalizedDoc = normalizeOcrLetters(rawOcrText);
    const fullCleanLetters = letterNormalizedDoc.replace(/\s+/g, '');

    const docKeywords = [
      'PASSPORT', 'PASAPORTE', 'PASSEPORT', 'REISEPASS', 'PASSAPORTO',
      'IDENTIDAD', 'IDENTITY', 'CEDULA', 'DNI', 'RUN', 'RUT',
      'REPUBLICA', 'REPUBLIC', 'NATIONALITY', 'NACIONALIDAD',
      'SURNAME', 'APELLIDO', 'APELLIDOS', 'GIVEN', 'NOMBRES', 'BIRTH', 'NACIMIENTO', '<<<',
    ];
    const hasDocStructure = docKeywords.some(
      (kw) => extractedText.includes(kw) || letterNormalizedDoc.includes(kw)
    );

    const isPassportDoc =
      extractedText.includes('PASSPORT') ||
      extractedText.includes('PASAPORTE') ||
      extractedText.includes('PASSEPORT') ||
      extractedText.includes('P<');

    // Coincidencia de nombre y/o apellidos con ventana deslizante
    const nameTokens = normalizeOcrLetters(paxData.nombre)
      .split(/\s+/)
      .filter((token) => token.length >= 3);

    const matchedTokens = nameTokens.filter((token) =>
      fuzzySubstringMatch(token, fullCleanLetters)
    );

    const requiredMatches = nameTokens.length >= 2 ? 2 : 1;
    const nameMatches = nameTokens.length > 0 && matchedTokens.length >= requiredMatches;

    // Coincidencia de número de documento / RUN / RUT
    const cleanDocNum = normalizeOcrDigits(paxData.numero_documento);
    const cleanExtractedDigits = normalizeOcrDigits(rawOcrText);
    const coreDocNumber = cleanDocNum.length >= 6 ? cleanDocNum.slice(0, -1) : cleanDocNum;
    const numberMatches =
      coreDocNumber.length >= 5 &&
      (cleanExtractedDigits.includes(coreDocNumber) || fuzzySubstringMatch(coreDocNumber, cleanExtractedDigits));

    // Coincidencia de nacionalidad
    const natKeywords = NATIONALITY_RULES[paxData.nacionalidad] || [normalizeText(paxData.nacionalidad)];
    const nationalityMatches = natKeywords.some(
      (kw) => extractedText.includes(kw) || letterNormalizedDoc.includes(kw)
    );

    return {
      hasDocStructure,
      isPassportDoc,
      nameMatches,
      numberMatches,
      nationalityMatches,
      textLength: extractedText.length,
    };
  };

  // --- VERIFICACIÓN AUTOMÁTICA DE DOCUMENTO / PASAPORTE (DOBLE PASADA OCR) ---
  const verifyPassengerDocument = async (paxData, file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPasajeros((prev) =>
        prev.map((p) =>
          p.id === paxData.id
            ? {
                ...p,
                docStatus: 'invalid',
                docMessage: 'Invalid file format. Please upload a clear JPG or PNG image of your ID or Passport.',
              }
            : p
        )
      );
      return;
    }

    if (!paxData.nombre.trim() || !paxData.nacionalidad || !paxData.numero_documento.trim()) {
      setPasajeros((prev) =>
        prev.map((p) =>
          p.id === paxData.id
            ? {
                ...p,
                docStatus: 'invalid',
                docMessage:
                  'Enter Full Name, Nationality, and Document Number before uploading the photo so we can verify ownership.',
              }
            : p
        )
      );
      return;
    }

    setPasajeros((prev) =>
      prev.map((p) =>
        p.id === paxData.id
          ? { ...p, docStatus: 'verifying', docMessage: 'Scanning document authenticity, passenger name, and nationality...' }
          : p
      )
    );

    try {
      const Tesseract = await loadTesseract();

      // Pasada 1: Imagen original en español + inglés
      const pass1 = await Tesseract.recognize(file, 'spa+eng');
      let combinedOcr = pass1?.data?.text || '';
      let check = evaluateOcrAgainstPassenger(combinedOcr, paxData);

      // Pasada 2: Si algún campo falló por el fondo de seguridad, limpiamos el fondo y combinamos resultados
      if (!check.hasDocStructure || !check.nameMatches || !check.numberMatches || !check.nationalityMatches) {
        const cleanedCanvas = await cleanDocumentBackground(file);
        const pass2 = await Tesseract.recognize(cleanedCanvas, 'spa+eng');
        combinedOcr = `${combinedOcr}\n${pass2?.data?.text || ''}`;
        check = evaluateOcrAgainstPassenger(combinedOcr, paxData);
      }

      if (!check.hasDocStructure || check.textLength < 20) {
        setPasajeros((prev) =>
          prev.map((p) =>
            p.id === paxData.id
              ? {
                  ...p,
                  docStatus: 'invalid',
                  docMessage:
                    'The uploaded image does not appear to be a readable ID card or Passport. Please upload a clear, well-lit photo of your official document.',
                }
              : p
          )
        );
        return;
      }

      if (paxData.tipo_documento === 'PASSPORT' && !check.isPassportDoc) {
        setPasajeros((prev) =>
          prev.map((p) =>
            p.id === paxData.id
              ? {
                  ...p,
                  docStatus: 'invalid',
                  docMessage:
                    'You selected "Passport", but the uploaded photo does not look like a passport. Switch to National ID or upload your passport.',
                }
              : p
          )
        );
        return;
      }

      const errors = [];
      if (!check.nameMatches) {
        errors.push(`passenger name ("${paxData.nombre}") does not match the document`);
      }
      if (!check.nationalityMatches) {
        errors.push(`nationality ("${paxData.nacionalidad}") was not detected on the document`);
      }
      if (!check.numberMatches) {
        errors.push(`document number ("${paxData.numero_documento}") does not match`);
      }

      if (errors.length > 0) {
        setPasajeros((prev) =>
          prev.map((p) =>
            p.id === paxData.id
              ? {
                  ...p,
                  docStatus: 'invalid',
                  docMessage: `Verification failed: ${errors.join('; ')}. Please check your details or upload a sharper photo.`,
                }
              : p
          )
        );
        return;
      }

      setPasajeros((prev) =>
        prev.map((p) =>
          p.id === paxData.id
            ? {
                ...p,
                docStatus: 'valid',
                docMessage: `Verified ${paxData.tipo_documento === 'PASSPORT' ? 'Passport' : 'National ID'} belonging to ${paxData.nombre} (${paxData.nacionalidad}).`,
              }
            : p
        )
      );
    } catch (err) {
      console.error('OCR verification error:', err);
      setPasajeros((prev) =>
        prev.map((p) =>
          p.id === paxData.id
            ? {
                ...p,
                docStatus: 'invalid',
                docMessage: 'Could not verify document image automatically. Please upload a clearer JPG/PNG photo.',
              }
            : p
        )
      );
    }
  };

  // --- GESTIÓN DE PASAJEROS ---
  const agregarPasajero = () => {
    const nuevoId = pasajeros.length > 0 ? Math.max(...pasajeros.map((p) => p.id)) + 1 : 1;
    setPasajeros([...pasajeros, createEmptyPassenger(nuevoId)]);
  };

  const eliminarPasajero = (id) => {
    if (pasajeros.length > 1) {
      setPasajeros(pasajeros.filter((p) => p.id !== id));
    }
  };

  const manejarCambioPasajero = (id, campo, valor) => {
    setPasajeros((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, [campo]: valor };
        if (campo === 'tipo_documento') {
          updated.numero_documento = '';
        }
        return updated;
      })
    );
  };

  const handleDocumentUpload = (pax, file) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    const updatedPax = { ...pax, documento: file, docPreview: previewUrl };
    setPasajeros((prev) => prev.map((p) => (p.id === pax.id ? updatedPax : p)));
    verifyPassengerDocument(updatedPax, file);
  };

  // --- ENVÍO DEL FORMULARIO CON VALIDACIONES ESTRICTAS ---
  const enviarFormulario = async (e) => {
    e.preventDefault();

    // 1. Validar punto de pick-up seleccionado en el mapa
    if (!datosViaje.punto_pickup || datosViaje.lat === null || datosViaje.lng === null) {
      alert('Please select your exact pick-up location on the interactive map before confirming.');
      return;
    }

    // 2. Validar edades (2 a 100 años) y regla de titular adulto (18+)
    for (let i = 0; i < pasajeros.length; i++) {
      const pax = pasajeros[i];
      const age = calculateExactAge(pax.fecha_nacimiento);

      if (age === null || age < 2 || age > 100) {
        alert(
          `Invalid age for ${i === 0 ? 'Lead Passenger' : `Passenger ${i + 1}`}. All passengers must be between 2 and 100 years old.`
        );
        return;
      }

      if (i === 0 && age < 18) {
        alert(
          'A minor (under 18 years old) cannot be registered as the Lead Passenger. Please enter an adult (18+) as Passenger 1.'
        );
        return;
      }

      if (pax.docStatus === 'verifying') {
        alert('Please wait until document verification finishes.');
        return;
      }

      if (pax.docStatus !== 'valid') {
        alert(
          `Please upload a valid, verified ${pax.tipo_documento === 'PASSPORT' ? 'Passport' : 'National ID'} photo for ${pax.nombre || `Passenger ${i + 1}`}.`
        );
        return;
      }
    }

    const titular = pasajeros[0];
    const edadTitular = calculateExactAge(titular.fecha_nacimiento);

    // 3. Calcular tarifa total según cantidad de pasajeros
    const cantidadPax = pasajeros.length;
    let costoEstimado = 0;
    if (cantidadPax <= 2) costoEstimado = servicio.precios.pax2;
    else if (cantidadPax <= 4) costoEstimado = servicio.precios.pax4;
    else costoEstimado = servicio.precios.pax10;

    // 4. Construir FormData compatible con Django
    const payload = new FormData();
    payload.append('fecha_viaje', datosViaje.fecha_viaje);
    payload.append('punto_pickup', datosViaje.punto_pickup);
    payload.append('destino', servicio.titulo);
    payload.append('cantidad_pasajeros', cantidadPax);
    payload.append('costo_total', costoEstimado);
    payload.append('tipo_servicio', servicio.categoria);

    payload.append('nombre', titular.nombre.trim());
    payload.append('rut', `${titular.tipo_documento === 'PASSPORT' ? 'PASS' : 'ID'}: ${titular.numero_documento.trim()}`);
    payload.append('telefono', titular.telefono.trim());
    payload.append('email', titular.email.trim());
    payload.append('dieta', titular.dieta.trim() || 'None');
    payload.append('nacionalidad', titular.nacionalidad);
    payload.append('edad', edadTitular);
    payload.append('origen', 'Directo');

    if (titular.documento) {
      payload.append('foto_documento', titular.documento);
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/clientes/nuevo/`, {
        method: 'POST',
        body: payload,
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Booking registered successfully!\nReference ID: #${data.id}`);
        navigate('/catalogo');
      } else {
        const errorData = await response.json();
        console.error('Django validation error:', errorData);
        alert('Could not save reservation: ' + JSON.stringify(errorData));
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('Connection error with server. Please try again in a few seconds.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!servicio) return null;

  const estimatedTotal =
    pasajeros.length <= 2
      ? servicio.precios.pax2
      : pasajeros.length <= 4
      ? servicio.precios.pax4
      : servicio.precios.pax10;

  return (
    <div style={{ backgroundColor: '#121212', minHeight: '100vh', color: '#ffffff', paddingBottom: '80px' }}>
      {/* HEADER */}
      <div className="py-5 border-bottom border-secondary" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="container mt-3">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <p
                className="text-uppercase mb-1"
                style={{ color: 'var(--tp-gold)', fontWeight: '700', letterSpacing: '3px', fontSize: '0.8rem' }}
              >
                OFFICIAL BOOKING CHECKOUT
              </p>
              <h1 className="display-5 fw-bold mb-1 text-white text-uppercase" style={{ letterSpacing: '2px' }}>
                Complete Your Reservation
              </h1>
              <p className="mb-0 text-light opacity-75 small">
                Configure your exact GPS pick-up location and verified passenger manifest.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-outline-light rounded-0 text-uppercase fw-bold px-4 py-2"
              style={{ letterSpacing: '1px', fontSize: '0.8rem' }}
            >
              <i className="bi bi-arrow-left me-2"></i>Back to Catalog
            </button>
          </div>
        </div>
      </div>

      <div className="container py-5">
        <form onSubmit={enviarFormulario}>
          <div className="row g-5">
            {/* COLUMNA IZQUIERDA */}
            <div className="col-lg-7">
              {/* BLOQUE 1: LOGÍSTICA DEL VIAJE Y MAPA INTERACTIVO */}
              <div className="p-4 mb-4 bg-dark border border-secondary rounded-0 shadow-sm">
                <h5
                  className="fw-bold mb-4 pb-3 border-bottom border-secondary text-uppercase text-white"
                  style={{ letterSpacing: '1.5px' }}
                >
                  <i className="bi bi-geo-alt-fill me-2" style={{ color: 'var(--tp-gold)' }}></i>
                  1. Trip Logistics & Exact Pick-Up Map
                </h5>

                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label
                      className="form-label text-light small text-uppercase fw-bold"
                      style={{ letterSpacing: '0.5px' }}
                    >
                      Travel Date <span className="text-light opacity-50 fw-normal">(Min. 30 days ahead)</span>
                    </label>
                    <input
                      type="date"
                      className="form-control bg-black text-white border-secondary rounded-0"
                      min={minDateString}
                      value={datosViaje.fecha_viaje}
                      onChange={(e) => setDatosViaje({ ...datosViaje, fecha_viaje: e.target.value })}
                      required
                    />
                  </div>

                  <div className="col-md-6 d-flex flex-column justify-content-end">
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      disabled={locatingGps}
                      className="btn w-100 rounded-0 fw-bold text-uppercase py-2"
                      style={{
                        backgroundColor: 'var(--tp-gold)',
                        color: '#000',
                        letterSpacing: '0.8px',
                        fontSize: '0.8rem',
                      }}
                    >
                      <i className="bi bi-crosshair me-2"></i>
                      {locatingGps ? 'Detecting GPS...' : 'Use My Exact Location'}
                    </button>
                  </div>
                </div>

                {/* Buscador de Hotel o Dirección en el Mapa */}
                <label
                  className="form-label text-light small text-uppercase fw-bold"
                  style={{ letterSpacing: '0.5px' }}
                >
                  Search Hotel / Address or Pin Directly on Map
                </label>
                <div className="input-group mb-3">
                  <input
                    type="text"
                    className="form-control bg-black text-white border-secondary rounded-0"
                    placeholder="e.g. Hotel Costaustralis, Puerto Natales..."
                    value={mapSearchQuery}
                    onChange={(e) => setMapSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearchOnMap();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSearchOnMap}
                    disabled={searchingPlace}
                    className="btn btn-outline-light rounded-0 text-uppercase fw-bold px-3"
                    style={{ fontSize: '0.78rem', letterSpacing: '1px' }}
                  >
                    <i className="bi bi-search me-1"></i>
                    {searchingPlace ? 'Searching...' : 'Locate'}
                  </button>
                </div>

                {/* Contenedor del Mapa Real Interactivo */}
                <div
                  ref={mapContainerRef}
                  className="border border-secondary mb-3"
                  style={{ height: '300px', width: '100%', zIndex: 1 }}
                />

                <div className="p-3 bg-black border border-secondary">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span
                      className="small text-uppercase fw-bold"
                      style={{ color: 'var(--tp-gold)', letterSpacing: '1px', fontSize: '0.72rem' }}
                    >
                      Selected Pick-up Point (Map Verified)
                    </span>
                    {datosViaje.lat && (
                      <span className="badge bg-success rounded-0 text-uppercase" style={{ fontSize: '0.68rem' }}>
                        GPS Locked
                      </span>
                    )}
                  </div>
                  <p className="mb-1 text-white fw-semibold small">
                    {datosViaje.punto_pickup || 'No location pinned yet.'}
                  </p>
                  <small className="text-light opacity-75 d-block" style={{ fontSize: '0.75rem' }}>
                    {mapStatusMsg}
                  </small>
                </div>
              </div>

              {/* BLOQUE 2: PASAJEROS DINÁMICOS */}
              {pasajeros.map((pax, index) => {
                const isLead = index === 0;
                const age = calculateExactAge(pax.fecha_nacimiento);
                const isAgeOutOfRange = age !== null && (age < 2 || age > 100);
                const isMinor = age !== null && age >= 2 && age < 18;

                return (
                  <div
                    key={pax.id}
                    className="p-4 mb-4 bg-dark border border-secondary rounded-0 shadow-sm position-relative"
                  >
                    <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-secondary flex-wrap gap-2">
                      <div>
                        <h5
                          className="fw-bold mb-0 text-uppercase text-white"
                          style={{ letterSpacing: '1px' }}
                        >
                          <i className="bi bi-person-badge-fill me-2" style={{ color: 'var(--tp-gold)' }}></i>
                          {isLead ? 'Passenger 1 — Lead Adult (18+)' : `Passenger ${index + 1}`}
                        </h5>
                      </div>

                      <div className="d-flex align-items-center gap-2">
                        {age !== null && !isAgeOutOfRange && (
                          <span
                            className={`badge rounded-0 text-uppercase ${
                              isMinor ? 'bg-warning text-dark' : 'bg-secondary text-white'
                            }`}
                          >
                            {age} yrs {isMinor ? '• Minor (Under 18)' : '• Adult'}
                          </span>
                        )}

                        {!isLead && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger rounded-0 text-uppercase fw-bold"
                            onClick={() => eliminarPasajero(pax.id)}
                          >
                            <i className="bi bi-trash me-1"></i>Remove
                          </button>
                        )}
                      </div>
                    </div>

                    {isAgeOutOfRange && (
                      <div className="alert alert-danger rounded-0 small py-2 mb-3">
                        <i className="bi bi-exclamation-octagon-fill me-2"></i>
                        Passenger age must be between <strong>2 and 100 years old</strong>.
                      </div>
                    )}

                    {isMinor && isLead && (
                      <div className="alert alert-danger rounded-0 small py-2 mb-3">
                        <i className="bi bi-shield-exclamation me-2"></i>
                        <strong>Under 18 Detected:</strong> A minor cannot be the Lead Passenger. Please assign an adult (18+) as Passenger 1.
                      </div>
                    )}

                    {isMinor && !isLead && (
                      <div className="alert alert-warning rounded-0 small py-2 mb-3 text-dark">
                        <i className="bi bi-info-circle-fill me-2"></i>
                        <strong>Minor Passenger (Under 18):</strong> Email and phone number are not required for minors traveling with the Lead Adult.
                      </div>
                    )}

                    {/* Subsección A: Identidad y Edad */}
                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <label className="form-label text-light small text-uppercase fw-bold">
                          Full Name (As shown on ID/Passport)
                        </label>
                        <input
                          type="text"
                          className="form-control bg-black text-white border-secondary rounded-0"
                          placeholder="e.g. Matías Nicolás Mascareña Oyarzo"
                          value={pax.nombre}
                          onChange={(e) => manejarCambioPasajero(pax.id, 'nombre', e.target.value)}
                          required
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label text-light small text-uppercase fw-bold">
                          Nationality
                        </label>
                        <select
                          className="form-select bg-black text-white border-secondary rounded-0"
                          value={pax.nacionalidad}
                          onChange={(e) => manejarCambioPasajero(pax.id, 'nacionalidad', e.target.value)}
                          required
                        >
                          <option value="">Select nationality...</option>
                          {Object.keys(NATIONALITY_RULES).map((country) => (
                            <option key={country} value={country}>
                              {country}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label text-light small text-uppercase fw-bold">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          className="form-control bg-black text-white border-secondary rounded-0"
                          min={minDobString}
                          max={maxDobString}
                          value={pax.fecha_nacimiento}
                          onChange={(e) => manejarCambioPasajero(pax.id, 'fecha_nacimiento', e.target.value)}
                          required
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label text-light small text-uppercase fw-bold">
                          Calculated Age
                        </label>
                        <input
                          type="text"
                          readOnly
                          className="form-control bg-black text-white border-secondary rounded-0 opacity-75"
                          value={
                            age === null
                              ? 'Select date of birth...'
                              : `${age} years old (${age < 18 ? 'Minor' : 'Adult'})`
                          }
                        />
                      </div>
                    </div>

                    {/* Subsección B: Contacto (Solo para Titular Adulto >= 18) */}
                    {isLead && !isMinor && (
                      <div className="row g-3 mb-3 pt-2 border-top border-secondary">
                        <div className="col-md-6">
                          <label className="form-label text-light small text-uppercase fw-bold">
                            Contact Email
                          </label>
                          <input
                            type="email"
                            className="form-control bg-black text-white border-secondary rounded-0"
                            placeholder="traveler@example.com"
                            value={pax.email}
                            onChange={(e) => manejarCambioPasajero(pax.id, 'email', e.target.value)}
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label text-light small text-uppercase fw-bold">
                            Phone / WhatsApp
                          </label>
                          <input
                            type="tel"
                            className="form-control bg-black text-white border-secondary rounded-0"
                            placeholder="+56 9 1234 5678"
                            value={pax.telefono}
                            onChange={(e) => manejarCambioPasajero(pax.id, 'telefono', e.target.value)}
                            required
                          />
                        </div>
                        <div className="col-12">
                          <label className="form-label text-light small text-uppercase fw-bold">
                            Dietary Restrictions / Allergies <span className="text-light opacity-50 fw-normal">(Optional)</span>
                          </label>
                          <input
                            type="text"
                            className="form-control bg-black text-white border-secondary rounded-0"
                            placeholder="e.g. Vegetarian, Gluten-free, None"
                            value={pax.dieta}
                            onChange={(e) => manejarCambioPasajero(pax.id, 'dieta', e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {/* Subsección C: Tipo de Documento, Número y Verificación de Foto */}
                    <div className="row g-3 pt-2 border-top border-secondary">
                      <div className="col-md-6">
                        <label className="form-label text-light small text-uppercase fw-bold">
                          Document Type
                        </label>
                        <select
                          className="form-select bg-black text-white border-secondary rounded-0"
                          value={pax.tipo_documento}
                          onChange={(e) => manejarCambioPasajero(pax.id, 'tipo_documento', e.target.value)}
                          required
                        >
                          <option value="PASSPORT">Passport</option>
                          <option value="ID_CARD">National ID / RUT / DNI</option>
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label text-light small text-uppercase fw-bold">
                          {pax.tipo_documento === 'PASSPORT' ? 'Passport Number' : 'National ID / RUT / DNI Number'}
                        </label>
                        <input
                          type="text"
                          className="form-control bg-black text-white border-secondary rounded-0"
                          value={pax.numero_documento}
                          onChange={(e) => manejarCambioPasajero(pax.id, 'numero_documento', e.target.value)}
                          placeholder={
                            pax.tipo_documento === 'PASSPORT' ? 'e.g. P12345678' : 'e.g. 22.293.675-6'
                          }
                          required
                        />
                      </div>

                      <div className="col-12">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <label className="form-label text-light small text-uppercase fw-bold mb-0">
                            {pax.tipo_documento === 'PASSPORT' ? 'Passport Photo' : 'National ID Photo'}
                          </label>
                          {pax.documento && (
                            <button
                              type="button"
                              onClick={() => verifyPassengerDocument(pax, pax.documento)}
                              className="btn btn-link btn-sm text-decoration-none p-0"
                              style={{ color: 'var(--tp-gold)', fontSize: '0.78rem' }}
                            >
                              <i className="bi bi-arrow-repeat me-1"></i>Re-verify Document
                            </button>
                          )}
                        </div>

                        <input
                          type="file"
                          className="form-control bg-black text-white border-secondary rounded-0"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => handleDocumentUpload(pax, e.target.files[0])}
                          required
                        />
                        <div className="form-text text-light opacity-75" style={{ fontSize: '0.78rem' }}>
                          Upload a clear photo of your {pax.tipo_documento === 'PASSPORT' ? 'Passport' : 'National ID'}. Our system verifies that the document belongs to <strong>{pax.nombre || 'the passenger'}</strong> and matches their nationality.
                        </div>

                        {/* Resultado de Verificación del Documento */}
                        {pax.docStatus !== 'idle' && (
                          <div
                            className={`mt-2 p-3 border rounded-0 small d-flex align-items-start gap-3 ${
                              pax.docStatus === 'verifying'
                                ? 'bg-black border-warning text-warning'
                                : pax.docStatus === 'valid'
                                ? 'bg-black border-success text-success'
                                : 'bg-black border-danger text-danger'
                            }`}
                          >
                            {pax.docPreview && (
                              <img
                                src={pax.docPreview}
                                alt="Document preview"
                                style={{ width: '72px', height: '48px', objectFit: 'cover', border: '1px solid #444' }}
                              />
                            )}
                            <div>
                              <div className="fw-bold text-uppercase mb-1" style={{ letterSpacing: '0.5px' }}>
                                {pax.docStatus === 'verifying' && (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    Verifying Document...
                                  </>
                                )}
                                {pax.docStatus === 'valid' && (
                                  <>
                                    <i className="bi bi-patch-check-fill me-2"></i>Document Verified
                                  </>
                                )}
                                {pax.docStatus === 'invalid' && (
                                  <>
                                    <i className="bi bi-x-octagon-fill me-2"></i>Document Verification Failed
                                  </>
                                )}
                              </div>
                              <div className="text-light opacity-90">{pax.docMessage}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={agregarPasajero}
                className="btn btn-outline-light w-100 py-3 rounded-0 text-uppercase fw-bold mt-2"
                style={{ borderStyle: 'dashed', letterSpacing: '1px', fontSize: '0.85rem' }}
              >
                <i className="bi bi-plus-circle me-2"></i>Add Another Passenger
              </button>
            </div>

            {/* COLUMNA DERECHA: RESUMEN DEL SERVICIO Y CONFIRMACIÓN */}
            <div className="col-lg-5">
              <div className="position-sticky" style={{ top: '24px' }}>
                <div className="card bg-dark text-light border border-secondary rounded-0 shadow-lg mb-4">
                  <div className="position-relative" style={{ height: '210px' }}>
                    <span
                      className="position-absolute top-0 start-0 m-3 badge rounded-0 text-uppercase fw-bold"
                      style={{ backgroundColor: 'var(--tp-gold)', color: '#000', letterSpacing: '1px' }}
                    >
                      {servicio.categoria}
                    </span>
                    <img
                      src={
                        servicio.imagen ||
                        servicio.img ||
                        'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=600&q=80'
                      }
                      className="w-100 h-100 object-fit-cover rounded-0"
                      alt={servicio.titulo}
                    />
                  </div>

                  <div className="card-body p-4">
                    <h4 className="fw-bold text-white text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>
                      {servicio.titulo}
                    </h4>
                    <p className="text-light opacity-75 small mb-4" style={{ lineHeight: '1.6' }}>
                      {servicio.descripcion}
                    </p>

                    <div className="p-3 bg-black border border-secondary mb-4 small">
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-light opacity-75 text-uppercase">Travel Date:</span>
                        <span className="text-white fw-bold">{datosViaje.fecha_viaje || 'Not selected'}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-light opacity-75 text-uppercase">Pick-up Spot:</span>
                        <span className="text-white fw-bold text-end" style={{ maxWidth: '60%' }}>
                          {datosViaje.punto_pickup || 'Pin on map'}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span className="text-light opacity-75 text-uppercase">Passengers:</span>
                        <span className="text-white fw-bold">{pasajeros.length} Pax</span>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center pt-2 border-top border-secondary">
                      <span className="text-uppercase fw-bold small" style={{ letterSpacing: '1px' }}>
                        Estimated Total (USD)
                      </span>
                      <span className="fw-bold fs-2" style={{ color: 'var(--tp-gold)' }}>
                        ${estimatedTotal}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn w-100 py-3 fw-bold text-uppercase rounded-0 shadow"
                  style={{
                    backgroundColor: 'var(--tp-gold)',
                    color: '#000',
                    letterSpacing: '1.5px',
                    fontSize: '0.95rem',
                  }}
                >
                  {submitting ? 'Processing Reservation...' : 'Confirm Reservation'}
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
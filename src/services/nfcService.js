/**
 * nfcService.js — Real Web NFC API (NDEFReader)
 *
 * Uses the Web NFC API available in Chrome for Android.
 * Cards are identified by their hardware serial number.
 *
 * Compatibility:
 *   ✅ Chrome for Android (version 89+)
 *   ❌ Chrome Desktop (Windows/macOS)
 *   ❌ Firefox (any platform)
 *   ❌ Safari / iOS
 *
 * Requirement: Page must be served over HTTPS or localhost.
 * For LAN testing from a phone, use `npm run dev -- --host` and access via HTTPS
 * or via a tunneling tool like ngrok.
 */

import axios from 'axios';

const API_URL = `http://${window.location.hostname}:3001/api`;

let _abortController = null;
let _reader = null;

// ── Result builder (Ahora asíncrono para consultar al servidor) ──────────────


// ── NDEF record decoder ──────────────────────────────────────────────────────

function decodeRecords(message) {
  if (!message?.records) return [];
  return message.records.map(record => {
    let decoded = null;
    try {
      if (record.recordType === 'text') {
        const lang = record.lang ?? 'es';
        decoded = new TextDecoder().decode(record.data);
      } else if (record.recordType === 'url') {
        decoded = new TextDecoder().decode(record.data);
      } else if (record.recordType === 'mime') {
        decoded = `[${record.mediaType}]`;
      }
    } catch (_) {}
    return {
      recordType: record.recordType,
      mediaType: record.mediaType ?? null,
      decoded,
    };
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

export const nfcService = {
  /**
   * Returns true if the Web NFC API is available in this browser.
   */
  isSupported() {
    return typeof window !== 'undefined' && 'NDEFReader' in window;
  },

  /**
   * Begin scanning for NFC tags.
   * @param {(result: ScanResult) => void} onScan     - called on each tag read
   * @param {(error: string) => void}      onError    - called on permission/read errors
   * @param {object}                       scanConfig - { status, poolName, serviceName }
   */
  async startScan(onScan, onError, scanConfig = {}) {
    if (!this.isSupported()) {
      onError?.('Web NFC no está disponible en este navegador. Usa Chrome en Android.');
      return;
    }

    try {
      _abortController = new AbortController();
      _reader = new NDEFReader();

      _reader.addEventListener('reading', async ({ serialNumber, message }) => {
        const records = decodeRecords(message);
        const result = await processScanResult(serialNumber, records, scanConfig);
        onScan(result);
      });

      _reader.addEventListener('readingerror', (event) => {
        onError?.(`Error al leer la tarjeta: ${event.message ?? 'Error desconocido'}`);
      });

      await _reader.scan({ signal: _abortController.signal });
    } catch (err) {
      if (err.name === 'AbortError') return; // Normal stop
      if (err.name === 'NotAllowedError') {
        onError?.('Permiso denegado. Activa NFC en tu dispositivo y concede acceso al navegador.');
      } else if (err.name === 'NotSupportedError') {
        onError?.('NFC no está soportado o está desactivado en este dispositivo.');
      } else {
        onError?.(err.message ?? 'Error desconocido al iniciar el escáner NFC.');
      }
    }
  },

  /**
   * Stop the active scan session.
   */
  stopScan() {
    if (_abortController) {
      _abortController.abort();
      _abortController = null;
    }
    _reader = null;
  },

  /**
   * Read a single NFC tag (used during user registration).
   */
  readOneCard() {
    if (!this.isSupported()) {
      return Promise.reject(new Error(
        'Web NFC no está disponible en este navegador. Usa Chrome en Android.'
      ));
    }

    return new Promise(async (resolve, reject) => {
      let tempReader;
      let tempController;

      try {
        tempController = new AbortController();
        tempReader = new NDEFReader();

        tempReader.addEventListener('reading', ({ serialNumber }) => {
          tempController.abort();
          resolve(serialNumber);
        }, { once: true });

        tempReader.addEventListener('readingerror', (event) => {
          tempController.abort();
          reject(new Error(event.message ?? 'Error al leer la tarjeta'));
        }, { once: true });

        await tempReader.scan({ signal: tempController.signal });
      } catch (err) {
        if (err.name !== 'AbortError') {
          reject(err);
        }
      }
    });
  },

  /**
   * Returns the current state: 'scanning' | 'idle'
   */
  get isScanning() {
    return _abortController !== null && !_abortController.signal.aborted;
  },
};

// ── Result builder (Asíncrono) ────────────────────────────────────────────────

async function processScanResult(serialNumber, records = [], scanConfig = {}) {
  const now = new Date();
  const scanTime = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const scanDate = now.toISOString().split('T')[0];

  try {
    // 1. Validar usuario en el servidor pasando actividad seleccionada
    const { activityId, activityType } = scanConfig;
    const query = (activityId && activityType) ? `?activityId=${activityId}&activityType=${activityType}` : '';
    const res = await axios.get(`${API_URL}/users/validate/${serialNumber}${query}`);
    const validation = res.data; 
    // validation = { user, lastPaymentDate, daysRemaining, statusIndicator, errorMessage }

    return {
      nfcCard: serialNumber,
      userId: validation.user.id,
      userName: validation.user.name,
      membership: validation.user.membership,
      userStatus: validation.user.status,
      photoInitials: validation.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
      scanTime,
      scanDate,
      success: validation.statusIndicator !== 'rojo',
      errorMessage: validation.errorMessage, // Usar el error que viene del backend
      rawRecords: records,
      status: scanConfig.status || 'entrada',
      validationData: validation
    };
  } catch (err) {
    const is404 = err.response?.status === 404;
    return {
      nfcCard: serialNumber,
      userId: null,
      userName: is404 ? 'ID no registrado' : 'Error de Conexión',
      membership: null,
      userStatus: is404 ? 'desconocido' : 'error',
      photoInitials: '?',
      scanTime,
      scanDate,
      success: false,
      errorMessage: is404 
        ? `La tarjeta ${serialNumber} no existe.`
        : 'Error al contactar el servidor para validación.',
      rawRecords: records,
      status: scanConfig.status || 'entrada',
      validationData: null
    };
  }
}


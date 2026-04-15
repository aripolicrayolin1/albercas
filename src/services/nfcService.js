/**
 * nfcService.js — NFC híbrido: Nativo (Capacitor Android) + Web NFC (Chrome)
 *
 * Modo 1 — App nativa Capacitor:
 *   Usa el puente nativo de MainActivity.java que dispara el evento
 *   'nfc-tag-detected' en el WebView. No requiere permisos de navegador.
 *
 * Modo 2 — Chrome para Android (fallback):
 *   Usa la Web NFC API (NDEFReader). Solo disponible en Chrome ≥ 89.
 *   Requiere HTTPS o localhost.
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001/api`;

// ── Detectar si corremos dentro de la app nativa Capacitor ───────────────────

function isCapacitorNative() {
  return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
}

// ── Estado interno ─────────────────────────────────────────────────────────────

let _nativeListener = null;     // Listener del evento nativo
let _abortController = null;    // Para Web NFC
let _reader = null;             // NDEFReader de Web NFC

// ── Decodificador de registros NDEF (Web NFC) ─────────────────────────────────

function decodeRecords(message) {
  if (!message?.records) return [];
  return message.records.map(record => {
    let decoded = null;
    try {
      if (record.recordType === 'text' || record.recordType === 'url') {
        decoded = new TextDecoder().decode(record.data);
      } else if (record.recordType === 'mime') {
        decoded = `[${record.mediaType}]`;
      }
    } catch (_) {}
    return { recordType: record.recordType, mediaType: record.mediaType ?? null, decoded };
  });
}

// ── API pública ────────────────────────────────────────────────────────────────

export const nfcService = {

  isSupported() {
    // Soportado si: es app nativa Capacitor con NFC, O si hay NDEFReader en el navegador
    return isCapacitorNative() || (typeof window !== 'undefined' && 'NDEFReader' in window);
  },

  /**
   * Iniciar escaneo NFC.
   * @param {(result) => void} onScan
   * @param {(error: string) => void} onError
   * @param {object} scanConfig - { status, activityId, activityType }
   */
  async startScan(onScan, onError, scanConfig = {}) {

    if (isCapacitorNative()) {
      // ── MODO NATIVO: escuchar el evento disparado por MainActivity.java ──
      if (_nativeListener) {
        window.removeEventListener('nfc-tag-detected', _nativeListener);
      }

      _nativeListener = async (event) => {
        const serialNumber = event.detail?.serialNumber;
        if (!serialNumber) return;
        const result = await processScanResult(serialNumber, [], scanConfig);
        onScan(result);
      };

      window.addEventListener('nfc-tag-detected', _nativeListener);
      console.log('NFC nativo iniciado (Capacitor Android)');

    } else {
      // ── MODO WEB NFC (Chrome) ──────────────────────────────────────────────
      if (!('NDEFReader' in window)) {
        onError?.('Web NFC no está disponible. Usa Chrome en Android o la app nativa.');
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
        if (err.name === 'AbortError') return;
        if (err.name === 'NotAllowedError') {
          onError?.('Permiso denegado. Activa NFC en tu dispositivo y concede acceso al navegador.');
        } else if (err.name === 'NotSupportedError') {
          onError?.('NFC no está soportado o está desactivado en este dispositivo.');
        } else {
          onError?.(err.message ?? 'Error desconocido al iniciar el escáner NFC.');
        }
      }
    }
  },

  stopScan() {
    // Detener modo nativo
    if (_nativeListener) {
      window.removeEventListener('nfc-tag-detected', _nativeListener);
      _nativeListener = null;
    }
    // Detener Web NFC
    if (_abortController) {
      _abortController.abort();
      _abortController = null;
    }
    _reader = null;
  },

  /**
   * Leer una sola tarjeta (para registro de usuarios).
   */
  readOneCard() {
    if (isCapacitorNative()) {
      // En modo nativo: esperamos el siguiente evento
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          window.removeEventListener('nfc-tag-detected', handler);
          reject(new Error('Tiempo de espera agotado. Acerca la tarjeta NFC.'));
        }, 30000);

        const handler = (event) => {
          clearTimeout(timeout);
          window.removeEventListener('nfc-tag-detected', handler);
          const serialNumber = event.detail?.serialNumber;
          if (serialNumber) resolve(serialNumber);
          else reject(new Error('No se pudo leer el número de serie.'));
        };

        window.addEventListener('nfc-tag-detected', handler);
      });
    }

    // Fallback: Web NFC
    if (!('NDEFReader' in window)) {
      return Promise.reject(new Error('NFC no disponible en este navegador. Usa la app nativa.'));
    }

    return new Promise(async (resolve, reject) => {
      let tempController;
      try {
        tempController = new AbortController();
        const tempReader = new NDEFReader();

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
        if (err.name !== 'AbortError') reject(err);
      }
    });
  },

  get isScanning() {
    if (isCapacitorNative()) return _nativeListener !== null;
    return _abortController !== null && !_abortController.signal.aborted;
  },
};

// ── Procesador de resultado (consulta al backend) ─────────────────────────────

async function processScanResult(serialNumber, records = [], scanConfig = {}) {
  const now = new Date();
  const scanTime = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const scanDate = now.toISOString().split('T')[0];

  try {
    const { activityId, activityType } = scanConfig;
    const query = (activityId && activityType) ? `?activityId=${activityId}&activityType=${activityType}` : '';
    const res = await axios.get(`${API_URL}/users/validate/${serialNumber}${query}`);
    const validation = res.data;

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
      errorMessage: validation.errorMessage,
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
        ? `La tarjeta ${serialNumber} no está registrada en el sistema.`
        : 'Error al contactar el servidor para validación.',
      rawRecords: records,
      status: scanConfig.status || 'entrada',
      validationData: null
    };
  }
}

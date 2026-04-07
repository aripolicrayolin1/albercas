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

const STORAGE_KEY = 'app_users';

let _injectedUsers = null;
let _abortController = null;
let _reader = null;

// ── User store sync ──────────────────────────────────────────────────────────

export function setUserStore(users) {
  _injectedUsers = users;
}

function getUsers() {
  if (_injectedUsers) return _injectedUsers;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return [];
}

// ── Result builder ───────────────────────────────────────────────────────────

function buildScanResult(serialNumber, records = []) {
  const users = getUsers();
  const normalizedSerial = serialNumber?.toLowerCase?.() ?? serialNumber;
  const user = users.find(u =>
    u.nfcCard?.toLowerCase?.() === normalizedSerial
  );

  const now = new Date();
  const scanTime = now.toLocaleTimeString('es-MX', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const scanDate = now.toLocaleDateString('es-MX', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  if (!user) {
    return {
      nfcCard: serialNumber,
      userId: null,
      userName: 'Tarjeta No Registrada',
      membership: null,
      userStatus: 'desconocido',
      photoInitials: '?',
      scanTime,
      scanDate,
      success: false,
      errorMessage: `El número de serie ${serialNumber} no está vinculado a ningún usuario del sistema.`,
      rawRecords: records,
    };
  }

  const active = user.status === 'activo';

  return {
    nfcCard: serialNumber,
    userId: user.id,
    userName: user.name,
    membership: user.membership,
    userStatus: user.status,
    photoInitials: user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
    scanTime,
    scanDate,
    success: active,
    errorMessage: active
      ? null
      : 'Membresía inactiva. El usuario requiere renovación para poder ingresar.',
    rawRecords: records,
  };
}

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
   * @param {(result: ScanResult) => void} onScan  - called on each tag read
   * @param {(error: string) => void}      onError - called on permission/read errors
   * @returns {Promise<void>}
   */
  async startScan(onScan, onError) {
    if (!this.isSupported()) {
      onError?.('Web NFC no está disponible en este navegador. Usa Chrome en Android.');
      return;
    }

    try {
      _abortController = new AbortController();
      _reader = new NDEFReader();

      _reader.addEventListener('reading', ({ serialNumber, message }) => {
        const records = decodeRecords(message);
        onScan(buildScanResult(serialNumber, records));
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
   * Returns a Promise that resolves with the tag's serial number.
   * Automatically stops listening after the first successful read.
   *
   * @returns {Promise<string>} Serial number of the tapped card
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

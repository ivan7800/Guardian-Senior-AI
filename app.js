'use strict';

const $ = (id) => document.getElementById(id);

const VERSION = 'v6.1';
const storeKey = 'guardianSeniorAIConfigV6';
const logKey = 'guardianSeniorAILogV6';
const pinKey = 'guardianSeniorAIPinV6';
const modeKey = 'guardianSeniorAIModeV6';
const attemptKey = 'guardianSeniorAIPinAttemptsV6';
const AUTO_LOCK_MS = 5 * 60 * 1000;

const legacyKeys = {
  config: ['guardianSeniorAIConfigV5', 'guardianSeniorAIConfigV4'],
  log: ['guardianSeniorAILogV5', 'guardianSeniorAILogV4'],
  pin: ['guardianSeniorAIPinV5', 'guardianSeniorAIPinV4'],
  mode: ['guardianSeniorAIModeV5', 'guardianSeniorAIModeV4']
};

const emergencyWords = [
  'caido', 'caida', 'me he caido', 'me he caído', 'no puedo levantarme', 'no puedo moverme',
  'no puedo respirar', 'no puedo caminar', 'no puedo andar', 'ayuda', 'socorro', 'emergencia',
  'dolor pecho', 'dolor en el pecho', 'me duele el pecho', 'presion en el pecho', 'infarto',
  'ictus', 'mareo fuerte', 'me ahogo', 'me falta el aire', 'no respiro', 'sangre',
  'inconsciente', 'muy mal', 'me encuentro mal', 'he perdido el conocimiento', 'ambulancia'
];

let lastEmergencyMessage = '';
let unlocked = false;
let sessionPin = '';
let lastSpokenText = 'Sin mensajes todavía.';
let autoLockTimer = null;

function normalizeText(text) {
  return String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function escapeHtml(str) {
  return String(str).replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
}

function storageGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function storageSet(key, value) {
  try { localStorage.setItem(key, value); return true; } catch { return false; }
}

function storageRemove(key) {
  try { localStorage.removeItem(key); } catch {}
}

function safeJsonParse(raw, fallback) {
  if (!raw) return fallback;
  try {
    const value = JSON.parse(raw);
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function storageAvailable() {
  try {
    const key = '__guardian_storage_test__';
    localStorage.setItem(key, '1');
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function cryptoAvailable() {
  return Boolean(window.crypto && crypto.subtle && window.TextEncoder && window.TextDecoder && crypto.getRandomValues);
}

function setStatus(text) {
  $('systemStatus').textContent = text;
}

function sanitizePhone(phone) {
  return String(phone || '').replace(/[^+0-9]/g, '').replace(/(?!^)\+/g, '').slice(0, 18);
}

function maskPhone(phone) {
  const clean = sanitizePhone(phone);
  if (!clean) return 'No configurado';
  return `••• ••• ${clean.slice(-3)}`;
}

function getConfig() {
  const value = safeJsonParse(storageGet(storeKey), {});
  return typeof value === 'object' && value && !Array.isArray(value) ? value : {};
}

function setConfig(config) {
  if (!storageSet(storeKey, JSON.stringify(config))) {
    alert('No se pudo guardar. Revisa que el navegador permita almacenamiento local.');
    return false;
  }
  return true;
}

function getLogs() {
  const value = safeJsonParse(storageGet(logKey), []);
  return Array.isArray(value) ? value : [];
}

function migrateLegacy() {
  if (!storageGet(storeKey)) {
    const oldConfigKey = legacyKeys.config.find((key) => storageGet(key));
    if (oldConfigKey) storageSet(storeKey, storageGet(oldConfigKey));
  }
  if (!storageGet(logKey)) {
    const oldLogKey = legacyKeys.log.find((key) => storageGet(key));
    if (oldLogKey) storageSet(logKey, storageGet(oldLogKey));
  }
  if (!storageGet(pinKey)) {
    const oldPinKey = legacyKeys.pin.find((key) => storageGet(key));
    if (oldPinKey) storageSet(pinKey, storageGet(oldPinKey));
  }
  if (!storageGet(modeKey)) {
    const oldModeKey = legacyKeys.mode.find((key) => storageGet(key));
    if (oldModeKey) storageSet(modeKey, storageGet(oldModeKey));
  }
}

function randomBytes(len = 16) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return bytes;
}

function bytesToB64(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

function b64ToBytes(b64) {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function bytesToHex(bytes) {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function constantTimeEqual(a, b) {
  const left = String(a || '');
  const right = String(b || '');
  let diff = left.length ^ right.length;
  const len = Math.max(left.length, right.length);
  for (let i = 0; i < len; i += 1) {
    diff |= (left.charCodeAt(i) || 0) ^ (right.charCodeAt(i) || 0);
  }
  return diff === 0;
}

function sanitizeMessageText(text, max = 240) {
  return String(text || '').replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

async function deriveBits(pin, saltB64, iterations = 210000) {
  if (!cryptoAvailable()) throw new Error('Crypto API no disponible');
  const imported = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits', 'deriveKey']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', salt: b64ToBytes(saltB64), iterations, hash: 'SHA-256' }, imported, 256);
}

async function pbkdf2Hash(pin, saltB64, iterations = 210000) {
  return bytesToHex(await deriveBits(pin, saltB64, iterations));
}

async function aesKeyFromPin(pin, saltB64, iterations = 210000) {
  if (!cryptoAvailable()) throw new Error('Crypto API no disponible');
  const imported = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: b64ToBytes(saltB64), iterations, hash: 'SHA-256' },
    imported,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptText(text, pin, saltB64, iterations = 210000) {
  const key = await aesKeyFromPin(pin, saltB64, iterations);
  const iv = randomBytes(12);
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(String(text || '')));
  return { alg: 'AES-GCM', iv: bytesToB64(iv), data: bytesToB64(cipher), iterations };
}

async function decryptText(payload, pin, saltB64, iterations = 210000) {
  if (!payload || !payload.data || !payload.iv) return '';
  const key = await aesKeyFromPin(pin, saltB64, iterations);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64ToBytes(payload.iv) }, key, b64ToBytes(payload.data));
  return new TextDecoder().decode(plain);
}

function getPinData() {
  const data = safeJsonParse(storageGet(pinKey), null);
  return data && typeof data === 'object' ? data : null;
}

function getAttempts() {
  const data = safeJsonParse(storageGet(attemptKey), { count: 0, until: 0 });
  return data && typeof data === 'object' ? data : { count: 0, until: 0 };
}

function setAttempts(value) {
  storageSet(attemptKey, JSON.stringify(value));
}

function isLockedOut() {
  return Date.now() < Number(getAttempts().until || 0);
}

function lockoutText() {
  const seconds = Math.ceil((Number(getAttempts().until || 0) - Date.now()) / 1000);
  return seconds > 0 ? `Demasiados intentos. Espera ${seconds} segundos.` : '';
}

function noteFailedAttempt() {
  const attempts = getAttempts();
  attempts.count = Number(attempts.count || 0) + 1;
  if (attempts.count >= 5) {
    attempts.until = Date.now() + 60000;
    attempts.count = 0;
  }
  setAttempts(attempts);
}

function clearAttempts() {
  storageRemove(attemptKey);
}

async function createPin() {
  const pin = $('newPin').value.trim();
  if (!/^\d{6,8}$/.test(pin)) return alert('El PIN nuevo debe tener entre 6 y 8 números.');
  if (!storageAvailable()) return alert('El navegador no permite almacenamiento local. No se puede guardar el PIN.');
  if (!cryptoAvailable()) return alert('Este navegador no permite crear un PIN seguro. Usa Safari/Chrome actualizado en HTTPS o localhost.');

  try {
    const salt = bytesToB64(randomBytes(16));
    const iterations = 210000;
    const hash = await pbkdf2Hash(pin, salt, iterations);
    storageSet(pinKey, JSON.stringify({ salt, hash, iterations, algo: 'PBKDF2-SHA256', version: VERSION }));
    sessionPin = pin;
    $('newPin').value = '';
    unlocked = true;
    clearAttempts();
    refreshLockUi();
    await populateSensitiveFields();
    scheduleAutoLock();
    logEvent('PIN familiar creado', 'security');
    speak('PIN creado. Ajustes desbloqueados.');
  } catch {
    alert('No se pudo crear el PIN seguro en este navegador.');
  }
}

async function unlockSettings() {
  if (isLockedOut()) {
    $('pinHelp').textContent = lockoutText();
    return;
  }
  const data = getPinData();
  if (!data) return refreshLockUi();
  const pin = $('pinInput').value.trim();
  if (!/^\d{4,8}$/.test(pin)) {
    $('pinHelp').textContent = 'Introduce un PIN válido.';
    return;
  }
  try {
    const hash = await pbkdf2Hash(pin, data.salt, data.iterations || 210000);
    if (!constantTimeEqual(hash, data.hash)) {
      noteFailedAttempt();
      $('pinInput').value = '';
      $('pinHelp').textContent = lockoutText() || 'PIN incorrecto.';
      logEvent('Intento de desbloqueo fallido', 'security');
      return;
    }
    sessionPin = pin;
    $('pinInput').value = '';
    unlocked = true;
    clearAttempts();
    refreshLockUi();
    await populateSensitiveFields();
    scheduleAutoLock();
    logEvent('Ajustes desbloqueados', 'security');
  } catch {
    alert('No se pudo comprobar el PIN en este navegador.');
  }
}

function scheduleAutoLock() {
  if (autoLockTimer) clearTimeout(autoLockTimer);
  autoLockTimer = null;
  if (!unlocked) return;
  autoLockTimer = setTimeout(() => {
    if (!unlocked) return;
    logEvent('Ajustes bloqueados automáticamente por inactividad', 'security');
    lockSettings(false);
  }, AUTO_LOCK_MS);
}

function resetAutoLock() {
  if (unlocked) scheduleAutoLock();
}

function lockSettings(announce = true) {
  if (autoLockTimer) clearTimeout(autoLockTimer);
  autoLockTimer = null;
  unlocked = false;
  sessionPin = '';
  $('pinInput').value = '';
  $('medication').value = '';
  refreshLockUi();
  if (announce) speak('Ajustes bloqueados.');
}

function refreshLockUi() {
  const hasPin = Boolean(getPinData());
  $('pinSetup').classList.toggle('hidden', hasPin);
  $('pinGate').classList.toggle('hidden', !hasPin || unlocked);
  $('settingsPanel').classList.toggle('hidden', !unlocked);
  $('lockState').textContent = unlocked ? 'Desbloqueada' : 'Bloqueada';
  $('lockState').className = unlocked ? 'pill unlocked' : 'pill locked';
  $('pinHelp').textContent = isLockedOut() ? lockoutText() : '';
}

async function populateSensitiveFields() {
  const config = getConfig();
  $('elderName').value = config.elderName || '';
  $('phone1').value = config.phone1 || '';
  $('phone2').value = config.phone2 || '';
  $('emergencyText').value = config.emergencyText || $('emergencyText').value;

  if (!unlocked || !sessionPin) {
    $('medication').value = '';
    return;
  }

  const pinData = getPinData();
  if (!pinData) return;

  if (config.medicationEncrypted) {
    try {
      $('medication').value = await decryptText(config.medicationEncrypted, sessionPin, pinData.salt, pinData.iterations || 210000);
    } catch {
      $('medication').value = '';
      alert('No se pudo descifrar la medicación. Comprueba el PIN.');
    }
  } else if (config.medication) {
    $('medication').value = String(config.medication).slice(0, 700);
    try {
      config.medicationEncrypted = await encryptText(config.medication, sessionPin, pinData.salt, pinData.iterations || 210000);
      delete config.medication;
      setConfig(config);
      logEvent('Notas médicas migradas a formato cifrado', 'security');
    } catch {
      alert('No se pudieron migrar las notas médicas a cifrado.');
    }
  } else {
    $('medication').value = '';
  }
}

function validatePhoneForWarning(phone) {
  const clean = sanitizePhone(phone);
  if (!clean) return true;
  return /^\+?\d{6,18}$/.test(clean);
}

async function saveConfig() {
  if (!unlocked || !sessionPin) return alert('Desbloquea los ajustes con el PIN familiar.');
  if (!validatePhoneForWarning($('phone1').value) || !validatePhoneForWarning($('phone2').value)) {
    return alert('Revisa los teléfonos. Usa solo números y, si quieres, + al principio.');
  }
  const pinData = getPinData();
  if (!pinData) return alert('Crea primero un PIN familiar.');

  try {
    const encryptedMedication = await encryptText($('medication').value.trim().slice(0, 700), sessionPin, pinData.salt, pinData.iterations || 210000);
    const config = {
      elderName: sanitizeMessageText($('elderName').value, 60),
      phone1: sanitizePhone($('phone1').value),
      phone2: sanitizePhone($('phone2').value),
      medicationEncrypted: encryptedMedication,
      emergencyText: sanitizeMessageText($('emergencyText').value, 240) || 'Necesito ayuda. Puede que me haya caído o me encuentre mal.',
      updatedAt: new Date().toISOString(),
      version: VERSION
    };
    if (!setConfig(config)) return;
    logEvent('Configuración actualizada', 'config');
    updateShortcutUrl();
    renderMaskedSummary();
    runSelfTest(false);
    scheduleAutoLock();
    speak('Configuración guardada.');
  } catch {
    alert('No se pudo cifrar y guardar la configuración.');
  }
}

function loadConfig() {
  migrateLegacy();
  const config = getConfig();
  $('elderName').value = '';
  $('phone1').value = '';
  $('phone2').value = '';
  $('medication').value = '';
  $('emergencyText').value = config.emergencyText || $('emergencyText').value;
  updateShortcutUrl();
  renderMaskedSummary();
  refreshLockUi();
  applySavedModes();
  renderEnvironmentBanner();
}

function renderMaskedSummary() {
  const config = getConfig();
  const name = config.elderName ? escapeHtml(config.elderName) : 'Persona no configurada';
  const med = config.medicationEncrypted || config.medication ? 'Notas médicas protegidas' : 'Sin notas médicas';
  $('maskedSummary').innerHTML = `<strong>${name}</strong><br>Familiar 1: ${maskPhone(config.phone1)}<br>Familiar 2: ${maskPhone(config.phone2)}<br>${med}<br><span class="muted small">Los teléfonos se guardan localmente sin cifrar para poder llamar sin PIN en emergencia.</span>`;
}

function logEvent(text, type = 'event') {
  const logs = getLogs();
  logs.unshift({ text: String(text).slice(0, 130), type, iso: new Date().toISOString() });
  storageSet(logKey, JSON.stringify(logs.slice(0, 80)));
  renderLog();
}

function renderLog() {
  const logs = getLogs();
  $('eventLog').innerHTML = logs.map((item) => {
    const date = item.iso ? new Date(item.iso).toLocaleString('es-ES') : escapeHtml(item.date || 'Fecha no disponible');
    return `<li><strong>${escapeHtml(date)}</strong> — ${escapeHtml(item.text)}</li>`;
  }).join('') || '<li>Sin eventos.</li>';
}

function speak(text) {
  lastSpokenText = String(text || '');
  if (!('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(lastSpokenText);
    utterance.lang = 'es-ES';
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  } catch {}
}

function getLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 60000 }
    );
  });
}

function locationText(coords) {
  if (!coords) return 'Ubicación no disponible';
  const lat = Number(coords.latitude).toFixed(6);
  const lon = Number(coords.longitude).toFixed(6);
  return `Ubicación: https://maps.google.com/?q=${lat},${lon}`;
}

function buildEmergencyMessage(reason = '', coords = null) {
  const config = getConfig();
  const name = sanitizeMessageText(config.elderName, 60) || 'La persona';
  const base = sanitizeMessageText(config.emergencyText, 240) || 'Necesito ayuda. Puede que me haya caído o me encuentre mal.';
  const reasonText = reason ? ` Motivo: ${sanitizeMessageText(reason, 90)}.` : '';
  return `${name}: ${base}${reasonText} ${locationText(coords)}`;
}

function openModal(dialog) {
  if (typeof dialog.showModal === 'function') {
    if (!dialog.open) dialog.showModal();
  } else {
    dialog.setAttribute('open', 'open');
  }
}

function closeModal(dialog) {
  if (typeof dialog.close === 'function') dialog.close();
  else dialog.removeAttribute('open');
}

async function activateEmergency(reason = 'Emergencia manual') {
  setStatus('Emergencia');
  lastEmergencyMessage = buildEmergencyMessage(reason, null);
  $('emergencySummary').textContent = 'Preparando aviso y solicitando ubicación si el navegador lo permite...';
  const config = getConfig();
  $('callPrimaryBtn').disabled = !config.phone1;
  $('callSecondaryBtn').disabled = !config.phone2;
  $('sendSmsBtn').disabled = !config.phone1;
  $('sendSms2Btn').disabled = !config.phone2;
  openModal($('emergencyDialog'));
  logEvent(`Emergencia activada: ${String(reason).slice(0, 60)}`, 'emergency');
  speak('Emergencia activada. Puedes llamar al 112, llamar a la familia o enviar un mensaje.');

  const coords = await getLocation();
  lastEmergencyMessage = buildEmergencyMessage(reason, coords);
  $('emergencySummary').textContent = lastEmergencyMessage;
}

function callNumber(phone) {
  const clean = sanitizePhone(phone);
  if (!clean) return alert('Teléfono no configurado.');
  window.location.href = `tel:${clean}`;
}

function callPrimary() { callNumber(getConfig().phone1); }
function callSecondary() { callNumber(getConfig().phone2); }
function call112() { window.location.href = 'tel:112'; }

function smsHref(phone, body) {
  const clean = sanitizePhone(phone);
  const separator = /iPad|iPhone|iPod/i.test(navigator.userAgent) ? '&' : '?';
  return `sms:${clean}${separator}body=${encodeURIComponent(body)}`;
}

function sendSmsTo(phone) {
  const clean = sanitizePhone(phone);
  if (!clean) return alert('Configura primero un teléfono familiar.');
  window.location.href = smsHref(clean, lastEmergencyMessage || $('emergencyText').value);
}

function sendSms() { sendSmsTo(getConfig().phone1); }
function sendSms2() { sendSmsTo(getConfig().phone2); }

async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}
  const tmp = document.createElement('textarea');
  tmp.value = text;
  tmp.setAttribute('readonly', '');
  tmp.style.position = 'fixed';
  tmp.style.left = '-9999px';
  document.body.appendChild(tmp);
  tmp.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch { ok = false; }
  tmp.remove();
  return ok;
}

async function copyEmergencyMessage() {
  const ok = await copyText(lastEmergencyMessage || '');
  if (ok) speak('Mensaje copiado.');
  else alert('No se pudo copiar automáticamente.');
}

async function prepareSmsTest() {
  if (!unlocked) return alert('Desbloquea los ajustes para hacer pruebas.');
  lastEmergencyMessage = buildEmergencyMessage('Prueba de funcionamiento', await getLocation());
  $('emergencySummary').textContent = lastEmergencyMessage;
  sendSms();
}

function analyzeText(text) {
  const cleanText = String(text || '').trim().slice(0, 300);
  if (!cleanText) {
    $('analysisBox').innerHTML = '<strong>Mensaje vacío.</strong> Escribe o dicta qué ocurre antes de analizar.';
    speak('No hay ningún mensaje para analizar.');
    return;
  }
  const normalized = normalizeText(cleanText);
  const risk = emergencyWords.some((word) => normalized.includes(normalizeText(word)));
  if (risk) {
    $('analysisBox').innerHTML = '<strong>Riesgo detectado.</strong> Si hay peligro inmediato, llama al 112. También puedes avisar a un familiar.';
    activateEmergency(cleanText);
  } else {
    $('analysisBox').innerHTML = '<strong>No parece emergencia.</strong> Se registra como comprobación normal.';
    logEvent('Mensaje analizado sin emergencia', 'check');
    speak('No parece una emergencia. Queda registrado.');
  }
}

function startListening() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return alert('Este navegador no soporta reconocimiento de voz. En iPhone usa Siri con Atajos o escribe el mensaje.');
  const recognition = new SpeechRecognition();
  recognition.lang = 'es-ES';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  setStatus('Escuchando');
  speak('Te escucho. Dime qué ocurre.');
  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    $('messageInput').value = text;
    setStatus('Analizando');
    analyzeText(text);
  };
  recognition.onerror = () => setStatus('Lista');
  recognition.onend = () => setStatus('Lista');
  recognition.start();
}

function updateShortcutUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set('sos', '1');
  $('shortcutUrl').textContent = url.href;
}

function exportLog() {
  if (!unlocked) return alert('Desbloquea los ajustes para exportar el registro.');
  const blob = new Blob([storageGet(logKey) || '[]'], { type: 'application/json' });
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = 'guardian-senior-ai-registro.json';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(anchor.href), 1000);
}

function clearLog() {
  if (!unlocked) return alert('Desbloquea los ajustes para borrar el registro.');
  if (!confirm('¿Borrar el registro local?')) return;
  storageRemove(logKey);
  renderLog();
}

async function wipeAllData() {
  const stored = getPinData();
  if (stored) {
    if (!cryptoAvailable()) return alert('No se puede verificar el PIN en este navegador.');
    const pin = prompt('Introduce el PIN familiar para borrar todos los datos:');
    if (!pin) return;
    try {
      const hash = await pbkdf2Hash(pin, stored.salt, stored.iterations || 210000);
      if (!constantTimeEqual(hash, stored.hash)) return alert('PIN incorrecto. No se ha borrado nada.');
    } catch {
      return alert('No se pudo verificar el PIN. No se ha borrado nada.');
    }
  }
  if (!confirm('Esto eliminará contactos, medicación, PIN e historial de este dispositivo. ¿Continuar?')) return;
  [storeKey, logKey, pinKey, modeKey, attemptKey, ...legacyKeys.config, ...legacyKeys.log, ...legacyKeys.pin, ...legacyKeys.mode].forEach(storageRemove);
  unlocked = false;
  sessionPin = '';
  loadConfig();
  renderLog();
  runSelfTest(false);
  speak('Datos borrados.');
}

function applySavedModes() {
  const modes = safeJsonParse(storageGet(modeKey), {});
  document.body.classList.toggle('high-contrast', Boolean(modes.highContrast));
  document.body.classList.toggle('simple-mode', Boolean(modes.simpleMode));
  $('toggleMode').setAttribute('aria-pressed', String(Boolean(modes.highContrast)));
  $('toggleSimpleMode').setAttribute('aria-pressed', String(Boolean(modes.simpleMode)));
}

function saveModes() {
  const modes = {
    highContrast: document.body.classList.contains('high-contrast'),
    simpleMode: document.body.classList.contains('simple-mode')
  };
  storageSet(modeKey, JSON.stringify(modes));
  $('toggleMode').setAttribute('aria-pressed', String(modes.highContrast));
  $('toggleSimpleMode').setAttribute('aria-pressed', String(modes.simpleMode));
}

function renderEnvironmentBanner() {
  const warnings = [];
  if (!storageAvailable()) warnings.push('el navegador no permite almacenamiento local');
  if (!cryptoAvailable()) warnings.push('no está disponible el cifrado seguro');
  if (!window.isSecureContext && location.protocol !== 'file:') warnings.push('usa HTTPS para máxima compatibilidad');
  if (warnings.length) {
    $('environmentBanner').classList.add('warning');
    $('environmentBanner').innerHTML = `<strong>Atención:</strong> ${escapeHtml(warnings.join(', '))}. Para uso real, pruébala en Safari/Chrome actualizado y, mejor, desde GitHub Pages HTTPS.`;
  } else {
    $('environmentBanner').classList.remove('warning');
    $('environmentBanner').innerHTML = '<strong>Privacidad:</strong> los datos se guardan en este navegador. La app no usa servidores, analíticas, cookies externas ni IA externa. La ubicación solo se pide al activar una emergencia o una prueba.';
  }
}

function featureStatus(ok, label, detail = '') {
  return `<li class="${ok ? 'ok' : 'warn'}"><strong>${ok ? '✓' : '!'}</strong> ${escapeHtml(label)}${detail ? `<br><span class="small">${escapeHtml(detail)}</span>` : ''}</li>`;
}

function runSelfTest(speakResult = true) {
  const config = getConfig();
  const items = [];
  items.push(featureStatus(storageAvailable(), 'Almacenamiento local', 'Necesario para guardar contactos, PIN e historial.'));
  items.push(featureStatus(cryptoAvailable(), 'Cifrado Web Crypto', 'Necesario para PIN PBKDF2 y notas médicas cifradas.'));
  const pinData = getPinData();
  const pinStrengthText = pinData ? (pinData.version === VERSION ? 'PIN nuevo reforzado.' : 'PIN heredado detectado: funciona, pero se recomienda reinstalar con PIN de 6–8 dígitos.') : 'Imprescindible antes de entregar la app.';
  items.push(featureStatus(Boolean(pinData), 'PIN familiar configurado', pinStrengthText));
  items.push(featureStatus(Boolean(config.phone1), 'Familiar principal configurado', 'Necesario para llamadas y SMS familiares.'));
  items.push(featureStatus(Boolean(navigator.geolocation), 'Geolocalización disponible', 'La ubicación se pedirá solo en emergencia o prueba.'));
  items.push(featureStatus('speechSynthesis' in window, 'Lectura de voz disponible'));
  items.push(featureStatus(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition), 'Dictado por voz del navegador', 'En iPhone suele ser mejor usar Siri + Atajos.'));
  items.push(featureStatus('serviceWorker' in navigator, 'PWA / Service Worker soportado', location.protocol === 'file:' ? 'En modo archivo no se registra; en GitHub Pages sí.' : ''));
  $('selfTestList').innerHTML = items.join('');
  if (speakResult) speak('Diagnóstico completado. Revisa los avisos en pantalla.');
}

function showInstallHelp() {
  openModal($('installDialog'));
}

function bindEvents() {
  $('createPinBtn').addEventListener('click', createPin);
  $('unlockBtn').addEventListener('click', unlockSettings);
  $('lockBtn').addEventListener('click', lockSettings);
  $('saveConfigBtn').addEventListener('click', saveConfig);
  $('sosBtn').addEventListener('click', () => activateEmergency('Botón SOS'));
  $('call112Btn').addEventListener('click', call112);
  $('safeBtn').addEventListener('click', () => {
    logEvent('La persona indicó que está bien', 'safe');
    speak('Me alegro. Queda registrado que estás bien.');
    setStatus('Bien');
  });
  $('listenBtn').addEventListener('click', startListening);
  $('analyzeBtn').addEventListener('click', () => analyzeText($('messageInput').value || ''));
  $('readLastBtn').addEventListener('click', () => speak(lastSpokenText || $('analysisBox').textContent));
  $('testSmsBtn').addEventListener('click', prepareSmsTest);
  $('modalCall112Btn').addEventListener('click', call112);
  $('callPrimaryBtn').addEventListener('click', callPrimary);
  $('callSecondaryBtn').addEventListener('click', callSecondary);
  $('sendSmsBtn').addEventListener('click', sendSms);
  $('sendSms2Btn').addEventListener('click', sendSms2);
  $('copyMsgBtn').addEventListener('click', copyEmergencyMessage);
  $('closeDialogBtn').addEventListener('click', () => { closeModal($('emergencyDialog')); setStatus('Lista'); });
  $('emergencyDialog').addEventListener('cancel', () => setStatus('Lista'));
  $('emergencyDialog').addEventListener('close', () => { if ($('systemStatus').textContent === 'Emergencia') setStatus('Lista'); });
  $('closeInstallDialogBtn').addEventListener('click', () => closeModal($('installDialog')));
  $('clearLogBtn').addEventListener('click', clearLog);
  $('exportLogBtn').addEventListener('click', exportLog);
  $('wipeDataBtn').addEventListener('click', wipeAllData);
  $('selfTestBtn').addEventListener('click', () => runSelfTest(true));
  $('installHelpBtn').addEventListener('click', showInstallHelp);
  $('toggleMode').addEventListener('click', () => { document.body.classList.toggle('high-contrast'); saveModes(); });
  $('toggleSimpleMode').addEventListener('click', () => { document.body.classList.toggle('simple-mode'); saveModes(); });
  ['elderName', 'phone1', 'phone2', 'medication', 'emergencyText', 'pinInput'].forEach((id) => {
    const element = $(id);
    if (element) element.addEventListener('input', resetAutoLock);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && unlocked) {
      logEvent('Ajustes bloqueados al cambiar de app o pestaña', 'security');
      lockSettings(false);
    }
  });
  $('copyShortcutBtn').addEventListener('click', async () => {
    const ok = await copyText($('shortcutUrl').textContent);
    if (ok) speak('Enlace copiado.');
    else alert('No se pudo copiar automáticamente. Mantén pulsado el enlace y cópialo manualmente.');
  });
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

function init() {
  bindEvents();
  loadConfig();
  renderLog();
  runSelfTest(false);
  registerServiceWorker();
  if (new URLSearchParams(location.search).get('sos') === '1') {
    setTimeout(() => activateEmergency('Atajo de iPhone o enlace SOS'), 600);
  }
}

init();

# Guardian Senior AI Secure v6

Prototipo PWA local para ayudar a personas mayores a pedir ayuda de forma rápida desde iPhone, Android o navegador.

## Funciones principales

- Botón grande **PEDIR AYUDA**.
- Botón directo **LLAMAR 112**.
- Botón **ESTOY BIEN** con registro local mínimo.
- Aviso familiar por llamada y SMS.
- Mensaje de emergencia con ubicación opcional.
- Atajo de iPhone/Siri mediante enlace `?sos=1`.
- PIN familiar con PBKDF2 + sal.
- Notas médicas cifradas con AES-GCM.
- Teléfonos ocultos parcialmente en pantalla.
- Modo mayor y alto contraste.
- Diagnóstico interno de compatibilidad.
- PWA instalable y offline-first.

## Uso recomendado

1. Sube la carpeta a GitHub Pages o abre `index.html` en un navegador moderno.
2. Crea el PIN familiar.
3. Configura al menos un teléfono familiar.
4. Haz una prueba real de llamada, SMS y ubicación.
5. En iPhone, añade la app a pantalla de inicio desde Safari.
6. Crea un Atajo de Siri que abra el enlace SOS mostrado por la app.

## Importante

Esta app **no sustituye al 112**, a un Apple Watch con detección de caídas, a teleasistencia profesional ni a atención médica. Es un prototipo de ayuda familiar.

## Privacidad

La app no usa servidores, analíticas, anuncios, cookies externas ni IA externa. Los datos se guardan en el navegador del dispositivo. Si la publicas en GitHub Pages, la app sigue sin enviar datos, aunque la plataforma de hosting puede tener registros técnicos propios.

## Limitaciones

- Los SMS y llamadas dependen del sistema operativo.
- La ubicación requiere permiso del usuario.
- El dictado de voz no funciona igual en todos los navegadores; en iPhone es mejor usar Siri + Atajos.
- Si se pierde el PIN, las notas médicas cifradas no se pueden recuperar.

## Archivos

- `index.html`: interfaz.
- `style.css`: diseño responsive y accesible.
- `app.js`: lógica local, PIN, cifrado, SOS y diagnóstico.
- `manifest.json`: instalación PWA.
- `sw.js`: funcionamiento offline.
- `PRIVACY.md`: privacidad.
- `SECURITY.md`: seguridad.
- `TESTING.md`: plan de pruebas.
- `CHANGELOG.md`: cambios.

## Licencia

MIT. Úsala con responsabilidad.
